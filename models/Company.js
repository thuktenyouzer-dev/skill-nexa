const db = require('../config/db');
 
async function getAllCompanies() {
  return db.any(
    `SELECT c.*,
      (SELECT COUNT(*)::int FROM jobs j WHERE j.company_id = c.id AND j.is_active = true AND j.status = 'active') AS active_jobs
     FROM companies c WHERE c.is_active = true ORDER BY c.name`
  );
}
 
async function getAllForAdmin() {
  return db.any(
    `SELECT c.*, u.name AS owner_name, u.email AS owner_email,
      (SELECT COUNT(*)::int FROM jobs j WHERE j.company_id = c.id AND j.is_active = true AND j.status = 'active') AS active_jobs
     FROM companies c LEFT JOIN users u ON u.id = c.owner_id ORDER BY c.created_at DESC`
  );
}
 
async function getById(id) {
  return db.oneOrNone(
    `SELECT c.* FROM companies c WHERE c.id = $1 AND c.is_active = true`,
    [id]
  );
}
 
async function getByOwnerId(ownerId) {
  return db.oneOrNone(
    `SELECT c.*, u.name AS owner_name
     FROM companies c LEFT JOIN users u ON u.id = c.owner_id
     WHERE c.owner_id = $1 AND c.is_active = true`,
    [ownerId]
  );
}
 
async function createCompany({ name, description, industry, location, website }) {
  return db.one(
    `INSERT INTO companies (name, description, industry, location, website)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, description, industry, location, website || null]
  );
}
 
async function deactivateCompany(id) {
  return db.none('UPDATE companies SET is_active = false WHERE id = $1', [id]);
}
 
module.exports = { getAllCompanies, getAllForAdmin, getById, getByOwnerId, createCompany, deactivateCompany };