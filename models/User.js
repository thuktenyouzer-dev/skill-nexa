
const db = require('../config/db');

// Create a new user account
async function createUser({
    name,
    email,
    passwordHash,
    verificationTokenHash
}) {
    return db.one(
        `INSERT INTO users
        (name, email, password_hash, role, is_verified, verification_token)
        VALUES ($1, $2, $3, 'job_seeker', false, $4)
        RETURNING id, name, email, role, is_verified, created_at`,
        [name, email.toLowerCase(), passwordHash, verificationTokenHash]
    );
}

// Find user using email
async function findByEmail(email) {
    return db.oneOrNone(
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase()]
    );
}

// Find user using ID
async function findById(id) {
    return db.oneOrNone(
        `SELECT id, name, email, role, is_verified, created_at
         FROM users
         WHERE id = $1`,
        [id]
    );
}

// Verify password
async function verifyPassword(plainPassword, passwordHash) {
    const bcrypt = require('bcrypt');
    return bcrypt.compare(plainPassword, passwordHash);
}

// Verify email address
async function verifyEmail(tokenHash) {
    return db.oneOrNone(
        `UPDATE users
         SET is_verified = true, verification_token = NULL
         WHERE verification_token = $1
         RETURNING id, name, email, role, is_verified`,
        [tokenHash]
    );
}

// Save password reset token
async function savePasswordResetToken(userId, tokenHash, expiresAt) {
    return db.none(
        `UPDATE users
         SET reset_token = $1, reset_token_expires = $2
         WHERE id = $3`,
        [tokenHash, expiresAt, userId]
    );
}

// Find valid password reset token
async function findByValidResetToken(tokenHash) {
    return db.oneOrNone(
        `SELECT id, name, email
         FROM users
         WHERE reset_token = $1
         AND reset_token_expires > NOW()`,
        [tokenHash]
    );
}

// Update password
async function updatePassword(userId, passwordHash) {
    return db.none(
        `UPDATE users
         SET password_hash = $1,
             reset_token = NULL,
             reset_token_expires = NULL
         WHERE id = $2`,
        [passwordHash, userId]
    );
}

// Update user profile
async function updateProfile(userId, name) {
    return db.one(
        `UPDATE users
         SET name = $1
         WHERE id = $2
         RETURNING id, name, email, role, is_verified, created_at`,
        [name, userId]
    );
}

// Get all users
async function getAllUsers() {
    return db.any(
        `SELECT u.id, u.name, u.email, u.role,
                u.is_verified, u.created_at,
                c.name AS company_name
         FROM users u
         LEFT JOIN companies c ON c.owner_id = u.id
         ORDER BY u.created_at DESC`
    );
}

// Get user statistics
async function getCounts() {
    return db.one(
        `SELECT COUNT(*)::int AS total_users,
         COUNT(*) FILTER (WHERE role = 'job_seeker')::int AS total_job_seekers,
         COUNT(*) FILTER (WHERE role = 'employer')::int AS total_employers,
         COUNT(*) FILTER (WHERE role = 'superadmin')::int AS total_superadmins
         FROM users`
    );
}

// Promote a user to employer and assign a company
async function promoteToEmployer(userId, companyId) {
    return db.tx(async (t) => {
        const user = await t.oneOrNone(
            'SELECT id, role FROM users WHERE id = $1 FOR UPDATE',
            [userId]
        );

        const company = await t.oneOrNone(
            'SELECT id, owner_id FROM companies WHERE id = $1 FOR UPDATE',
            [companyId]
        );

        if (!user || !company) {
            throw new Error('User or company was not found.');
        }

        if (user.role === 'superadmin') {
            throw new Error('A superadmin cannot be changed into an employer.');
        }

        if (
            company.owner_id &&
            Number(company.owner_id) !== Number(userId)
        ) {
            throw new Error('This company is already assigned to another employer.');
        }

        const otherAssignment = await t.oneOrNone(
            `SELECT id FROM companies
             WHERE owner_id = $1 AND id <> $2`,
            [userId, companyId]
        );

        if (otherAssignment) {
            throw new Error('This employer already has a company assigned.');
        }

        await t.none(
            `UPDATE users SET role = 'employer' WHERE id = $1`,
            [userId]
        );

        await t.none(
            'UPDATE companies SET owner_id = $1 WHERE id = $2',
            [userId, companyId]
        );

        return {
            userId: Number(userId),
            companyId: Number(companyId)
        };
    });
}

module.exports = {
    createUser,
    findByEmail,
    findById,
    verifyPassword,
    verifyEmail,
    savePasswordResetToken,
    findByValidResetToken,
    updatePassword,
    updateProfile,
    getAllUsers,
    getCounts,
    promoteToEmployer
};
