const User = require('../models/User');
const Company = require('../models/Company');
const Job = require('../models/Job');
const { cleanString, isValidEmail } = require('../utils/validators');

exports.dashboard = async (req, res) => {
    const [counts, users, companies, jobs] = await Promise.all([
        User.getCounts(),
        User.getAllUsers(),
        Company.getAllForAdmin(),
        Job.getAllForAdmin()
    ]);

    return res.render('superadmin-dashboard', {
        title: 'Superadmin dashboard',
        counts,
        users,
        companies,
        jobs,
        notice: cleanString(req.query.notice, 300)
    });
};

exports.createCompany = async (req, res) => {
    const input = {
        name: cleanString(req.body.name, 150),
        description: cleanString(req.body.description, 5000),
        industry: cleanString(req.body.industry, 100),
        location: cleanString(req.body.location, 150),
        website: cleanString(req.body.website, 300)
    };

    const errors = [];
    if (input.name.length < 2) errors.push('Company name must contain at least 2 characters.');
    if (input.description.length < 10) errors.push('Company description must contain at least 10 characters.');
    if (!input.industry) errors.push('Enter the company industry.');
    if (!input.location) errors.push('Enter the company location.');

    if (input.website) {
        try {
            const url = new URL(input.website);
            if (!['http:', 'https:'].includes(url.protocol)) errors.push('Company website must use HTTP or HTTPS.');
        } catch (error) {
            errors.push('Enter a valid company website URL.');
        }
    }

    if (errors.length) {
        return res.status(400).render('error', {
            title: 'Company details need attention',
            message: errors.join(' ')
        });
    }

    await Company.createCompany(input);
    return res.redirect('/superadmin?notice=Company%20profile%20created.');
};

exports.promoteUser = async (req, res) => {
    const userId = Number(req.params.id);
    const companyId = Number(req.body.company_id);

    if (!Number.isSafeInteger(userId) || userId < 1 || !Number.isSafeInteger(companyId) || companyId < 1) {
        return res.redirect('/superadmin?notice=Select%20a%20valid%20user%20and%20company.');
    }

    try {
        await User.promoteToEmployer(userId, companyId);
        return res.redirect('/superadmin?notice=Employer%20role%20and%20company%20assignment%20saved.');
    } catch (error) {
        if (error.code) throw error;
        return res.redirect(`/superadmin?notice=${encodeURIComponent(error.message)}`);
    }
};
