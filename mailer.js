const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.APP_PASSWORD,
  },
});

const requestPasswordReset = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    console.log(user);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Email not found" });
    }
    const generateOTP = () => {
      return crypto.randomInt(100000, 999999).toString();
    };
    const otp = generateOTP();
    const mailOptions = {
      from: {
        name: "Smart Restaurant",
        address: process.env.EMAIL,
      },
      to: email,
      subject:
        "We have sent a one-time password (OTP) not to share to anyone. Password Reset for your email account.",
      text: `Your code is: ${otp}. Use it to disable your password and access your Telegram account.`,
    };
    await transporter.sendMail(mailOptions);
    return res
      .status(200)
      .json({ success: true, message: "Password reset link sent" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});

module.exports = {};
