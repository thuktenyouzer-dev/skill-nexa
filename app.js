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
app.use(express.urlencoded({ extended: false }));

// Connect the website routes.
const indexRoutes = require('./routes/index');
app.use('/', indexRoutes);

// Display a useful message when a database-backed page fails.
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

const server = app.listen(PORT, () => {
  console.log(`Skill Nexa running at http://localhost:${PORT}`);
});

// Verify the PostgreSQL connection as required by Lab 3 Part H.
db.connect()
  .then((connection) => {
    connection.done();
    console.log('PostgreSQL connection verified.');
  })
  .catch((error) => {
    console.error('PostgreSQL connection could not be verified:', error.message);
  });

module.exports = app;
