
const session = require('express-session');
const express = require('express');
const path = require('path');
require('dotenv').config();

const db = require('./config/db');

// LAB 8: MongoDB connection
const {
    connectMongo,
    closeMongo
} = require('./config/mongo');

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

// LAB 7: Configure user sessions.
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

// Make the signed-in user available to every EJS page.
app.use((req, res, next) => {
    res.locals.currentUser =
        req.session && req.session.user
            ? req.session.user
            : null;

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

// Start the server after connecting the databases.
async function startServer() {

    try {

        // Verify PostgreSQL connection.
        await db.one('SELECT 1');

        console.log('PostgreSQL connection verified.');

        // Connect to MongoDB Atlas.
        const mongoDatabase = await connectMongo();

        if (mongoDatabase) {
            console.log('MongoDB connection verified.');
        } else {
            console.warn('MongoDB is not configured. Company reviews are unavailable.');
        }

        // Start the website.
        const server = app.listen(PORT, () => {
            console.log(`Skill Nexa running at http://localhost:${PORT}`);
        });

        // Close database connections when the server stops.
        const shutdown = () => {

            console.log('Shutting down Skill Nexa...');

            server.close(async () => {

                try {
                    await closeMongo();
                    await db.$pool.end();

                } catch (error) {
                    console.error('Shutdown error:', error.message);
                }

                process.exit(0);
            });
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

    } catch (error) {

        console.error(
            'Unable to start Skill Nexa:',
            error.message
        );

        process.exit(1);
    }
}

// Run the server when app.js is executed directly.
if (require.main === module) {
    startServer();
}

module.exports = app;
