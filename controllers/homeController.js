// Temporary sample jobs for Lab 2.
// In Lab 3, these records will be retrieved from PostgreSQL.
const sampleJobs = [
  {
    id: 1,
    title: 'Junior Web Developer',
    company: 'Druk Digital Solutions',
    location: 'Thimphu, Bhutan'
  },
  {
    id: 2,
    title: 'Programme Assistant',
    company: 'Himalayan Learning Centre',
    location: 'Trashigang, Bhutan'
  }
];

exports.index = (req, res) => {
  res.render('index', {
    title: 'Discover your next career opportunity',
    jobs: sampleJobs
  });
};

exports.jobsPage = (req, res) => {
  const searchTerm = String(req.query.q || '').trim().toLowerCase();

  const filteredJobs = searchTerm
    ? sampleJobs.filter((job) => {
        return [job.title, job.company, job.location].some((value) =>
          value.toLowerCase().includes(searchTerm)
        );
      })
    : sampleJobs;

  res.render('jobs', {
    title: 'Explore jobs',
    jobs: filteredJobs,
    searchTerm: String(req.query.q || '').trim()
  });
};

exports.jobDetails = (req, res) => {
  const jobId = Number(req.params.id);
  const job = sampleJobs.find((item) => item.id === jobId);

  if (!job) {
    return res.status(404).render('job-not-found', {
      title: 'Job not found',
      jobId: req.params.id
    });
  }

  return res.render('job-details', {
    title: job.title,
    job
  });
};
