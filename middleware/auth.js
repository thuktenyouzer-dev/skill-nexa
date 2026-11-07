
// Check whether the user is logged in
function requireAuth(req, res, next) {
    if (!req.session?.user) {
        return res.redirect('/login');
    }

    next();
}

// Check the user's role
function requireRole(role) {
    return function roleGuard(req, res, next) {
        if (!req.session?.user) {
            return res.redirect('/login');
        }

        if (req.session.user.role !== role) {
            return res.status(403).render('403', {
                title: 'Access denied'
            });
        }

        next();
    };
}

// API authentication
function requireAuthApi(req, res, next) {
    if (!req.session?.user) {
        return res.status(401).json({
            error: 'Authentication is required.'
        });
    }

    next();
}

// API role authentication
function requireRoleApi(role) {
    return function apiRoleGuard(req, res, next) {
        if (!req.session?.user) {
            return res.status(401).json({
                error: 'Authentication is required.'
            });
        }

        if (req.session.user.role !== role) {
            return res.status(403).json({
                error: 'You do not have permission to perform this action.'
            });
        }

        next();
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
