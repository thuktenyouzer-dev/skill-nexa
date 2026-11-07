const Job = require('../models/Job');
const Company = require('../models/Company');
const Application = require('../models/Application');
const User = require('../models/User');
 
exports.getJobs = async (req, res) => {
  const jobs = await Job.search({
    q: String(req.query.q || '').trim(),
    location: String(req.query.location || '').trim(),
    category: String(req.query.category || '').trim(),
    job_type: String(req.query.job_type || '').trim(),
    limit: req.query.limit
  });
  res.json({ count: jobs.length, jobs });
};
 
exports.getJob = async (req, res) => {
  const job = await Job.getById(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found.' });
  res.json(job);
};
 
exports.getCompany = async (req, res) => {
  const company = await Company.getById(req.params.id);
  if (!company) return res.status(404).json({ error: 'Company not found.' });
  res.json(company);
};
 
exports.getCompanyJobs = async (req, res) => {
  const company = await Company.getById(req.params.id);
  if (!company) return res.status(404).json({ error: 'Company not found.' });
  const jobs = await Job.getByCompany(company.id);
  res.json({ company, jobs: jobs.filter((job) => job.is_active && job.status === 'active') });
};
 
exports.getApplication = async (req, res) => {
  const application = await Application.getById(req.params.id);
  if (!application) return res.status(404).json({ error: 'Application not found.' });
  const user = req.session.user;
  if (user.role === 'job_seeker' && Number(application.applicant_id) !== Number(user.id)) {
    return res.status(403).json({ error: 'You cannot view this application.' });
  }
  if (user.role === 'employer') {
    const company = await Company.getByOwnerId(user.id);
    if (!company || Number(company.id) !== Number(application.company_id)) {
      return res.status(403).json({ error: 'You cannot view this application.' });
    }
  }
  res.json(application);
};
 
exports.createApplication = async (req, res) => {
  const jobId = Number(req.body.job_id);
  if (!Number.isInteger(jobId) || jobId < 1) return res.status(400).json({ error: 'A valid job_id is required.' });
  const job = await Job.getById(jobId);
  if (!job) return res.status(404).json({ error: 'Job not found or no longer active.' });
  const validator = require('../utils/validators');
  const input = {
    cover_letter: validator.cleanString(req.body.cover_letter, 5000),
    resume_url: validator.cleanString(req.body.resume_url, 500)
  };
  const errors = validator.validateApplication(input);
  if (errors.length) return res.status(400).json({ errors });
  try {
    const application = await Application.createApplication({
      jobId, applicantId: req.session.user.id, applicantName: req.session.user.name,
      applicantEmail: req.session.user.email, resumeUrl: input.resume_url, coverLetter: input.cover_letter
    });
    res.status(201).json({ message: 'Application created.', application });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'You have already applied for this vacancy.' });
    if (/no longer accepting/i.test(error.message)) return res.status(409).json({ error: error.message });
    throw error;
  }
};
 
exports.getStats = async (req, res) => {
  const [userCounts, jobCounts, applicationCount] = await Promise.all([
    User.getCounts(), Job.getCounts(), Application.getCount()
  ]);
  res.json({ ...userCounts, ...jobCounts, ...applicationCount });
};