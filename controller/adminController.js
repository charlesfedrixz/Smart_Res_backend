const User = require("../models/adminModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const asyncHandler = require("express-async-handler");
const getUserData = require("../middleware/authUser");
const sendResponse = require("../middleware/sendResponse");
const AppError = require("../middleware/errorHandler");

//create user
const createUser = asyncHandler(async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // Basic validation
    if (!email && !password) {
      return next(new AppError("Please provide all fields.", 400));
    }
    //validation for email
    if (!validator.isEmail(email)) {
      return next(new AppError("Please enter a valid email..", 400));
    }
    //validation for password
    if (password.length < 8) {
      return next(
        new AppError("Please enter password minimum 8 length..", 400)
      );
    }
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError("Email is already registered.", 400));
    }

    //hashing password
    //const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, 10);

    //Create a new user
    const newUser = await User.create({ email, password: hashedPassword });
    return sendResponse(res, true, 200, "Admin signed up successfully.", {
      newUser,
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Server Error", 500));
  }
});

//login
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    // Check if user exists
    if (!existingUser) {
      return next(new AppError("Admin does not exits", 404));
    }
    // Compare passwords
    const matchPassword = await bcrypt.compare(password, existingUser.password);
    if (!matchPassword) {
      return next(new AppError("Invalid password", 400));
    }
    const token = jwt.sign(
      { email: existingUser.email, id: existingUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    return sendResponse(res, true, 201, "Admin Login successfull.", {
      token,
      email,
    });
  } catch (error) {
    console.log(error);
    return next(new AppError("Server Error", 500));
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

const requestPasswordReset = asyncHandler(async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return next(new AppError("Email not found", 404));
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
    return sendResponse(res, true, 201, "Password reset link sent", {});
  } catch (error) {
    console.error(error);
    return next(new AppError("Server Error", 500));
  }
});

const verifiedEmailOTP = asyncHandler(async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!otp) {
      return next(new AppError("Please provide OTP.", 400));
    }
    const finduser = await User.findOne({ email });
    if (!finduser) {
      return next(new AppError("User not found.", 400));
    }
    if (finduser.otp !== otp || finduser.otpExpire < Date.now()) {
      return next(new AppError("Invalid OTP", 400));
    }
    const token = jwt.sign({ id: finduser._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    finduser.isOTPVerified = true;
    finduser.otp = undefined;
    finduser.otpExpire = undefined;
    await finduser.save();
    return sendResponse(res, true, 200, "OTP verified successfully", { token });
  } catch (error) {
    console.error(error);
    return next(new AppError("Server Error", 500));
  }
});
//reset password
const resetPassword = asyncHandler(async (req, res, next) => {
  const { userId } = getUserData(req.headers);
  console.log("token:", userId);
  if (!userId) {
    return next(new AppError("Invalid or Expired token", 400));
  }
  const { newPassword, confirmNewPassword } = req.body;
  if (!newPassword || !confirmNewPassword) {
    return next(new AppError("Provide a new password", 400));
  }
  try {
    const user = await User.findById({ _id: userId, isOTPVerified: true });
    console.log(user);
    if (!user) {
      return next(new AppError("User not found", 400));
    }
    if (newPassword !== confirmNewPassword) {
      return next(new AppError("Password does not match", 400));
    }
    user.password = await bcrypt.hash(confirmNewPassword, 10);
    user.isResetPasswordVerified = true;
    await user.save();
    return sendResponse(res, true, 200, "Password reset successfully", {});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});

//logout
const logout = asyncHandler(async (req, res, next) => {
  try {
    const { success, message, userId } = getUserData(req.headers);
    if (!success) {
      const statusCode = message === "Token has expired " ? 401 : 400;
      return res.status(statusCode).json({ success: false, message });
    }
    if (!userId) {
      return next(new AppError("Please Provide token", 400));
    }
    const user = await User.findById(userId);
    console.log("user:", user);
    if (!user) {
      return next(new AppError("User not found. Please log in again", 403));
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
    return sendResponse(res, true, 200, "Successfully logged out", {});
  } catch (error) {
    console.error(error);
    return next(new AppError("Server Error", 500));
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
