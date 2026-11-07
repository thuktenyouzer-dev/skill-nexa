
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
function validateRegistration(input) {
    const errors = [];

    if (!input.name || input.name.trim().length < 2) {
        errors.push('Name must contain at least 2 characters.');
    }

    if (input.name && input.name.length > 100) {
        errors.push('Name cannot exceed 100 characters.');
    }

    if (!isValidEmail(input.email)) {
        errors.push('Please enter a valid email address.');
    }

    if (typeof input.password !== 'string' || input.password.length < 8) {
        errors.push('Password must contain at least 8 characters.');
    }

    if (input.password !== input.confirmPassword) {
        errors.push('Password confirmation does not match.');
    }

    return errors;
}


// Validate the optional resume URL and cover letter used by Lab 4/Lab 7 applications.
function validateApplication(input) {
    const errors = [];
    const resumeUrl = typeof input.resume_url === 'string' ? input.resume_url.trim() : '';
    const coverLetter = typeof input.cover_letter === 'string' ? input.cover_letter.trim() : '';

    if (resumeUrl) {
        if (resumeUrl.length > 500) {
            errors.push('Resume URL cannot exceed 500 characters.');
        } else {
            try {
                const url = new URL(resumeUrl);
                if (!['http:', 'https:'].includes(url.protocol)) {
                    errors.push('Resume URL must begin with http:// or https://.');
                }
            } catch (error) {
                errors.push('Enter a valid resume URL.');
            }
        }
    }

    if (coverLetter.length > 5000) {
        errors.push('Cover letter cannot exceed 5000 characters.');
    }

    return errors;
}
// Validate company review information for Lab 8
function validateReview(input) {
    const errors = [];

    const rating = Number(input.rating);
    const comment = typeof input.comment === 'string'
        ? input.comment.trim()
        : '';

    // Rating must be between 1 and 5
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        errors.push('Rating must be between 1 and 5.');
    }

    // Comment must contain at least 5 characters
    if (comment.length < 5) {
        errors.push('Comment must contain at least 5 characters.');
    }

    // Limit comment length
    if (comment.length > 2000) {
        errors.push('Comment cannot exceed 2000 characters.');
    }

    return errors;
}
// Export validation functions
// Export validation functions
module.exports = {
    cleanString,
    isValidEmail,
    validateRegistration,
    validateApplication,
    validateReview
};
