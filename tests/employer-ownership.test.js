
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

const validJob = {
    title: 'Lab 9 Updated Vacancy A',
    description: 'Updated vacancy description for the ownership test.',
    category: 'Information Technology',
    location: 'Thimphu, Bhutan',
    job_type: 'Full-time',
    experience_level: 'Entry Level',
    salary_min: '18000',
    salary_max: '26000',
    salary_currency: 'BTN',
    deadline: ''
};

suite('Skill Nexa Employer ownership tests', () => {

    beforeAll(async () => {
        await db.one('SELECT 1');

        fixture = await db.one(`
            SELECT
                (SELECT id FROM jobs
                 WHERE title = 'Lab 9 Test Vacancy A') AS "jobAId",

                (SELECT id FROM jobs
                 WHERE title = 'Lab 9 Test Vacancy B') AS "jobBId",

                (SELECT id FROM applications
                 WHERE applicant_email = 'seeker@skillnexa.test'
                 ORDER BY id LIMIT 1) AS "applicationAId",

                (SELECT id FROM applications
                 WHERE applicant_email = 'seeker.b@skillnexa.test'
                 ORDER BY id LIMIT 1) AS "applicationBId"
        `);

        expect(fixture.jobAId).toBeTruthy();
        expect(fixture.jobBId).toBeTruthy();
        expect(fixture.applicationAId).toBeTruthy();
        expect(fixture.applicationBId).toBeTruthy();
    });

    afterAll(async () => {
        if (fixture) {
            // Restore the original test vacancy title.
            await db.none(
                `UPDATE jobs
                 SET title = 'Lab 9 Test Vacancy A'
                 WHERE id = $1`,
                [fixture.jobAId]
            );

            // Restore the original test application statuses.
            await db.none(
                `UPDATE applications
                 SET status = 'submitted'
                 WHERE id IN ($1, $2)`,
                [fixture.applicationAId, fixture.applicationBId]
            );
        }

        await db.$pool.end();
    });

    test('Employer A can update their own vacancy', async () => {
        const agent = await loginAs(
            'employer.a@skillnexa.test'
        );

        await agent
            .post(`/employer/jobs/${fixture.jobAId}`)
            .type('form')
            .send(validJob)
            .expect(302)
            .expect(
                'Location',
                '/employer?notice=Vacancy%20updated%20successfully.'
            );

        const job = await db.one(
            'SELECT title FROM jobs WHERE id = $1',
            [fixture.jobAId]
        );

        expect(job.title).toBe('Lab 9 Updated Vacancy A');
    });

    test('Employer A cannot update Employer B vacancy', async () => {
        const agent = await loginAs(
            'employer.a@skillnexa.test'
        );

        await agent
            .post(`/employer/jobs/${fixture.jobBId}`)
            .type('form')
            .send(validJob)
            .expect(404);

        const job = await db.one(
            'SELECT title FROM jobs WHERE id = $1',
            [fixture.jobBId]
        );

        expect(job.title).toBe('Lab 9 Test Vacancy B');
    });

    test('Employer A cannot close Employer B vacancy', async () => {
        const agent = await loginAs(
            'employer.a@skillnexa.test'
        );

        await agent
            .post(`/employer/jobs/${fixture.jobBId}/close`)
            .expect(404);

        const job = await db.one(
            `SELECT is_active, status
             FROM jobs WHERE id = $1`,
            [fixture.jobBId]
        );

        expect(job.is_active).toBe(true);
        expect(job.status).toBe('active');
    });

    test('Employer A cannot update Employer B application status', async () => {
        const agent = await loginAs(
            'employer.a@skillnexa.test'
        );

        await agent
            .post(
                `/employer/applications/${fixture.applicationBId}/status`
            )
            .type('form')
            .send({ status: 'shortlisted' })
            .expect(404);

        const application = await db.one(
            'SELECT status FROM applications WHERE id = $1',
            [fixture.applicationBId]
        );

        expect(application.status).toBe('submitted');
    });

    test('Employer A can update their own company application status', async () => {
        const agent = await loginAs(
            'employer.a@skillnexa.test'
        );

        await agent
            .post(
                `/employer/applications/${fixture.applicationAId}/status`
            )
            .type('form')
            .send({ status: 'reviewing' })
            .expect(302)
            .expect(
                'Location',
                '/employer?notice=Application%20status%20updated.'
            );

        const application = await db.one(
            'SELECT status FROM applications WHERE id = $1',
            [fixture.applicationAId]
        );

        expect(application.status).toBe('reviewing');
    });

});
