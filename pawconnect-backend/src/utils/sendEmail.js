const nodemailer = require('nodemailer');

let cachedTestAccount = null;

const sendEmail = async (options) => {
    let transporter;

    // Use SMTP environment variables if provided, otherwise fallback to Ethereal
    if (process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        });
    } else {
        // Ethereal fallback for local development/testing without real credentials
        if (!cachedTestAccount) {
            cachedTestAccount = await nodemailer.createTestAccount();
        }
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: cachedTestAccount.user, // generated ethereal user
                pass: cachedTestAccount.pass, // generated ethereal password
            },
        });
    }

    const message = {
        from: `${process.env.FROM_NAME || 'PawConnect'} <${process.env.FROM_EMAIL || 'noreply@pawconnect.org'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    const info = await transporter.sendMail(message);

    console.log('Message sent: %s', info.messageId);

    // If using ethereal, log the preview URL
    if (!process.env.SMTP_HOST) {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
};

module.exports = sendEmail;
