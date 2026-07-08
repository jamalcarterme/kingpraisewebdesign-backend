const nodemailer = require('nodemailer');

// Sends an email if SMTP credentials are configured. If not configured,
// it silently logs to console instead of throwing, so bookings/contact
// forms still get saved to the database even without email set up yet.
const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[sendEmail] SMTP not configured. Skipped email to ${to}: ${subject}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"King Praise Web Design" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;
