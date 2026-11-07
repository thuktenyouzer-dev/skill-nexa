require('dotenv').config();
const db = require('../config/db');

async function createSuperadmin() {
    const email = String(process.env.SUPERADMIN_EMAIL || '').trim().toLowerCase();

    if (!email) {
        throw new Error('Set SUPERADMIN_EMAIL to the email address of an existing verified account.');
    }

    const user = await db.oneOrNone(
        'SELECT id, email, is_verified, role FROM users WHERE email = $1',
        [email]
    );

    if (!user) {
        throw new Error('No account was found for SUPERADMIN_EMAIL. Register and verify the account first.');
    }

    if (!user.is_verified) {
        throw new Error('The account must verify its email address before becoming Superadmin.');
    }

    await db.none("UPDATE users SET role = 'superadmin' WHERE id = $1", [user.id]);
    console.log(`Superadmin role assigned to ${user.email}. Sign in again to load the new role.`);
}

createSuperadmin()
    .catch((error) => {
        console.error('Could not create Superadmin:', error.message);
        process.exitCode = 1;
    })
    .finally(() => {
        db.pgp.end();
    });
