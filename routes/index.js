const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');

router.get('/', homeController.index);
router.get('/jobs', homeController.jobsPage);
router.get('/jobs/:id', homeController.jobDetails);

module.exports = router;
