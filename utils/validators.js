
// Clean and validate text input
function cleanString(value, maxLength = 255) {
    if (typeof value !== 'string') {
        return '';
    }

    return value.trim().slice(0, maxLength);
}

// Check whether an email address is valid
function isValidEmail(email) {
    if (typeof email !== 'string') {
        return false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailPattern.test(email);
}

// Validate registration information
function validateRegistration(input = {}) {
    const errors = [];

    const name = typeof input.name === 'string'
        ? input.name.trim()
        : '';

    if (name.length < 2) {
        errors.push('Name must contain at least 2 characters.');
    }

    if (name.length > 100) {
        errors.push('Name cannot exceed 100 characters.');
    }

    if (!isValidEmail(input.email)) {
        errors.push('Please enter a valid email address.');
    }

    if (typeof input.password !== 'string' || input.password.length < 8) {
        errors.push('Password must contain at least 8 characters.');
    }

    if (input.password !== input.confirmPassword) {
        errors.push('The password confirmation does not match.');
    }

    return errors;
}

// Check whether an optional URL uses HTTP or HTTPS
function isValidHttpUrl(value) {
    if (typeof value !== 'string') {
        return false;
    }

    const trimmedUrl = value.trim();

    // Empty URL is allowed because the field is optional
    if (trimmedUrl === '') {
        return true;
    }

    try {
        const url = new URL(trimmedUrl);

        return (
            ['http:', 'https:'].includes(url.protocol) &&
            url.hostname.length > 0
        );
    } catch (error) {
        return false;
    }
}

// Validate job vacancy information
function validateJob(input = {}) {
    const errors = [];

    const title = cleanString(input.title, 140);
    const description = cleanString(input.description, 10000);
    const category = cleanString(input.category, 80);
    const location = cleanString(input.location, 120);
    const jobType = cleanString(input.job_type, 30);

    const allowedJobTypes = [
        'Full-time',
        'Part-time',
        'Contract',
        'Internship',
        'Temporary'
    ];

    if (title.length < 3) {
        errors.push('Job title must contain at least 3 characters.');
    }

    if (description.length < 10) {
        errors.push('Please enter a job description of at least 10 characters.');
    }

    if (!category) {
        errors.push('Please enter a job category.');
    }

    if (!location) {
        errors.push('Please enter the job location.');
    }

    if (!allowedJobTypes.includes(jobType)) {
        errors.push('Choose a valid employment type.');
    }

    const salaryMin = input.salary_min === '' ||
        input.salary_min === null ||
        input.salary_min === undefined
        ? null
        : Number(input.salary_min);

    const salaryMax = input.salary_max === '' ||
        input.salary_max === null ||
        input.salary_max === undefined
        ? null
        : Number(input.salary_max);

    if (salaryMin !== null &&
        (!Number.isFinite(salaryMin) || salaryMin < 0)) {
        errors.push('Minimum salary must be a valid non-negative number.');
    }

    if (salaryMax !== null &&
        (!Number.isFinite(salaryMax) || salaryMax < 0)) {
        errors.push('Maximum salary must be a valid non-negative number.');
    }

    if (salaryMin !== null &&
        salaryMax !== null &&
        Number.isFinite(salaryMin) &&
        Number.isFinite(salaryMax) &&
        salaryMax < salaryMin) {
        errors.push('Maximum salary cannot be lower than minimum salary.');
    }

    const deadline = cleanString(input.deadline, 10);

    if (deadline) {
        const parsedDate = new Date(`${deadline}T00:00:00Z`);

        const validDate =
            /^\d{4}-\d{2}-\d{2}$/.test(deadline) &&
            !Number.isNaN(parsedDate.getTime()) &&
            parsedDate.toISOString().slice(0, 10) === deadline;

        if (!validDate) {
            errors.push('Choose a valid application deadline.');
        }
    }

    return errors;
}

// Validate application information
function validateApplication(input = {}) {
    const errors = [];

    const resumeUrl = typeof input.resume_url === 'string'
        ? input.resume_url.trim()
        : '';

    const coverLetter = typeof input.cover_letter === 'string'
        ? input.cover_letter.trim()
        : '';

    if (resumeUrl.length > 500) {
        errors.push('Resume URL cannot exceed 500 characters.');
    } else if (!isValidHttpUrl(resumeUrl)) {
        errors.push('Resume URL must use HTTP or HTTPS.');
    }

    if (coverLetter.length > 5000) {
        errors.push('Cover letter cannot exceed 5000 characters.');
    }

    return errors;
}

// Validate company review information
function validateReview(input = {}) {
    const errors = [];

    const rating = Number(input.rating);

    const comment = typeof input.comment === 'string'
        ? input.comment.trim()
        : '';

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        errors.push('Rating must be between 1 and 5.');
    }

    if (comment.length < 5) {
        errors.push('Comment must contain at least 5 characters.');
    }

    if (comment.length > 2000) {
        errors.push('Comment cannot exceed 2000 characters.');
    }

    return errors;
}

// Export validation functions
module.exports = {
    cleanString,
    isValidEmail,
    validateRegistration,
    validateJob,
    validateApplication,
    validateReview,
    isValidHttpUrl
};
