const User = require("../models/adminModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const asyncHandler = require("express-async-handler");

function getUserData(headers) {
  const token = headers?.authorization?.split(" ")[1];
  if (!token)
    return {
      success: false,
      message: "Invalid token",
      userId: null,
      token: null,
    };

  try {
    const decodedToken = jwt.decode(token, { complete: true });
    if (!decodedToken) {
      return {
        success: false,
        message: "Invalid Token",
        userId: null,
      };
    }
    const currentTime = Math.floor(Date.now() / 1000);
    if (decodedToken.payload.exp && currentTime > decodedToken.payload.exp) {
      return {
        success: false,
        message: "Token has expired",
        userId: null,
      };
    }
    const verifiedToken = jwt.verify(token, process.env.JWT_SECRET);

    if (!verifiedToken)
      return {
        success: false,
        message: "Invalid token",
        userId: null,
      };
    return {
      success: true,
      message: "Token verified successfully",
      userId: verifiedToken.id, // Assuming the token payload contains the user ID as 'id'
    };
  } catch (error) {
    return {
      success: false,
      message: "Invalid Token",
      userId: null,
    };
  }
}
//create user
const createUser = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;
    // Basic validation
    if (!email && !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide all fields." });
    }
    //validation for email
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email..",
      });
    }
    //validation for password
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Please enter password minimum 8 length..",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email is already registered." });
    }

    //hashing password
    //const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, 10);

    //Create a new user
    const newUser = await User.create({ email, password: hashedPassword });
    return res.status(200).json({
      newUser,
      success: true,
      message: "Admin signed up successfully.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error });
  }
});

//login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);
  try {
    const existingUser = await User.findOne({ email });
    // Check if user exists
    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "Admin does not exits" });
    }
    // Compare passwords
    const matchPassword = await bcrypt.compare(password, existingUser.password);
    if (!matchPassword) {
      return res
        .status(400)
        .json({ success: false, matchPassword, message: "Invalid password" });
    }
    const token = jwt.sign(
      { email: existingUser.email, id: existingUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    console.log(existingUser);
    res.status(201).json({
      success: true,
      token,
      email,
      message: "Admin Login successfull...",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error });

    // throwError("Server", 500, false);
  }
});

//request for password reset

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
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Email not found" });
    }
    const generateOTP = () => {
      return crypto.randomInt(100000, 999999).toString();
    };
    const otp = generateOTP();
    const otpExpire = Date.now() + 10 * 60 * 1000;
    user.otp = otp;
    user.otpExpire = new Date(otpExpire);
    await user.save();
    const mailOptions = {
      from: {
        name: "Smart Restaurant",
        address: process.env.EMAIL,
      },
      to: email,
      subject: "Email verification one-time-password(OTP) . ",
      text: `    Smart Restaurant is received a request to reset your Gmail password.

      Your code is: ${otp}. 
      
      Use this code to reset your password and access your Gmail account not to share to anyone.
      
      This code will expire in 1 hours.`,
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

const verifiedEmailOTP = asyncHandler(async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!otp) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide OTP." });
    }
    const finduser = await User.findOne({ email });
    if (!finduser) {
      return res
        .status(400)
        .json({ success: false, message: "User not found." });
    }
    if (finduser.otp !== otp || finduser.otpExpire < Date.now()) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }
    const token = jwt.sign({ id: finduser._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    finduser.isOTPVerified = true;
    finduser.otp = undefined;
    finduser.otpExpire = undefined;
    await finduser.save();
    return res
      .status(200)
      .json({ success: true, token, message: "OTP verified successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});
//reset password
const resetPassword = asyncHandler(async (req, res) => {
  const { userId } = getUserData(req.headers);
  console.log("token:", userId);
  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid or Expired token" });
  }
  const { newPassword, confirmNewPassword } = req.body;
  if (!newPassword || !confirmNewPassword) {
    return res
      .status(400)
      .json({ success: false, message: "Provide a new password" });
  }
  try {
    const user = await User.findById({ _id: userId, isOTPVerified: true });
    console.log(user);
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }
    if (newPassword !== confirmNewPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Password does not match" });
    }
    user.password = await bcrypt.hash(confirmNewPassword, 10);
    user.isResetPasswordVerified = true;
    await user.save();
    return res
      .status(200)
      .json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});

//logout
const logout = asyncHandler(async (req, res) => {
  try {
    const { success, message, userId } = getUserData(req.headers);
    // console.log(userId);
    if (!success) {
      const statusCode = message === "Token has expired " ? 401 : 400;
      return res.status(statusCode).json({ success: false, message });
    }
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide token... " });
    }
    const user = await User.findById(userId);
    console.log("user:", user);
    if (!user) {
      return res.status(403).json({
        success: false,
        message: "User not found. Please log in again",
      });
    }
    // Assuming the token is part of the authorization header
    const token = req.headers.authorization.split(" ")[1];

    // // Ensure the tokens array exists
    if (!user.tokens) {
      user.tokens = [];
    }
    // Remove the token from the user's tokens array
    user.tokens = user.tokens.filter((t) => t.token !== token);
    await user.save();
    return res
      .status(200)
      .json({ success: true, message: "Successfully logged out" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error });
  }
});

module.exports = {
  createUser: createUser,
  login: login,
  requestPasswordReset: requestPasswordReset,
  resetPassword: resetPassword,
  logout: logout,
  verifiedEmailOTP: verifiedEmailOTP,
};
