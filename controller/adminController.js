const User = require("../models/adminModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const crypto = require("crypto");
const sendResetEmail = require("../utils/emailService");
const asyncHandler = require("express-async-handler");
const throwError = require("../utils/errorHandler");

// function getUserData(headers) {
//   console.log("object");
//   if (!headers.authorization) {
//     return {
//       success: false,
//       message: "Token header missing",
//       userId: null,
//     };
//   }
//   // Split the Bearer token
//   const token = headers.authorization.split(" ")[1];
//   // const tokenParts = headers.authorization.split(" ");
//   // if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
//   //   return {
//   //     success: false,
//   //     message: "Invalid token format",
//   //     userId: null,
//   //   };
//   // }

//   // const token = tokenParts[1];
//   console.log(token);
//   if (!token) {
//     return res
//       .status(400)
//       .json({ success: false, message: "Token header missing", userId: null });
//   }
//   const verifiedToken = jwt.verify(token, process.env.JWT_SECRET);
//   console.log(verifiedToken);

//   if (!verifiedToken)
//     return {
//       success: false,
//       message: "Invalid token",
//       userId: null,
//     };
//   return {
//     success: true,
//     message: "Token verified successfully",
//     userId: verifiedToken.id, // Assuming the token payload contains the user ID as 'id'
//   };
// }
function getUserData(headers) {
  // Split the Bearer token
  const token = headers.authorization.split(" ")[1];
  if (!token)
    return {
      success: false,
      message: "Invalid token",
      userId: null,
    };
  const verifiedToken = jwt.verify(token, process.env.JWT_SECRET);
  console.log(verifiedToken);

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
      success: true,
      message: "Admin signed up successfully.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});

//login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
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
    res.status(201).json({
      success: true,
      token,
      email,
      message: "Admin Login successfull...",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Server Error" });

    // throwError("Server", 500, false);
  }
});

//request for password reset
const requestPasswordReset = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Email not found" });
    }
    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = await bcrypt.hash(token, 10);

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    await sendResetEmail(email, token);

    res
      .status(200)
      .json({ success: true, message: "Password reset link sent" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server Error" });

    // throwError("Server", 500, false);
  }
});

//reset password
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const user = await User.findOne({
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired token" });
    }

    const isTokenValid = await bcrypt.compare(token, user.resetPasswordToken);
    if (!isTokenValid) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired token" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server Error" });

    //    throwError("Server", 500, false);
  }
});

//logout
const logout = asyncHandler(async (req, res) => {
  try {
    const { userId } = getUserData(req.headers);
    console.log(userId);
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide token... " });
    }
    const user = await User.findById(userId);
    console.log(user);
    if (!user) {
      return res.status(403).json({
        success: false,
        message: "User not found. Please log in again",
      });
    }
    // Assuming the token is part of the authorization header
    const token = req.headers.authorization.split(" ")[1];

    // Ensure the tokens array exists
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
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});

module.exports = {
  createUser: createUser,
  login: login,
  requestPasswordReset: requestPasswordReset,
  resetPassword: resetPassword,
  logout: logout,
};
