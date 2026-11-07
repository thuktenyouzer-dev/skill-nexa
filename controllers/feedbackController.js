const Company = require('../models/Company');
const CompanyReview = require('../models/CompanyReview');
const { validateReview } = require('../utils/validators');

// Submit a company review
exports.createReview = async (req, res) => {

    // Get company ID from the URL
    const companyId = Number(req.params.id);

    // Check whether the company exists
    const company = await Company.getById(companyId);

    if (!company) {
        return res.status(404).send('Company not found.');
    }

    // Get rating and comment from the form
    const rating = Number(req.body.rating);
    const comment = String(req.body.comment || '').trim();

    // Validate the review
    const errors = validateReview({
        rating,
        comment
    });

    if (errors.length > 0) {
        return res.status(400).redirect(
            `/companies/${companyId}?notice=${encodeURIComponent(errors.join(' '))}`
        );
    }

    // Save the review in MongoDB
    await CompanyReview.createReview({
        companyId: company.id,
        userId: req.session.user.id,
        reviewerName: req.session.user.name,
        rating,
        comment
    });

    // Redirect to the company page
    res.redirect(
        `/companies/${companyId}?notice=Review submitted successfully.`
    );
};