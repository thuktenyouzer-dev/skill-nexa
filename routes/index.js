
const express = require('express');
const router = express.Router();

// Controllers
const homeController = require('../controllers/homeController');
const jobController = require('../controllers/jobController');
const authController = require('../controllers/authController');
const employerController = require('../controllers/employerController');
const superAdminController = require('../controllers/superAdminController');
const feedbackController = require('../controllers/feedbackController');
const companyController = require('../controllers/companyController');

// Middleware
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

// ==========================================
// PUBLIC PAGES AND JOB SEARCH
// ==========================================

router.get('/', asyncHandler(homeController.index));

router.get('/jobs', asyncHandler(jobController.list));

router.get('/jobs/:id', asyncHandler(jobController.details));

// ==========================================
// LAB 8: COMPANY DETAILS AND REVIEWS
// ==========================================

// Display company details and reviews
router.get(
    '/companies/:id',
    asyncHandler(companyController.details)
);

// Submit company review - Job Seeker only
router.post(
    '/companies/:id/reviews',
    auth.requireAuth,
    auth.requireJobSeeker,
    asyncHandler(feedbackController.createReview)
);

// ==========================================
// ACCOUNT REGISTRATION AND AUTHENTICATION
// ==========================================

router.get('/register', authController.getRegister);

router.post('/register', asyncHandler(authController.register));

router.get(
    '/verify-email/:token',
    asyncHandler(authController.verifyEmail)
);

router.get(
    '/resend-verification',
    authController.getResendVerification
);

router.post(
    '/resend-verification',
    asyncHandler(authController.resendVerification)
);

router.get('/login', authController.getLogin);

router.post('/login', asyncHandler(authController.login));

router.post(
    '/logout',
    auth.requireAuth,
    authController.logout
);

// ==========================================
// PASSWORD RECOVERY
// ==========================================

router.get(
    '/forgot-password',
    authController.getForgotPassword
);

router.post(
    '/forgot-password',
    asyncHandler(authController.forgotPassword)
);

router.get(
    '/reset-password/:token',
    asyncHandler(authController.getResetPassword)
);

router.post(
    '/reset-password/:token',
    asyncHandler(authController.resetPassword)
);

// ==========================================
// JOB SEEKER DASHBOARD AND ACTIONS
// ==========================================

router.get(
    '/dashboard',
    auth.requireJobSeeker,
    asyncHandler(authController.dashboard)
);

router.post(
    '/dashboard/profile',
    auth.requireJobSeeker,
    asyncHandler(authController.updateProfile)
);

router.post(
    '/jobs/:id/apply',
    auth.requireJobSeeker,
    asyncHandler(jobController.apply)
);

router.post(
    '/applications/:id/withdraw',
    auth.requireJobSeeker,
    asyncHandler(jobController.withdrawApplication)
);

// ==========================================
// EMPLOYER DASHBOARD AND ACTIONS
// ==========================================

router.get(
    '/employer',
    auth.requireEmployer,
    asyncHandler(employerController.dashboard)
);
// Lab 8: Employer views reviews for their own company
router.get(
    '/employer/reviews',
    auth.requireEmployer,
    asyncHandler(employerController.reviews)
);
router.get(
    '/employer/jobs/new',
    auth.requireEmployer,
    asyncHandler(employerController.getNewJob)
);

router.post(
    '/employer/jobs',
    auth.requireEmployer,
    asyncHandler(employerController.createJob)
);

router.get(
    '/employer/jobs/:id/edit',
    auth.requireEmployer,
    asyncHandler(employerController.getEditJob)
);

router.post(
    '/employer/jobs/:id',
    auth.requireEmployer,
    asyncHandler(employerController.updateJob)
);

router.post(
    '/employer/jobs/:id/close',
    auth.requireEmployer,
    asyncHandler(employerController.closeJob)
);

router.post(
    '/employer/applications/:id/status',
    auth.requireEmployer,
    asyncHandler(employerController.updateApplicationStatus)
);

// ==========================================
// SUPERADMIN DASHBOARD AND MANAGEMENT
// ==========================================

router.get(
    '/superadmin',
    auth.requireSuperAdmin,
    asyncHandler(superAdminController.dashboard)
);

router.post(
    '/superadmin/companies',
    auth.requireSuperAdmin,
    asyncHandler(superAdminController.createCompany)
);

router.post(
    '/superadmin/users/:id/promote',
    auth.requireSuperAdmin,
    asyncHandler(superAdminController.promoteUser)
);

module.exports = router;
