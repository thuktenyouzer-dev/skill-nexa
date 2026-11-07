const db = require('../config/db');
 
async function createApplication({ jobId, applicantId, applicantName, applicantEmail, resumeUrl, coverLetter }) {
  return db.tx(async (t) => {
    const job = await t.oneOrNone(
      `SELECT id FROM jobs WHERE id=$1 AND is_active=true AND status='active' AND (deadline IS NULL OR deadline >= CURRENT_DATE) FOR UPDATE`,
      [jobId]
    );
    if (!job) throw new Error('This vacancy is no longer accepting applications.');
    const application = await t.one(
      `INSERT INTO applications
        (job_id, applicant_id, applicant_name, applicant_email, resume_url, cover_letter, status)
       VALUES ($1,$2,$3,$4,$5,$6,'submitted')
       RETURNING *`,
      [jobId, applicantId, applicantName, applicantEmail, resumeUrl || null, coverLetter || null]
    );
    await t.none('UPDATE jobs SET applications_count = applications_count + 1 WHERE id = $1', [jobId]);
    return application;
  });
}
 
async function getForApplicant(applicantId) {
  return db.any(
    `SELECT a.*, j.title AS job_title, j.location, j.job_type, c.name AS company_name
     FROM applications a JOIN jobs j ON j.id=a.job_id JOIN companies c ON c.id=j.company_id
     WHERE a.applicant_id=$1 ORDER BY a.applied_at DESC`,
    [applicantId]
  );
}
 
async function getForCompany(companyId) {
  return db.any(
    `SELECT a.*, j.title AS job_title, j.id AS job_id, j.location
     FROM applications a JOIN jobs j ON j.id=a.job_id
     WHERE j.company_id=$1 ORDER BY a.applied_at DESC`,
    [companyId]
  );
}
 
async function getById(id) {
  return db.oneOrNone(
    `SELECT a.*, j.title AS job_title, j.company_id, c.name AS company_name
     FROM applications a JOIN jobs j ON j.id=a.job_id JOIN companies c ON c.id=j.company_id
     WHERE a.id=$1`, [id]
  );
}
 
async function updateStatus(id, companyId, status) {
  return db.oneOrNone(
    `UPDATE applications a SET status=$1
     FROM jobs j WHERE a.id=$2 AND a.job_id=j.id AND j.company_id=$3
     RETURNING a.*`,
    [status, id, companyId]
  );
}
 
async function withdrawApplication(id, applicantId) {
  return db.oneOrNone(
    `UPDATE applications SET status='withdrawn'
     WHERE id=$1 AND applicant_id=$2 AND status NOT IN ('accepted','rejected','withdrawn')
     RETURNING id, status`,
    [id, applicantId]
  );
}
 
async function getCount() {
  return db.one('SELECT COUNT(*)::int AS total_applications FROM applications');
}
 
module.exports = { createApplication, getForApplicant, getForCompany, getById, updateStatus, withdrawApplication, getCount };