
const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
    if (transporter) return transporter;

    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (!user || !pass) return null;

    transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
            user: user.trim(),
            pass: pass.replace(/\s/g, '')
        },
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 60000
    });

    return transporter;
}

async function sendWithBrevo({ to, subject, html, text }) {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.MAIL_FROM;

    if (!apiKey) {
        throw new Error('BREVO_API_KEY is required in production.');
    }

    if (!senderEmail) {
        throw new Error('MAIL_FROM is required for Brevo email delivery.');
    }

    const emailData = {
        sender: {
            name: process.env.MAIL_FROM_NAME || 'Skill Nexa',
            email: senderEmail
        },
        to: [{ email: to }],
        subject
    };

    if (html) {
        emailData.htmlContent = html;
    } else {
        emailData.textContent = text || '';
    }

    let response;

    try {
        response = await fetch(
            'https://api.brevo.com/v3/smtp/email',
            {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': apiKey,
                    'content-type': 'application/json'
                },
                body: JSON.stringify(emailData)
            }
        );
    } catch (error) {
        throw new Error(`Could not connect to Brevo: ${error.message}`);
    }

    const responseText = await response.text();

    let result = {};

    try {
        result = responseText ? JSON.parse(responseText) : {};
    } catch {
        result = { message: responseText };
    }

    if (!response.ok) {
        throw new Error(
            `Brevo API failed (${response.status}): ${
                result.message || response.statusText
            }`
        );
    }

    console.log('Brevo email accepted:', result.messageId || 'success');

    return result;
}

async function sendMail({ to, subject, html, text }) {
    // Use Brevo whenever its API key is configured.
    if (process.env.BREVO_API_KEY) {
        return sendWithBrevo({ to, subject, html, text });
    }

    // Never use Gmail SMTP on the Render production service.
    if (process.env.NODE_ENV === 'production') {
        throw new Error(
            'BREVO_API_KEY and MAIL_FROM are required in production.'
        );
    }

    // Local development can continue using Gmail SMTP.
    const mailer = getTransporter();

    if (!mailer) {
        console.log('\n[Development email preview]');
        console.log(`To: ${to}\nSubject: ${subject}\n${text || html}\n`);

        return { preview: true };
    }

    return mailer.sendMail({
        from: process.env.MAIL_FROM || process.env.GMAIL_USER,
        to,
        subject,
        html,
        text
    });
}

function appUrl(pathname) {
    const base = (process.env.APP_URL || 'http://localhost:3000')
        .replace(/\/$/, '');

    return `${base}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}

async function sendVerificationEmail(user, rawToken) {
    const url = appUrl(
        `/verify-email/${encodeURIComponent(rawToken)}`
    );

    return sendMail({
        to: user.email,
        subject: 'Verify your Skill Nexa account',
        text: `Hello ${user.name}, verify your account by opening: ${url}`,
        html: `<p>Hello ${escapeHtml(user.name)},</p>
        <p>Verify your Skill Nexa account:</p>
        <p><a href="${url}">Verify email address</a></p>`
    });
}

async function sendPasswordResetEmail(user, rawToken) {
    const url = appUrl(
        `/reset-password/${encodeURIComponent(rawToken)}`
    );

    return sendMail({
        to: user.email,
        subject: 'Reset your Skill Nexa password',
        text: `Hello ${user.name}, reset your password using this link: ${url}`,
        html: `<p>Hello ${escapeHtml(user.name)},</p>
        <p>Use the link below to choose a new password. It expires in 30 minutes.</p>
        <p><a href="${url}">Reset password</a></p>`
    });
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

module.exports = {
    sendMail,
    sendVerificationEmail,
    sendPasswordResetEmail,
    appUrl
};
