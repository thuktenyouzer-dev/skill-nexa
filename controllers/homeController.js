
const Company = require('../models/Company');
const Job = require('../models/Job');

// ==========================================
// HOMEPAGE
// ==========================================
exports.index = async (req, res, next) => {
  try {
    const results = await Promise.all([
      Job.getFeatured(4),
      Job.getLatest(6),
      Job.getPopular(4),
      Job.getCategories(),
      Company.getAllCompanies()
    ]);

    return res.render('index', {
      title: 'Discover your next career opportunity',

      featuredJobs: Array.isArray(results[0]) ? results[0] : [],
      latestJobs: Array.isArray(results[1]) ? results[1] : [],
      popularJobs: Array.isArray(results[2]) ? results[2] : [],
      categories: Array.isArray(results[3]) ? results[3] : [],
      companies: Array.isArray(results[4]) ? results[4] : []
    });

  } catch (error) {
    console.error('Homepage error:', error);
    return next(error);
  }
};


// ==========================================
// JOB LISTINGS PAGE
// ==========================================
exports.jobsPage = async (req, res, next) => {
  try {
    // Get search and filter values
    const filters = {
      q: typeof req.query.q === 'string'
        ? req.query.q.trim() : '',

      location: typeof req.query.location === 'string'
        ? req.query.location.trim() : '',

      category: typeof req.query.category === 'string'
        ? req.query.category.trim() : '',

      job_type: typeof req.query.job_type === 'string'
        ? req.query.job_type.trim() : ''
    };

    // Retrieve jobs and categories from PostgreSQL
    const [jobs, categories] = await Promise.all([
      Job.search(filters),
      Job.getCategories()
    ]);

    // Pass the information to jobs.ejs
    return res.render('jobs', {
      title: 'Find Jobs',
      jobs: Array.isArray(jobs) ? jobs : [],
      categories: Array.isArray(categories) ? categories : [],
      filters: filters
    });

  } catch (error) {
    console.error('Jobs page error:', error);
    return next(error);
  }
};
