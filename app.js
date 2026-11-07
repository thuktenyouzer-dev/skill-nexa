
require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');

const indexRoutes = require('./routes/index');
const apiRoutes = require('./routes/api');

const app = express();

// Trust proxy in production
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// View engine configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false, limit: '30kb' }));
app.use(express.json({ limit: '30kb' }));

// Session configuration
app.use(session({
    name: 'skillnexa.sid',
    secret: process.env.SESSION_SECRET || 'development-only-change-this-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 8
    }
}));

// Global template variables
app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    res.locals.currentPath = req.path;
    res.locals.notice = req.query.notice || '';
    next();
});

// Application routes
app.use('/', indexRoutes);
app.use('/api', apiRoutes);

// 404 handler
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            error: 'API endpoint not found.'
        });
    }

    res.status(404).render('404', {
        title: 'Page not found'
    });
});

// Error handler
app.use((error, req, res, next) => {
    console.error(error);

    if (res.headersSent) {
        return next(error);
    }

    const status = error.status || 500;

    if (req.path.startsWith('/api/')) {
        return res.status(status).json({
            error: status === 500
                ? 'An unexpected server error occurred.'
                : error.message
        });
    }

    res.status(status).render('error', {
        title: 'Something went wrong',
        message: status === 500
            ? 'An unexpected server error occurred. Please try again.'
            : error.message
    });
});

// Export Express app for testing
module.exports = app;
