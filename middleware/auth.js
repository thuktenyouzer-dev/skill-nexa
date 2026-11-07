// Browser authentication middleware.
function requireAuth(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.redirect('/login');
    }
    return next();
}

// Protect a page or action for one specific role.
function requireRole(role) {
    return function roleGuard(req, res, next) {
        if (!req.session || !req.session.user) {
            return res.redirect('/login');
        }

        if (req.session.user.role !== role) {
            return res.status(403).render('403', {
                title: 'Access denied',
                message: 'Your account does not have permission to open this page.'
            });
        }

        return next();
    };
}

// API requests receive JSON errors rather than browser redirects.
function requireAuthApi(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Authentication is required.' });
    }
    return next();
}

function requireRoleApi(role) {
    return function apiRoleGuard(req, res, next) {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ error: 'Authentication is required.' });
        }

        if (req.session.user.role !== role) {
            return res.status(403).json({
                error: 'You do not have permission to perform this action.'
            });
        }

        return next();
    };
}

module.exports = {
    requireAuth,
    requireJobSeeker: requireRole('job_seeker'),
    requireEmployer: requireRole('employer'),
    requireSuperAdmin: requireRole('superadmin'),
    requireAuthApi,
    requireJobSeekerApi: requireRoleApi('job_seeker')
};
