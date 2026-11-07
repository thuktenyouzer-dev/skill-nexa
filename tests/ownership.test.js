
const request = require('supertest');
const app = require('../app');
const db = require('../config/db');

const hasTestDatabase =
    global.__SKILL_NEXA_TEST_DB_CONFIGURED__ === true;

const suite = hasTestDatabase ? describe : describe.skip;

let fixture;

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

suite('Skill Nexa application ownership tests', () => {

    beforeAll(async () => {
        await db.one('SELECT 1');

        fixture = await db.one(`
            SELECT
                (SELECT id FROM users
                 WHERE email = 'seeker@skillnexa.test') AS "seekerAId",

                (SELECT id FROM applications
                 WHERE applicant_email = 'seeker@skillnexa.test'
                 ORDER BY id LIMIT 1) AS "seekerAApplicationId",

                (SELECT id FROM applications
                 WHERE applicant_email = 'seeker.b@skillnexa.test'
                 ORDER BY id LIMIT 1) AS "seekerBApplicationId",

                (SELECT id FROM jobs
                 WHERE title = 'Lab 9 Test Vacancy A') AS "jobAId"
        `);

        expect(fixture.seekerAId).toBeTruthy();
        expect(fixture.seekerAApplicationId).toBeTruthy();
        expect(fixture.seekerBApplicationId).toBeTruthy();
        expect(fixture.jobAId).toBeTruthy();
    });

    afterAll(async () => {
        await db.$pool.end();
    });

    test('Job Seeker can view their own application', async () => {
        const agent = await loginAs('seeker@skillnexa.test');

        const response = await agent
            .get(`/api/applications/${fixture.seekerAApplicationId}`)
            .expect(200);

        expect(Number(response.body.applicant_id))
            .toBe(Number(fixture.seekerAId));
    });

    test('Job Seeker cannot view another applicants application', async () => {
        const agent = await loginAs('seeker@skillnexa.test');

        const response = await agent
            .get(`/api/applications/${fixture.seekerBApplicationId}`)
            .expect(403);

        expect(response.body.error)
            .toBe('You cannot view this application.');
    });

    test('Employer A can view an application for Company A', async () => {
        const agent = await loginAs('employer.a@skillnexa.test');

        await agent
            .get(`/api/applications/${fixture.seekerAApplicationId}`)
            .expect(200);
    });

    test('Employer A cannot view an application for Company B', async () => {
        const agent = await loginAs('employer.a@skillnexa.test');

        const response = await agent
            .get(`/api/applications/${fixture.seekerBApplicationId}`)
            .expect(403);

        expect(response.body.error)
            .toBe('You cannot view this application.');
    });

    test('Employer B can view an application for Company B', async () => {
        const agent = await loginAs('employer.b@skillnexa.test');

        await agent
            .get(`/api/applications/${fixture.seekerBApplicationId}`)
            .expect(200);
    });

    test('Employer B cannot view an application for Company A', async () => {
        const agent = await loginAs('employer.b@skillnexa.test');

        await agent
            .get(`/api/applications/${fixture.seekerAApplicationId}`)
            .expect(403);
    });

    test('Job Seeker cannot apply twice for the same vacancy', async () => {
        const agent = await loginAs('seeker@skillnexa.test');

        const response = await agent
            .post('/api/applications')
            .send({
                job_id: fixture.jobAId,
                resume_url: 'https://example.com/candidate-cv.pdf',
                cover_letter: 'I am interested in this position and would like to apply.'
            })
            .expect(409);

        expect(response.body.error)
            .toBe('You have already applied for this vacancy.');
    });

});
