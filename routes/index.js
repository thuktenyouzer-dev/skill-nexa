
const express = require('express');
const router = express.Router();

const homeController = require('../controllers/homeController');
const jobController = require('../controllers/jobController');

// Homepage
router.get('/', homeController.index);

// Job listings page
router.get('/jobs', jobController.list);

// Individual job details page
router.get('/jobs/:id', jobController.details);

module.exports = router;
