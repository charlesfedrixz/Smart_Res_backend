const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendResetEmail = async (email, token) => {
  const resetUrl = `http://yourfrontend.com/reset-password?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Password Reset Request",
    html: `<p>You requested a password reset. Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
  };

  await transporter.sendMail(mailOptions);
};
module.exports = {
  sendResetEmail: sendResetEmail,
};
