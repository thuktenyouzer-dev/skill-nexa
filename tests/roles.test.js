
const request = require('supertest');
const app = require('../app');
const db = require('../config/db');

const hasTestDatabase =
    global.__SKILL_NEXA_TEST_DB_CONFIGURED__ === true;

const suite = hasTestDatabase ? describe : describe.skip;

async function loginAs(email) {
    const agent = request.agent(app);

    await agent
        .post('/login')
        .type('form')
        .send({
            email,
            password: 'Lab9TestPass123!'
        })
        .expect(302);

    return agent;
}

suite('Skill Nexa role-based access tests', () => {

    beforeAll(async () => {
        await db.one('SELECT 1');
    });

    afterAll(async () => {
        await db.$pool.end();
    });

    test('Guest cannot access Employer dashboard', async () => {
        await request(app)
            .get('/employer')
            .expect(302)
            .expect('Location', '/login');
    });

    test('Guest cannot access Superadmin dashboard', async () => {
        await request(app)
            .get('/superadmin')
            .expect(302)
            .expect('Location', '/login');
    });

    test('Job Seeker cannot access Employer dashboard', async () => {
        const agent = await loginAs('seeker@skillnexa.test');

        await agent
            .get('/employer')
            .expect(403);
    });

    test('Job Seeker cannot access Superadmin dashboard', async () => {
        const agent = await loginAs('seeker@skillnexa.test');

        await agent
            .get('/superadmin')
            .expect(403);
    });

    test('Employer cannot access Superadmin dashboard', async () => {
        const agent = await loginAs('employer.a@skillnexa.test');

        await agent
            .get('/superadmin')
            .expect(403);
    });

    test('Employer can access their Employer dashboard', async () => {
        const agent = await loginAs('employer.a@skillnexa.test');

        await agent
            .get('/employer')
            .expect(200);
    });

    test('Superadmin can access Superadmin dashboard', async () => {
        const agent = await loginAs('admin@skillnexa.test');

        await agent
            .get('/superadmin')
            .expect(200);
    });

});
