
const session = require('express-session');
const express = require('express');
const path = require('path');
require('dotenv').config();

const db = require('./config/db');
const app = express();
const PORT = process.env.PORT || 3000;

// Configure EJS templates.
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve CSS, JavaScript and image files from public/.
app.use(express.static(path.join(__dirname, 'public')));

// Read data submitted by HTML forms.
app.use(express.urlencoded({
    extended: false,
    limit: '30kb'
}));

// Read JSON requests.
app.use(express.json({
    limit: '30kb'
}));

// LAB 7 PART E: Configure user sessions.
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

// Make the signed-in user available to every EJS page (navigation, buttons and role labels).
app.use((req, res, next) => {
    res.locals.currentUser = req.session && req.session.user ? req.session.user : null;
    next();
});

// Connect the website routes.
const indexRoutes = require('./routes/index');
app.use('/', indexRoutes);

// Connect the API routes.
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Display a useful message when a page fails.
app.use((error, req, res, next) => {
    console.error('Application error:', error);

    if (res.headersSent) return next(error);

    return res.status(500).render('error', {
        title: 'Application error',
        message: process.env.NODE_ENV === 'development'
            ? error.message
            : 'Please try again later.'
    });
});

// Start the server.
const server = app.listen(PORT, () => {
    console.log(`Skill Nexa running at http://localhost:${PORT}`);
});

// Verify PostgreSQL connection.
db.connect()
    .then((connection) => {
        connection.done();
        console.log('PostgreSQL connection verified.');
    })
    .catch((error) => {
        console.error(
            'PostgreSQL connection could not be verified:',
            error.message
        );
    });

module.exports = app;
