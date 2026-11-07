
const {
    isValidEmail,
    validateRegistration,
    validateJob,
    validateReview,
    validateApplication,
    isValidHttpUrl
} = require('../utils/validators');

describe('Skill Nexa input validation', () => {

    test('accepts a normal email address', () => {
        expect(isValidEmail('candidate@example.com')).toBe(true);
    });

    test('rejects an invalid email address', () => {
        expect(isValidEmail('not-an-email')).toBe(false);
    });

    test('requires matching passwords and a minimum length', () => {
        const errors = validateRegistration({
            name: 'Tashi Dorji',
            email: 'tashi@example.com',
            password: 'short',
            confirmPassword: 'different'
        });

        expect(errors).toContain(
            'Password must contain at least 8 characters.'
        );

        expect(errors).toContain(
            'The password confirmation does not match.'
        );
    });

    test('accepts a valid vacancy payload', () => {
        const errors = validateJob({
            title: 'Junior Web Developer',
            description: 'Build and maintain accessible websites with the product engineering team.',
            category: 'Information Technology',
            location: 'Thimphu, Bhutan',
            job_type: 'Full-time',
            salary_min: '18000',
            salary_max: '26000',
            deadline: '2027-02-01'
        });

        expect(errors).toHaveLength(0);
    });

    test('rejects salary ranges where the maximum is below the minimum', () => {
        const errors = validateJob({
            title: 'Web Developer',
            description: 'A sufficiently long job description for validation.',
            category: 'Information Technology',
            location: 'Thimphu',
            job_type: 'Full-time',
            salary_min: '30000',
            salary_max: '20000'
        });

        expect(errors).toContain(
            'Maximum salary cannot be lower than minimum salary.'
        );
    });

    test('validates review rating and comment', () => {
        expect(
            validateReview({ rating: 6, comment: 'Nice' }).length
        ).toBeGreaterThan(0);

        expect(
            validateReview({
                rating: 5,
                comment: 'Helpful and professional experience.'
            })
        ).toHaveLength(0);
    });

    test('accepts only HTTP and HTTPS resume links', () => {
        expect(
            validateApplication({
                resume_url: 'https://example.com/cv.pdf'
            })
        ).toHaveLength(0);

        expect(
            validateApplication({
                resume_url: 'javascript:alert(1)'
            })
        ).toContain('Resume URL must use HTTP or HTTPS.');
    });

    test('accepts optional company website only when it is HTTP or HTTPS', () => {
        expect(isValidHttpUrl('https://example.com')).toBe(true);
        expect(isValidHttpUrl('javascript:alert(1)')).toBe(false);
        expect(isValidHttpUrl('')).toBe(true);
    });

});
