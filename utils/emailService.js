const nodemailer = require("nodemailer");

const sendResetEmail = async (email, token) => {
  // Configure your email transport using nodemailer
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Password Reset",
    text: `You requested a password reset. Please use the following token to reset your password: ${token}`,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendResetEmail;
