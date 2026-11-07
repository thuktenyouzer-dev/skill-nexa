
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const request = require('supertest');
const app = require('../app');
const db = require('../config/db');

const hasTestDatabase =
    global.__SKILL_NEXA_TEST_DB_CONFIGURED__ === true;

const suite = hasTestDatabase ? describe : describe.skip;

function hashToken(token) {
    return crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
}

let originalUsers = [];
let expiredToken;
let validToken;

suite('Skill Nexa password-reset tests', () => {

    beforeAll(async () => {
        await db.one('SELECT 1');

        originalUsers = await db.any(`
            SELECT id, email, password_hash,
                   reset_token, reset_token_expires
            FROM users
            WHERE email IN (
                'seeker@skillnexa.test',
                'seeker.b@skillnexa.test'
            )
        `);

        expect(originalUsers).toHaveLength(2);

        expiredToken = crypto.randomBytes(32).toString('hex');
        validToken = crypto.randomBytes(32).toString('hex');

        // Give Job Seeker A an expired reset token.
        await db.none(`
            UPDATE users
            SET reset_token = $1,
                reset_token_expires = NOW() - INTERVAL '1 hour'
            WHERE email = 'seeker@skillnexa.test'
        `, [hashToken(expiredToken)]);

        // Give Job Seeker B a valid reset token.
        await db.none(`
            UPDATE users
            SET reset_token = $1,
                reset_token_expires = NOW() + INTERVAL '1 hour'
            WHERE email = 'seeker.b@skillnexa.test'
        `, [hashToken(validToken)]);
    });

    afterAll(async () => {
        // Restore the original test account details.
        for (const user of originalUsers) {
            await db.none(`
                UPDATE users
                SET password_hash = $1,
                    reset_token = $2,
                    reset_token_expires = $3
                WHERE id = $4
            `, [
                user.password_hash,
                user.reset_token,
                user.reset_token_expires,
                user.id
            ]);
        }

        await db.$pool.end();
    });

    test('Rejects an invalid reset token', async () => {
        await request(app)
            .get('/reset-password/invalid-test-token')
            .expect(400);
    });

    test('Rejects an expired reset token', async () => {
        await request(app)
            .get(`/reset-password/${expiredToken}`)
            .expect(400);
    });

    test('Accepts a valid reset token', async () => {
        await request(app)
            .get(`/reset-password/${validToken}`)
            .expect(200);
    });

    test('Rejects password reset using an expired token', async () => {
        await request(app)
            .post(`/reset-password/${expiredToken}`)
            .type('form')
            .send({
                token: expiredToken,
                password: 'NewPassword123!',
                confirm_password: 'NewPassword123!'
            })
            .expect(400);
    });

    test('Successfully resets a password using a valid token', async () => {
        await request(app)
            .post(`/reset-password/${validToken}`)
            .type('form')
            .send({
                token: validToken,
                password: 'NewPassword123!',
                confirm_password: 'NewPassword123!'
            })
            .expect(200);

        const user = await db.one(`
            SELECT password_hash, reset_token,
                   reset_token_expires
            FROM users
            WHERE email = 'seeker.b@skillnexa.test'
        `);

        expect(await bcrypt.compare(
            'NewPassword123!',
            user.password_hash
        )).toBe(true);

        expect(user.reset_token).toBeNull();
        expect(user.reset_token_expires).toBeNull();

        // Confirm that the same token cannot be reused.
        await request(app)
            .get(`/reset-password/${validToken}`)
            .expect(400);
    });

});
