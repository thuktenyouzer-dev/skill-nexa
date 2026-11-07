const db = require('../config/db');
 
function buildFilters(filters = {}) {
  const clauses = ["j.is_active = true", "j.status = 'active'", 'c.is_active = true', '(j.deadline IS NULL OR j.deadline >= CURRENT_DATE)'];
  const values = [];
  const add = (sql, value) => {
    values.push(value);
    clauses.push(sql.replace('?', `$${values.length}`));
  };
  if (filters.q) {
    values.push(filters.q);
    const placeholder = `$${values.length}`;
    clauses.push(`(j.title ILIKE '%' || ${placeholder} || '%' OR j.description ILIKE '%' || ${placeholder} || '%' OR c.name ILIKE '%' || ${placeholder} || '%')`);
  }
  if (filters.location) add("j.location ILIKE '%' || ? || '%'", filters.location);
  if (filters.category) add('j.category = ?', filters.category);
  if (filters.job_type) add('j.job_type = ?', filters.job_type);
  return { where: clauses.join(' AND '), values };
}
 
async function search(filters = {}) {
  const built = buildFilters(filters);
  const values = [...built.values];
  const limit = Math.min(Math.max(Number(filters.limit) || 50, 1), 100);
  values.push(limit);
  const limitPlaceholder = `$${values.length}`;
  const offset = Math.max(Number(filters.offset) || 0, 0);
  values.push(offset);
  const offsetPlaceholder = `$${values.length}`;
  return db.any(
    `SELECT j.*, c.name AS company_name, c.industry AS company_industry,
            j.applications_count AS applications_count_actual
     FROM jobs j JOIN companies c ON c.id = j.company_id
     WHERE ${built.where}
     ORDER BY j.created_at DESC LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
    values
  );
}
 
async function getById(id) {
  return db.oneOrNone(
    `SELECT j.*, c.name AS company_name, c.description AS company_description,
            c.industry AS company_industry, c.location AS company_location,
            c.website AS company_website
     FROM jobs j JOIN companies c ON c.id = j.company_id
     WHERE j.id = $1 AND j.is_active = true AND c.is_active = true
       AND j.status = 'active' AND (j.deadline IS NULL OR j.deadline >= CURRENT_DATE)`,
    [id]
  );
}
 
async function getFeatured(limit = 4) {
  return db.any(
    `SELECT j.*, c.name AS company_name
     FROM jobs j JOIN companies c ON c.id = j.company_id
     WHERE j.is_active = true AND j.status = 'active' AND c.is_active = true
       AND (j.deadline IS NULL OR j.deadline >= CURRENT_DATE)
     ORDER BY j.created_at DESC LIMIT $1`,
    [limit]
  );
}
 
async function getLatest(limit = 6) {
  return getFeatured(limit);
}
 
async function getPopular(limit = 4) {
  return db.any(
    `SELECT j.*, c.name AS company_name
     FROM jobs j JOIN companies c ON c.id=j.company_id
     WHERE j.is_active=true AND j.status='active' AND c.is_active=true
       AND (j.deadline IS NULL OR j.deadline >= CURRENT_DATE)
     ORDER BY j.applications_count DESC, j.created_at DESC LIMIT $1`,
    [limit]
  );
}
 
async function getByCompany(companyId) {
  return db.any(
    `SELECT j.*, j.applications_count AS applications_count_actual
     FROM jobs j WHERE j.company_id = $1 ORDER BY j.created_at DESC`,
    [companyId]
  );
}
 
async function createJob(companyId, input) {
  return db.one(
    `INSERT INTO jobs
      (company_id, title, description, category, location, job_type, experience_level,
       salary_min, salary_max, salary_currency, deadline, status, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'active',true)
     RETURNING *`,
    [companyId, input.title, input.description, input.category, input.location,
      input.job_type, input.experience_level || 'Not specified', input.salary_min,
      input.salary_max, input.salary_currency || 'BTN', input.deadline || null]
  );
}
 
async function updateJob(id, companyId, input) {
  return db.oneOrNone(
    `UPDATE jobs SET title=$1, description=$2, category=$3, location=$4,
      job_type=$5, experience_level=$6, salary_min=$7, salary_max=$8,
      salary_currency=$9, deadline=$10
     WHERE id=$11 AND company_id=$12 AND is_active=true
     RETURNING *`,
    [input.title, input.description, input.category, input.location, input.job_type,
      input.experience_level || 'Not specified', input.salary_min, input.salary_max,
      input.salary_currency || 'BTN', input.deadline || null, id, companyId]
  );
}
 
async function closeJob(id, companyId) {
  return db.oneOrNone(
    `UPDATE jobs SET is_active=false, status='closed'
     WHERE id=$1 AND company_id=$2 AND is_active=true RETURNING id`,
    [id, companyId]
  );
}
 
async function deactivateByAdmin(id) {
  return db.oneOrNone(
    `UPDATE jobs SET is_active=false, status='closed' WHERE id=$1 RETURNING id`, [id]
  );
}
 
async function getCounts() {
  return db.one(
    `SELECT COUNT(*) FILTER (WHERE is_active=true AND status='active')::int AS active_jobs,
            COUNT(*)::int AS total_jobs
     FROM jobs`
  );
}
 
async function getAllForAdmin() {
  return db.any(
    `SELECT j.id, j.title, j.status, j.is_active, j.created_at, c.name AS company_name
     FROM jobs j JOIN companies c ON c.id=j.company_id ORDER BY j.created_at DESC LIMIT 100`
  );
}
 
async function getCategories() {
  return db.any(
    `SELECT category, COUNT(*)::int AS total
     FROM jobs WHERE is_active=true AND status='active'
     GROUP BY category ORDER BY total DESC, category ASC LIMIT 8`
  );
}
 
module.exports = { search, getById, getFeatured, getLatest, getPopular, getByCompany, createJob, updateJob, closeJob, deactivateByAdmin, getCounts, getCategories, getAllForAdmin };