const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const apiController = require('../controllers/apiController');

const auth = require('../middleware/auth');
 
router.get('/jobs', asyncHandler(apiController.getJobs));
router.get('/jobs/:id', asyncHandler(apiController.getJob));
router.get('/companies/:id', asyncHandler(apiController.getCompany));
router.get('/companies/:id/jobs', asyncHandler(apiController.getCompanyJobs));
router.get('/applications/:id', auth.requireAuthApi, asyncHandler(apiController.getApplication));
router.post('/applications', auth.requireAuthApi, auth.requireJobSeekerApi, asyncHandler(apiController.createApplication));
router.get('/stats', asyncHandler(apiController.getStats));

 
module.exports = router;