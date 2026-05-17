const nodemailer = require('nodemailer');

function getTransporter() {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
  }
  // Dev: log to console instead of sending
  return null;
}

async function sendVerificationEmail(email, token) {
  const baseUrl = process.env.APP_URL || 'http://localhost:5173';
  const link = `${baseUrl}/verify?token=${token}`;

  const transporter = getTransporter();
  if (!transporter) {
    console.log(`\n📧 [DEV] Verification link for ${email}:\n${link}\n`);
    return;
  }

  await transporter.sendMail({
    from: `"FitnessIQ" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify your FitnessIQ account',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0b1829;color:#e8f4f8;border-radius:16px;">
        <h1 style="color:#00d4e8;font-size:24px;margin-bottom:8px;">FitnessIQ 💪</h1>
        <p style="color:#7a9bb5;margin-bottom:24px;">Click below to verify your email and start tracking your gains.</p>
        <a href="${link}" style="display:inline-block;background:#00d4e8;color:#0b1829;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:15px;">Verify Email</a>
        <p style="color:#4a6a82;font-size:12px;margin-top:24px;">If you didn't sign up, ignore this email.</p>
      </div>
    `,
  });
}

module.exports = { sendVerificationEmail };
