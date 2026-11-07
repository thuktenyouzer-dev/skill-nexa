
const request = require('supertest');
const app = require('../app');
const db = require('../config/db');

// Check whether the isolated test database is configured
const hasTestDatabase =
    global.__SKILL_NEXA_TEST_DB_CONFIGURED__ === true;

const suite = hasTestDatabase ? describe : describe.skip;

suite('Skill Nexa REST API', () => {

    // Check database connection before running tests
    beforeAll(async () => {
        await db.one('SELECT 1');
    });

    // Close database connection after tests
    afterAll(async () => {
        await db.$pool.end();
    });

    test('GET /api/jobs returns a JSON result collection', async () => {
        const response = await request(app)
            .get('/api/jobs')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body).toHaveProperty('count');
        expect(response.body).toHaveProperty('jobs');
        expect(Array.isArray(response.body.jobs)).toBe(true);
    });

    test('GET /api/jobs/:id returns 404 for a missing vacancy', async () => {
        const response = await request(app)
            .get('/api/jobs/99999999')
            .expect(404);

        expect(response.body.error).toBe('Job not found.');
    });

    test('POST /api/applications rejects unauthenticated requests', async () => {
        const response = await request(app)
            .post('/api/applications')
            .send({ job_id: 1 })
            .expect(401);

        expect(response.body.error).toBe(
            'Authentication is required.'
        );
    });

});
