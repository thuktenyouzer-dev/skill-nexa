
const path = require('path');
const dotenv = require('dotenv');

const envTestPath = path.join(__dirname, '.env.test');

dotenv.config({ path: envTestPath });

process.env.NODE_ENV = 'test';

const configuredTestDb = Boolean(
    process.env.TEST_DATABASE_URL &&
    /skill_nexa_test/i.test(process.env.TEST_DATABASE_URL)
);

global.__SKILL_NEXA_TEST_DB_CONFIGURED__ = configuredTestDb;

if (!process.env.TEST_DATABASE_URL) {
    process.env.TEST_DATABASE_URL =
        'postgres://test:test@127.0.0.1:5432/skill_nexa_test';
}

if (!process.env.TEST_MONGO_URI) {
    process.env.TEST_MONGO_URI =
        'mongodb://127.0.0.1:27017/skill_nexa_test';
}

if (!process.env.SESSION_SECRET) {
    process.env.SESSION_SECRET = 'jest-only-session-secret';
}
