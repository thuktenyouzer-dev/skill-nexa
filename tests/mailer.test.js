
jest.mock('nodemailer', () => ({
    createTransport: jest.fn(() => ({
        sendMail: jest.fn().mockResolvedValue({
            messageId: 'mock-message'
        })
    }))
}));

process.env.GMAIL_USER = 'test@example.com';
process.env.GMAIL_APP_PASSWORD = 'test-app-password';
process.env.APP_URL = 'http://localhost:3000';

const nodemailer = require('nodemailer');
const mailer = require('../config/mailer');

describe('Email transport is isolated in tests', () => {

    test('verification email is sent through a mocked Nodemailer transport', async () => {

        await mailer.sendVerificationEmail(
            {
                id: 1,
                name: 'Test Candidate',
                email: 'test@example.com'
            },
            'test-token'
        );

        expect(nodemailer.createTransport).toHaveBeenCalledWith({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: 'test@example.com',
        pass: 'test-app-password'
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 60000
});
    });

});
