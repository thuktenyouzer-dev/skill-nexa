const express = require('express');
const path = require('path');
require('dotenv').config();

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

// Start the development server.
app.listen(PORT, () => {
  console.log(`Skill Nexa running at http://localhost:${PORT}`);
});
