const User = require('../models/adminModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const crypto = require('node:crypto');
const nodemailer = require('nodemailer');
const asyncHandler = require('express-async-handler');
const getUserData = require('../middleware/authUser');
const Restaurant = require('../models/restaurantModel');
const mongoose = require('mongoose');
//create user
const createUser = asyncHandler(async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'Super_Admin') {
      return res
        .status(401)
        .json({ success: false, message: `${user.role} is not authorized` });
    }

    const { email, password, name, role, restaurant } = req.body;
    // Basic validation
    if (!email || !password || !name || !role) {
      return res
        .status(400)
        .json({ success: false, message: 'Please provide all fields.' });
    }
    //validation for email
    if (!validator.isEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: 'Please enter a valid email..' });
    }
    //validation for password
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Please enter password minimum 8 length..',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: 'Email is already registered.' });
    }

    //hashing password
    const hashedPassword = await bcrypt.hash(password, 10);

    if (role === 'Restaurant_Admin') {
      if (!restaurant) {
        return res
          .status(400)
          .json({ success: false, message: 'Please provide a restaurant.' });
      }
      // Look up the restaurant by name
      let findRestaurant;
      // * Better approach to check if the restaurant is a valid MongoDB ObjectId
      if (mongoose.isValidObjectId(restaurant)) {
        findRestaurant = await Restaurant.findById(restaurant);
      } else {
        return res
          .status(400)
          .json({ success: false, message: 'Invalid restaurant ID.' });
      }

      if (!findRestaurant) {
        return res.status(404).json({
          success: false,
          message: ` "${restaurant}" Restaurant not found.`,
        });
      }

      //Create a new user
      const newUser = await User.create({
        email,
        name,
        role,
        restaurant: findRestaurant._id,
        password: hashedPassword,
      });

      return res.status(200).json({
        success: true,
        newUser,
        message: `${role} signed up successfully.`,
      });
    }

    //Create a new user
    const newUser = await User.create({
      email,
      name,
      role,
      password: hashedPassword,
    });

    return res.status(200).json({
      success: true,
      newUser,
      message: `${role} signed up successfully.`,
    });
  } catch (error) {
    console.error('error in creating admin user', error);
    return res.status(500).json({ success: true, message: 'Server Error' });
  }
});

//login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email: email });
    // Check if user exists
    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: 'User does not exits' });
    }
    // Compare passwords
    const matchPassword = await bcrypt.compare(password, existingUser.password);
    if (!matchPassword) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid password' });
    }
    const token = jwt.sign(
      { email: existingUser.email, id: existingUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    // Create a new object without sensitive data
    // Using password: _ to destructure and discard the password field from the object
    // The underscore (_) is a convention to indicate we're intentionally ignoring this value
    // This creates a new object userDataWithoutSensitiveInfo that has all fields except password
    const { password: _, ...userDataWithoutSensitiveInfo } =
      existingUser.toObject();

    res.cookie('jwt', token, {
      httpOnly: true, // Prevents client-side access to cookie
      secure: true, // secure:true won't work for http://localhost testing. Only use in production with HTTPS. sameSite:'none' also requires HTTPS in production
      sameSite: 'none', // Strict in prod, none for local cross-origin testing
      path: '/', // Cookie path
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day expiry
      maxAge: 24 * 60 * 60 * 1000, // Alternative to expires
    });
    // if (existingUser.role !== 'Restaurant_Admin') {
    return res.status(200).json({
      success: true,
      data: userDataWithoutSensitiveInfo,
      message: `${existingUser.role} Login successfull.`,
    });
    // }

    // const findRestaurant = await Restaurant.findById(existingUser.restaurant);
    // if (!findRestaurant) {
    //   return res
    //     .status(401)
    //     .json({ success: false, message: 'Restaurant not found' });
    // }

    // return res.status(201).json({
    //   success: true,
    //   token,
    //   Data: { Role: existingUser.role, Restaurant: findRestaurant.name },
    //   message: `${existingUser.role} Login successfull.`,
    // });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

const generateOTP = () => {
  const otp = (crypto.randomBytes(3).readUIntBE(0, 3) % 900000) + 100000;
  return otp.toString();
};
const transporter = nodemailer.createTransport({
  // host: 'smtp.gmail.com',
  // port: 587,
  service: 'gmail',
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.APP_PASSWORD,
  },
});

const sendOtpMail = async (email, otp) => {
  try {
    const mailOptions = {
      from: 'Chand Tekcham <tekchamchand@gmail.com>',
      to: email,
      subject: 'Email verification one-time-password(OTP) . ',
      html: `
      <h1>Your code is: ${otp}. </h1>
      <p>Use this code to verify your email & password and not to share to anyone.</p>
      <p>This code will expire in 1 hours.</p>
      `,
    };
    await transporter.sendMail(mailOptions);
    console.log('OTP sent to email successfully');
  } catch (error) {
    console.error('Error sending OTP email:', error);
  }
};

//request for password reset
const requestPasswordReset = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'Email not found' });
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
        name: 'Smart Restaurant',
        address: process.env.EMAIL,
      },
      to: email,
      subject: 'Email verification one-time-password(OTP) . ',
      text: `    Smart Restaurant is received a request to reset your Gmail password.

      Your code is: ${otp}. 
      
      Use this code to reset your password and access your Gmail account not to share to anyone.
      
      This code will expire in 1 hours.`,
    };
    await transporter.sendMail(mailOptions);
    return res
      .status(201)
      .json({ success: true, message: 'Password reset link sent' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: true, message: 'Server Error' });
  }
});

const verifiedEmailOTP = asyncHandler(async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!otp) {
      return res
        .status(400)
        .json({ success: false, message: 'Please provide OTP.' });
    }
    const finduser = await User.findOne({ email });
    if (!finduser) {
      return res
        .status(400)
        .json({ success: false, message: 'User not found.' });
    }
    if (finduser.otp !== otp || finduser.otpExpire < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    // const token = jwt.sign({ id: finduser._id }, process.env.JWT_SECRET, {
    //   expiresIn: "1d",
    // });
    finduser.isOTPVerified = true;
    finduser.otp = undefined;
    finduser.otpExpire = undefined;
    await finduser.save();
    return res
      .status(200)
      .json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});
//reset password
const resetPassword = asyncHandler(async (req, res) => {
  const user = req.user;
  const { newPassword, confirmNewPassword } = req.body;
  if (!newPassword || !confirmNewPassword) {
    return res
      .status(400)
      .json({ success: false, message: 'Provide a new password' });
  }
  try {
    const user = await User.findById({ _id: userId, isOTPVerified: true });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: 'User not found' });
    }
    if (newPassword !== confirmNewPassword) {
      return res
        .status(400)
        .json({ success: false, message: 'Password does not match' });
    }
    user.password = await bcrypt.hash(confirmNewPassword, 10);
    user.isResetPasswordVerified = true;
    await user.save();
    return res
      .status(200)
      .json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

//logout
const logout = asyncHandler(async (req, res) => {
  try {
    // Clear the JWT cookie with secure options
    res.clearCookie('jwt', {
      httpOnly: true, // Prevents client-side access
      secure: true, // HTTPS only in production
      sameSite: 'none', // Allow cross-origin requests - use strict if both are in same domain for CSRF protection
      path: '/', // Cookie path
      expires: new Date(0), // Sets expiry to Jan 1, 1970
    });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during logout',
    });
  }
});

const getAllAdmin = asyncHandler(async (req, res) => {
  const user = req.user;

  if (user.role !== 'Super_Admin') {
    return res.status(401).json({
      success: false,
      message: `${user.role} is not authorized to get all admin`,
    });
  }

  const admin = await User.find();
  const adminData = admin.map((admin) => {
    const { password, otp, otpExpire, ...optimisedAdminData } =
      admin.toObject();
    return optimisedAdminData;
  });

  return res.status(200).json({ success: true, adminData });
});

const getPermissions = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (req.user.role !== 'Super_Admin' && req.user.role !== 'Restaurant_Admin') {
    return res.status(401).json({
      success: false,
      message: `${req.user.role} is not authorized to get permissions`,
    });
  }

  if (!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID format',
    });
  }

  console.log(userId);

  const admin = await User.findById(userId);
  return res
    .status(200)
    .json({ success: true, permissions: admin.permissions });
});

const addPermissions = asyncHandler(async (req, res) => {
  if (req.user.role !== 'Super_Admin') {
    return res.status(401).json({
      success: false,
      message: `${req.user.role} is not authorized to add permissions`,
    });
  }
  const { userId } = req.params;
  const { permissions } = req.body;
  if (!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID format',
    });
  }

  const admin = await User.findById(userId);
  admin.permissions.push(...permissions);
  await admin.save();

  return res.status(200).json({ success: true, message: 'Permissions added' });
});

const deletePermissions = asyncHandler(async (req, res) => {
  if (req.user.role !== 'Super_Admin') {
    return res.status(401).json({
      success: false,
      message: `${req.user.role} is not authorized to delete permissions`,
    });
  }

  const { userId } = req.params;
  if (!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid permission ID format',
    });
  }
  const { permissionIds } = req.body;

  console.log(userId, permissionIds);

  const adminToBeUpdated = await User.findById(userId);
  adminToBeUpdated.permissions = adminToBeUpdated.permissions.filter(
    (permission) => !permissionIds.includes(permission._id.toString())
  );

  console.log(adminToBeUpdated.permissions);
  await adminToBeUpdated.save();
  return res
    .status(200)
    .json({ success: true, message: 'Permissions deleted' });
});

const updatePermissions = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (req.user.role !== 'Super_Admin') {
    return res.status(401).json({
      success: false,
      message: `${req.user.role} is not authorized to update permissions`,
    });
  }

  if (!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid permission ID format',
    });
  }

  const { permissions } = req.body;
  const adminToBeUpdated = await User.findById(userId);
  adminToBeUpdated.permissions = permissions;
  await adminToBeUpdated.save();
  return res
    .status(200)
    .json({ success: true, message: 'Permissions updated' });
});

const getAdmin = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID format',
    });
  }
  const admin = await User.findById(userId);
  const { password, otp, otpExpire, ...optimisedAdminData } = admin.toObject();
  return res.status(200).json({ success: true, admin: optimisedAdminData });
});

module.exports = {
  createUser: createUser,
  login: login,
  requestPasswordReset: requestPasswordReset,
  resetPassword: resetPassword,
  logout: logout,
  verifiedEmailOTP: verifiedEmailOTP,
  getAllAdmin,
  getPermissions,
  addPermissions,
  deletePermissions,
  updatePermissions,
  getAdmin,
};
