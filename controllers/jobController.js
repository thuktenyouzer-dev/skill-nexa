const Job = require('../models/Job');

function queryText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

// Display database-driven job listings and apply the search filters.
exports.list = async (req, res, next) => {
  try {
    const filters = {
      q: queryText(req.query.q),
      location: queryText(req.query.location),
      category: queryText(req.query.category),
      job_type: queryText(req.query.job_type)
    };

    const [jobs, categories] = await Promise.all([
      Job.search(filters),
      Job.getCategories()
    ]);

    return res.render('jobs', {
      title: 'Find Jobs',
      jobs,
      categories,
      filters
    });
  } catch (error) {
    return next(error);
  }
};

// Display one active job. Invalid or missing IDs return an HTTP 404 page.
exports.details = async (req, res, next) => {
  try {
    const idText = req.params.id;
    const jobId = Number(idText);

    if (!/^\d+$/.test(idText) || !Number.isSafeInteger(jobId) || jobId < 1) {
      return res.status(404).render('job-not-found', {
        title: 'Job not found',
        jobId: idText
      });
    }

    const job = await Job.getById(jobId);

    if (!job) {
      return res.status(404).render('job-not-found', {
        title: 'Job not found',
        jobId: idText
      });
    }

    return res.render('job-details', {
      title: job.title,
      job
    });
  } catch (error) {
    return next(error);
  }
};
