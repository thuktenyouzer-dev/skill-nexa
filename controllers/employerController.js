const Company = require('../models/Company');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { cleanString } = require('../utils/validators');

const ALLOWED_JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary'];
const ALLOWED_APPLICATION_STATUSES = ['reviewing', 'shortlisted', 'accepted', 'rejected'];

function getJobInput(body = {}) {
    const salaryMinText = cleanString(body.salary_min, 30);
    const salaryMaxText = cleanString(body.salary_max, 30);
    const salaryMin = salaryMinText === '' ? null : Number(salaryMinText);
    const salaryMax = salaryMaxText === '' ? null : Number(salaryMaxText);
    const deadline = cleanString(body.deadline, 10);

    return {
        title: cleanString(body.title, 140),
        description: cleanString(body.description, 10000),
        category: cleanString(body.category, 80),
        location: cleanString(body.location, 120),
        job_type: cleanString(body.job_type, 30),
        experience_level: cleanString(body.experience_level, 80) || 'Not specified',
        salary_min: salaryMin,
        salary_max: salaryMax,
        salary_currency: cleanString(body.salary_currency, 8).toUpperCase() || 'BTN',
        deadline: deadline || null
    };
}

function validateJobInput(input) {
    const errors = [];

    if (input.title.length < 3) errors.push('Job title must contain at least 3 characters.');
    if (input.description.length < 10) errors.push('Please enter a job description of at least 10 characters.');
    if (!input.category) errors.push('Please enter a job category.');
    if (!input.location) errors.push('Please enter the job location.');
    if (!ALLOWED_JOB_TYPES.includes(input.job_type)) errors.push('Choose a valid employment type.');
    if (input.salary_min !== null && (!Number.isFinite(input.salary_min) || input.salary_min < 0)) {
        errors.push('Minimum salary must be a valid non-negative number.');
    }
    if (input.salary_max !== null && (!Number.isFinite(input.salary_max) || input.salary_max < 0)) {
        errors.push('Maximum salary must be a valid non-negative number.');
    }
    if (input.salary_min !== null && input.salary_max !== null && input.salary_max < input.salary_min) {
        errors.push('Maximum salary cannot be lower than minimum salary.');
    }
    if (input.deadline) {
        const parsedDate = new Date(`${input.deadline}T00:00:00Z`);
        const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(input.deadline)
            && !Number.isNaN(parsedDate.getTime())
            && parsedDate.toISOString().slice(0, 10) === input.deadline;
        if (!isValidDate) errors.push('Choose a valid application deadline.');
    }

    return errors;
}

async function findEmployerCompany(userId) {
    return Company.getByOwnerId(userId);
}

function renderJobForm(res, { title, heading, action, job, errors = [] }, status = 200) {
    return res.status(status).render('employer-job-form', {
        title,
        heading,
        action,
        job: job || {},
        errors,
        jobTypes: ALLOWED_JOB_TYPES
    });
}

// Employer dashboard: every displayed resource belongs to the signed-in employer's company.
exports.dashboard = async (req, res) => {
    const company = await findEmployerCompany(req.session.user.id);

    if (!company) {
        return res.status(403).render('403', {
            title: 'Company not assigned',
            message: 'A Superadmin must assign a company to this Employer account before it can manage vacancies.'
        });
    }

    const [jobs, applications] = await Promise.all([
        Job.getByCompany(company.id),
        Application.getForCompany(company.id)
    ]);

    return res.render('employer-dashboard', {
        title: 'Employer dashboard',
        company,
        jobs,
        applications,
        notice: cleanString(req.query.notice, 300)
    });
};

exports.getNewJob = async (req, res) => {
    const company = await findEmployerCompany(req.session.user.id);
    if (!company) {
        return res.status(403).render('403', {
            title: 'Company not assigned',
            message: 'A Superadmin must assign a company to this Employer account first.'
        });
    }

    return renderJobForm(res, {
        title: 'Post a vacancy',
        heading: 'Create a new vacancy',
        action: '/employer/jobs',
        job: {}
    });
};

exports.createJob = async (req, res) => {
    const company = await findEmployerCompany(req.session.user.id);
    if (!company) {
        return res.status(403).render('403', {
            title: 'Company not assigned',
            message: 'A Superadmin must assign a company to this Employer account first.'
        });
    }

    const input = getJobInput(req.body);
    const errors = validateJobInput(input);
    if (errors.length) {
        return renderJobForm(res, {
            title: 'Post a vacancy',
            heading: 'Create a new vacancy',
            action: '/employer/jobs',
            job: input,
            errors
        }, 400);
    }

    await Job.createJob(company.id, input);
    return res.redirect('/employer?notice=Vacancy%20created%20successfully.');
};

exports.getEditJob = async (req, res) => {
    const company = await findEmployerCompany(req.session.user.id);
    if (!company) {
        return res.status(403).render('403', {
            title: 'Company not assigned',
            message: 'A Superadmin must assign a company to this Employer account first.'
        });
    }

    const jobId = Number(req.params.id);
    const jobs = await Job.getByCompany(company.id);
    const job = jobs.find((item) => Number(item.id) === jobId);

    if (!Number.isSafeInteger(jobId) || !job) {
        return res.status(404).render('error', {
            title: 'Vacancy not found',
            message: 'The requested vacancy was not found for your company.'
        });
    }

    return renderJobForm(res, {
        title: 'Edit vacancy',
        heading: 'Update vacancy',
        action: `/employer/jobs/${job.id}`,
        job
    });
};

exports.updateJob = async (req, res) => {
    const company = await findEmployerCompany(req.session.user.id);
    if (!company) {
        return res.status(403).render('403', {
            title: 'Company not assigned',
            message: 'A Superadmin must assign a company to this Employer account first.'
        });
    }

    const jobId = Number(req.params.id);
    if (!Number.isSafeInteger(jobId) || jobId < 1) {
        return res.status(404).render('error', {
            title: 'Vacancy not found',
            message: 'The requested vacancy could not be found.'
        });
    }

    const input = getJobInput(req.body);
    const errors = validateJobInput(input);
    if (errors.length) {
        return renderJobForm(res, {
            title: 'Edit vacancy',
            heading: 'Update vacancy',
            action: `/employer/jobs/${jobId}`,
            job: input,
            errors
        }, 400);
    }

    const updated = await Job.updateJob(jobId, company.id, input);
    if (!updated) {
        return res.status(404).render('error', {
            title: 'Vacancy not found',
            message: 'The vacancy does not belong to your company or is no longer active.'
        });
    }

    return res.redirect('/employer?notice=Vacancy%20updated%20successfully.');
};

exports.closeJob = async (req, res) => {
    const company = await findEmployerCompany(req.session.user.id);
    if (!company) {
        return res.status(403).render('403', {
            title: 'Company not assigned',
            message: 'A Superadmin must assign a company to this Employer account first.'
        });
    }

    const jobId = Number(req.params.id);
    if (!Number.isSafeInteger(jobId) || jobId < 1) {
        return res.status(404).render('error', { title: 'Vacancy not found', message: 'The requested vacancy could not be found.' });
    }
    const closed = await Job.closeJob(jobId, company.id);
    if (!closed) {
        return res.status(404).render('error', {
            title: 'Vacancy not found',
            message: 'The vacancy does not belong to your company or is already closed.'
        });
    }

    return res.redirect('/employer?notice=Vacancy%20closed%20successfully.');
};

exports.updateApplicationStatus = async (req, res) => {
    const company = await findEmployerCompany(req.session.user.id);
    if (!company) {
        return res.status(403).render('403', {
            title: 'Company not assigned',
            message: 'A Superadmin must assign a company to this Employer account first.'
        });
    }

    const applicationId = Number(req.params.id);
    if (!Number.isSafeInteger(applicationId) || applicationId < 1) {
        return res.status(404).render('error', { title: 'Application not found', message: 'The requested application could not be found.' });
    }

    const status = cleanString(req.body.status, 20);
    if (!ALLOWED_APPLICATION_STATUSES.includes(status)) {
        return res.redirect('/employer?notice=Choose%20a%20valid%20application%20status.');
    }

    const updated = await Application.updateStatus(applicationId, company.id, status);
    if (!updated) {
        return res.status(404).render('error', {
            title: 'Application not found',
            message: 'This application does not belong to a vacancy owned by your company.'
        });
    }

    return res.redirect('/employer?notice=Application%20status%20updated.');
};
