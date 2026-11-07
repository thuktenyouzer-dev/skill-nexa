
jest.mock('../models/CompanyReview', () => ({
    getByCompany: jest.fn().mockResolvedValue([])
}));

const request = require('supertest');
const app = require('../app');
const db = require('../config/db');
const CompanyReview = require('../models/CompanyReview');

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

suite('Skill Nexa Employer review ownership tests', () => {

    beforeAll(async () => {
        await db.one('SELECT 1');

        fixture = await db.one(`
            SELECT
                (SELECT c.id
                 FROM companies c
                 JOIN users u ON u.id = c.owner_id
                 WHERE u.email = 'employer.a@skillnexa.test'
                ) AS "companyAId",

                (SELECT c.id
                 FROM companies c
                 JOIN users u ON u.id = c.owner_id
                 WHERE u.email = 'employer.b@skillnexa.test'
                ) AS "companyBId"
        `);
    });

    afterAll(async () => {
        await db.$pool.end();
    });

    beforeEach(() => {
        CompanyReview.getByCompany.mockClear();
    });

    test('Employer A retrieves reviews for Company A only', async () => {
        const agent = await loginAs(
            'employer.a@skillnexa.test'
        );

        await agent
            .get('/employer/reviews')
            .expect(200);

        expect(CompanyReview.getByCompany)
            .toHaveBeenCalledWith(Number(fixture.companyAId));

        expect(CompanyReview.getByCompany)
            .not.toHaveBeenCalledWith(Number(fixture.companyBId));
    });

    test('Employer B retrieves reviews for Company B only', async () => {
        const agent = await loginAs(
            'employer.b@skillnexa.test'
        );

        await agent
            .get('/employer/reviews')
            .expect(200);

        expect(CompanyReview.getByCompany)
            .toHaveBeenCalledWith(Number(fixture.companyBId));

        expect(CompanyReview.getByCompany)
            .not.toHaveBeenCalledWith(Number(fixture.companyAId));
    });

    test('Employer cannot select another company using a URL parameter', async () => {
        const agent = await loginAs(
            'employer.a@skillnexa.test'
        );

        await agent
            .get(`/employer/reviews?company_id=${fixture.companyBId}`)
            .expect(200);

        expect(CompanyReview.getByCompany)
            .toHaveBeenCalledWith(Number(fixture.companyAId));

        expect(CompanyReview.getByCompany)
            .not.toHaveBeenCalledWith(Number(fixture.companyBId));
    });

});
