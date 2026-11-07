const Company = require('../models/Company');
const Job = require('../models/Job');
const CompanyReview = require('../models/CompanyReview');

// Display company details and reviews
exports.details = async (req, res) => {

    // Get company ID from URL
    const companyId = Number(req.params.id);

    // Find company in PostgreSQL
    const company = await Company.getById(companyId);

    if (!company) {
        return res.status(404).render('error', {
            title: 'Company not found',
            message: 'Company does not exist.'
        });
    }

    // Get company jobs
    const allJobs = await Job.getByCompany(company.id);

    // Show only active jobs
    const jobs = allJobs.filter(job =>
        job.is_active && job.status === 'active'
    );

    // Get company reviews from MongoDB
    const reviews = await CompanyReview.getByCompany(company.id);

    // Display company details page
    res.render('company-details', {
        title: company.name,
        company,
        jobs,
        reviews,
        currentUser: req.session.user || null,
        notice: req.query.notice || ''
    });
};