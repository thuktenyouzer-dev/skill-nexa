const Job = require('../models/Job');

function queryText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

// Display database-driven job listings and apply the search filters.
exports.list = async (req, res, next) => {
  try {
    const filters = {
      q: queryText(req.query.q),
      location: queryText(req.query.location),
      category: queryText(req.query.category),
      job_type: queryText(req.query.job_type)
    };

    const [jobs, categories] = await Promise.all([
      Job.search(filters),
      Job.getCategories()
    ]);

    return res.render('jobs', {
      title: 'Find Jobs',
      jobs,
      categories,
      filters
    });
  } catch (error) {
    return next(error);
  }
};

// Display one active job. Invalid or missing IDs return an HTTP 404 page.
exports.details = async (req, res, next) => {
  try {
    const idText = req.params.id;
    const jobId = Number(idText);

    if (!/^\d+$/.test(idText) || !Number.isSafeInteger(jobId) || jobId < 1) {
      return res.status(404).render('job-not-found', {
        title: 'Job not found',
        jobId: idText
      });
    }

    const job = await Job.getById(jobId);

    if (!job) {
      return res.status(404).render('job-not-found', {
        title: 'Job not found',
        jobId: idText
      });
    }

    return res.render('job-details', {
      title: job.title,
      job,
      notice: queryText(req.query.notice)
    });
  } catch (error) {
    return next(error);
  }
};


// Submit a vacancy application as the authenticated Job Seeker.
// Applicant identity is taken from the session, never from form fields.
exports.apply = async (req, res) => {
  const jobId = Number(req.params.id);
  if (!Number.isSafeInteger(jobId) || jobId < 1) {
    return res.status(404).render('job-not-found', { title: 'Job not found', jobId: req.params.id });
  }

  const job = await Job.getById(jobId);
  if (!job) {
    return res.status(404).render('job-not-found', { title: 'Job not found', jobId: req.params.id });
  }

  const validator = require('../utils/validators');
  const input = {
    resume_url: validator.cleanString(req.body.resume_url, 500),
    cover_letter: validator.cleanString(req.body.cover_letter, 5000)
  };
  const errors = validator.validateApplication(input);
  if (errors.length) {
    return res.status(400).render('error', {
      title: 'Application needs attention',
      message: errors.join(' ')
    });
  }

  const Application = require('../models/Application');
  try {
    await Application.createApplication({
      jobId,
      applicantId: req.session.user.id,
      applicantName: req.session.user.name,
      applicantEmail: req.session.user.email,
      resumeUrl: input.resume_url,
      coverLetter: input.cover_letter
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.redirect(`/jobs/${jobId}?notice=${encodeURIComponent('You have already applied for this vacancy.')}`);
    }
    if (/no longer accepting/i.test(error.message)) {
      return res.status(409).render('error', { title: 'Applications closed', message: error.message });
    }
    throw error;
  }

  return res.redirect(`/jobs/${jobId}?notice=${encodeURIComponent('Your application was submitted successfully.')}`);
};

// An applicant can withdraw only their own application.
exports.withdrawApplication = async (req, res) => {
  const Application = require('../models/Application');
  const applicationId = Number(req.params.id);
  if (!Number.isSafeInteger(applicationId) || applicationId < 1) {
    return res.status(404).render('error', {
      title: 'Application not found',
      message: 'The requested application could not be found.'
    });
  }
  const result = await Application.withdrawApplication(applicationId, req.session.user.id);
  if (!result) {
    return res.status(404).render('error', {
      title: 'Application not found',
      message: 'This application cannot be withdrawn because it was not found or is no longer withdrawable.'
    });
  }
  return res.redirect('/dashboard?notice=Application%20withdrawn.');
};
