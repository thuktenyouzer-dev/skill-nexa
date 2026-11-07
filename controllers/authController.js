
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const User = require('../models/User');
const mailer = require('../config/mailer');
const {
    validateRegistration,
    isValidEmail,
    cleanString
} = require('../utils/validators');

// Hash security tokens
function hashToken(rawToken) {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
}

// Redirect users according to their roles
function dashboardFor(role) {
    if (role === 'superadmin') return '/superadmin';
    if (role === 'employer') return '/employer';
    return '/dashboard';
}

// Display registration page
exports.getRegister = (req, res) => {
    res.render('auth/signup', {
        title: 'Create your account',
        errors: []
    });
};

// Register new Job Seeker
exports.register = async (req, res) => {
    const input = {
        name: cleanString(req.body.name, 100),
        email: cleanString(req.body.email, 254).toLowerCase(),
        password: req.body.password,
        confirmPassword: req.body.confirm_password
    };

    const errors = validateRegistration(input);

    if (errors.length) {
        return res.status(400).render('auth/signup', {
            title: 'Create your account',
            errors,
            formData: input
        });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const passwordHash = await bcrypt.hash(input.password, 12);

    try {
        const user = await User.createUser({
            name: input.name,
            email: input.email,
            passwordHash,
            verificationTokenHash: hashToken(verificationToken)
        });

        await mailer.sendVerificationEmail(user, verificationToken);

    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).render('auth/signup', {
                title: 'Create your account',
                errors: ['An account with this email already exists.'],
                formData: input
            });
        }

        throw error;
    }

    res.render('auth/signup-success', {
        title: 'Check your email',
        email: input.email
    });
};

// Verify email address
exports.verifyEmail = async (req, res) => {
    const user = await User.verifyEmail(hashToken(req.params.token));

    if (!user) {
        return res.status(400).render('auth/verification-result', {
            title: 'Verification link invalid',
            success: false,
            message: 'This verification link is invalid or has already been used.'
        });
    }

    res.render('auth/verification-result', {
        title: 'Email verified',
        success: true,
        message: 'Your email address has been verified. You can now sign in.'
    });
};

// Display the form for requesting another verification email.
exports.getResendVerification = (req, res) => {
    res.render('auth/resend-verification', {
        title: 'Resend verification email',
        message: '',
        errors: []
    });
};

// Send a fresh verification link without revealing whether an email is registered.
exports.resendVerification = async (req, res) => {
    const email = cleanString(req.body.email, 254).toLowerCase();

    if (!isValidEmail(email)) {
        return res.status(400).render('auth/resend-verification', {
            title: 'Resend verification email',
            message: '',
            errors: ['Enter a valid email address.']
        });
    }

    const user = await User.findByEmail(email);

    if (user && !user.is_verified) {
        const verificationToken = crypto.randomBytes(32).toString('hex');
        await User.saveVerificationToken(user.id, hashToken(verificationToken));
        await mailer.sendVerificationEmail(user, verificationToken);
    }

    res.render('auth/resend-verification', {
        title: 'Resend verification email',
        message: 'If an unverified account exists for that email, a new verification link has been sent. In local development without Gmail settings, check the terminal running Skill Nexa for the link.',
        errors: []
    });
};

// Display login page
exports.getLogin = (req, res) => {
    res.render('auth/login', {
        title: 'Sign in',
        errors: []
    });
};

// Login user
exports.login = async (req, res) => {
    const email = cleanString(req.body.email, 254).toLowerCase();

    const password = typeof req.body.password === 'string'
        ? req.body.password
        : '';

    const user = isValidEmail(email)
        ? await User.findByEmail(email)
        : null;

    const matches = user
        ? await User.verifyPassword(password, user.password_hash)
        : false;

    if (!matches) {
        return res.status(401).render('auth/login', {
            title: 'Sign in',
            errors: ['Email or password is incorrect.']
        });
    }

    if (!user.is_verified) {
        return res.status(403).render('auth/login', {
            title: 'Sign in',
            errors: ['Please verify your email address before signing in.']
        });
    }

    req.session.regenerate((error) => {
        if (error) {
            return res.status(500).render('error', {
                title: 'Sign in error',
                message: 'Unable to start a secure session.'
            });
        }

        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        res.redirect(dashboardFor(user.role));
    });
};

// Logout user
exports.logout = (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            return res.status(500).render('error', {
                title: 'Sign out error',
                message: 'Unable to end your session.'
            });
        }

        res.clearCookie('skillnexa.sid');
        res.redirect('/');
    });
};

// Display forgot password page
exports.getForgotPassword = (req, res) => {
    res.render('auth/forgot-password', {
        title: 'Forgot password',
        message: '',
        errors: []
    });
};

// Send password reset link
exports.forgotPassword = async (req, res) => {
    const email = cleanString(req.body.email, 254).toLowerCase();

    if (!isValidEmail(email)) {
        return res.status(400).render('auth/forgot-password', {
            title: 'Forgot password',
            message: '',
            errors: ['Enter a valid email address.']
        });
    }

    const user = await User.findByEmail(email);

    if (user) {
        const rawToken = crypto.randomBytes(32).toString('hex');

        await User.savePasswordResetToken(
            user.id,
            hashToken(rawToken),
            new Date(Date.now() + 30 * 60 * 1000)
        );

        await mailer.sendPasswordResetEmail(user, rawToken);
    }

    res.render('auth/forgot-password', {
        title: 'Forgot password',
        message: 'If an account exists for that email, a password-reset link has been sent.',
        errors: []
    });
};

// Display reset password page
exports.getResetPassword = async (req, res) => {
    const user = await User.findByValidResetToken(
        hashToken(req.params.token)
    );

    if (!user) {
        return res.status(400).render('auth/reset-password', {
            title: 'Reset password',
            token: '',
            errors: ['This reset link is invalid or expired.']
        });
    }

    res.render('auth/reset-password', {
        title: 'Reset password',
        token: req.params.token,
        errors: []
    });
};

// Reset user password
exports.resetPassword = async (req, res) => {
    // Correctly obtain token from the URL
    const token = String(req.params.token || '');

    const password = typeof req.body.password === 'string'
        ? req.body.password
        : '';

    const confirmation = typeof req.body.confirm_password === 'string'
        ? req.body.confirm_password
        : '';

    const errors = [];

    if (password.length < 8) {
        errors.push('Password must contain at least 8 characters.');
    }

    if (password !== confirmation) {
        errors.push('The password confirmation does not match.');
    }

    const user = await User.findByValidResetToken(hashToken(token));

    if (!user) {
        errors.push('This reset link is invalid or expired.');
    }

    if (errors.length) {
        return res.status(400).render('auth/reset-password', {
            title: 'Reset password',
            token,
            errors
        });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await User.updatePassword(user.id, passwordHash);

    res.render('auth/password-reset-success', {
        title: 'Password updated'
    });
};

// Job Seeker dashboard
exports.dashboard = async (req, res) => {
    const Application = require('../models/Application');

    const applications = await Application.getForApplicant(
        req.session.user.id
    );

    const profile = await User.findById(req.session.user.id);

    res.render('dashboard', {
        title: 'Job seeker dashboard',
        applications,
        profile,
        notice: req.query.notice || ''
    });
};

// Update Job Seeker profile
exports.updateProfile = async (req, res) => {
    const name = cleanString(req.body.name, 100);

    if (name.length < 2) {
        return res.redirect(
            '/dashboard?notice=Please%20enter%20a%20valid%20name.'
        );
    }

    const updated = await User.updateProfile(
        req.session.user.id,
        name
    );

    req.session.user.name = updated.name;

    res.redirect('/dashboard?notice=Profile%20updated.');
};

module.exports = exports;
