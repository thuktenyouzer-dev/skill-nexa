
require('dotenv').config();

const app = require('./app');
const db = require('./config/db');
const { connectMongo, closeMongo } = require('./config/mongo');

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        // Verify PostgreSQL connection
        await db.one('SELECT 1');
        console.log('PostgreSQL connection verified.');

        // Connect MongoDB
        await connectMongo();
        console.log('MongoDB connection verified.');

        // Start Express server
        const server = app.listen(PORT, () => {
            console.log(
                `Skill Nexa running at ${process.env.APP_URL || `http://localhost:${PORT}`}`
            );
        });

        // Graceful shutdown
        const shutdown = async () => {
            console.log('Shutting down Skill Nexa...');

            server.close(async () => {
                try {
                    await closeMongo();
                    await db.$pool.end();
                } finally {
                    process.exit(0);
                }
            });
        };

        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);

    } catch (error) {
        console.error('Unable to start Skill Nexa:', error.message);
        process.exit(1);
    }
}

// Start server only when this file is executed directly
if (require.main === module) {
    startServer();
}

module.exports = { startServer };
