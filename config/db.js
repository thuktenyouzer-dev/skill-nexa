
const pgp = require('pg-promise')({
  capSQL: true
});

function buildConnection() {
  if (process.env.NODE_ENV === 'test') {
    const testUrl = process.env.TEST_DATABASE_URL;

    if (!testUrl) {
      throw new Error(
        'TEST_DATABASE_URL is required when NODE_ENV=test. Refusing to use a development database.'
      );
    }

    if (!/skill_nexa_test/i.test(testUrl)) {
      throw new Error(
        'The test connection must point to a database named skill_nexa_test.'
      );
    }

    return { connectionString: testUrl };
  }

  if (process.env.DATABASE_URL) {
    const connection = {
      connectionString: process.env.DATABASE_URL
    };

    if (process.env.DB_SSL === 'true') {
      connection.ssl = { rejectUnauthorized: false };
    }

    return connection;
  }

  const connection = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'skill_nexa_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || ''
  };

  if (process.env.DB_SSL === 'true') {
    connection.ssl = { rejectUnauthorized: false };
  }

  return connection;
}

const db = pgp(buildConnection());

module.exports = db;
module.exports.pgp = pgp;
