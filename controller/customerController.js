const asyncHandler = require('express-async-handler');
const Customer = require('../models/customerModel');
const Table = require('../models/tableModel');
const jwt = require('jsonwebtoken');
const twilio = require('twilio');
const Restaurant = require('../models/restaurantModel');

const COUNTRY_CODE = '+91';
const OTP_EXPIRY_MINUTES = 5;
const JWT_EXPIRY = '5h';

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendOTPSMS(phoneNumber) {
  try {
    const formattedPhoneNumber = `${COUNTRY_CODE}${phoneNumber.replace(
      /\D/g,
      ''
    )}`;

    // Send verification code using Twilio Verify service
    const verification = await twilioClient.verify.v2
      .services(process.env.TWILIO_SERVICE_SID)
      .verifications.create({
        to: formattedPhoneNumber,
        channel: 'sms',
      });

    console.log(`Verification initiated. Status: ${verification.status}`);
    return true;
  } catch (error) {
    console.error('Failed to send OTP SMS:', error);
    return false;
  }
}

async function verifyOTP(phoneNumber, code) {
  try {
    const formattedPhoneNumber = `${COUNTRY_CODE}${phoneNumber.replace(
      /\D/g,
      ''
    )}`;

    const verificationCheck = await twilioClient.verify.v2
      .services(process.env.TWILIO_SERVICE_SID)
      .verificationChecks.create({
        to: formattedPhoneNumber,
        code: code,
      });

    return verificationCheck.status === 'approved';
  } catch (error) {
    console.error('Failed to verify OTP:', error);
    return false;
  }
}

const resendOtp = asyncHandler(async (req, res) => {
  const { mobileNumber } = req.body;
  const { restaurantId } = req.params;

  if (!mobileNumber) {
    return res.status(400).json({
      success: false,
      message: 'Mobile number is required',
    });
  }

  const user = await Customer.findOne({
    mobileNumber,
    restaurantId,
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found',
    });
  }

  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found',
    });
  }

  user.otpExpire = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000;
  user.isVerified = false;

  await user.save();

  const smsSent = await sendOTPSMS(restaurant?.contact?.phone);
  if (!smsSent) {
    return res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'OTP resent successfully',
  });
});

const deleteAccount = asyncHandler(async (req, res) => {
  const { customerId, restaurantId } = req.params;

  const user = await Customer.findOne({
    _id: customerId,
    restaurantId,
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found',
    });
  }

  // Update associated table if exists
  if (user.tableId) {
    await Table.findByIdAndUpdate(user.tableId, {
      $set: { isOccupied: false },
    });
  }

  await user.deleteOne();

  return res.status(200).json({
    success: true,
    message: 'Account deleted successfully',
  });
});

const OtpVerify = asyncHandler(async (req, res) => {
  const { otp, mobileNumber } = req.body;
  const { restaurantId, tableId } = req.params;

  if (!otp || !mobileNumber) {
    return res.status(400).json({
      success: false,
      message: 'OTP and mobile number are required',
    });
  }

  const customer = await Customer.findOne({
    mobileNumber,
    restaurantId,
  });

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found',
    });
  }

  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found',
    });
  }

  if (customer.otpExpire < Date.now()) {
    return res.status(400).json({
      success: false,
      message: 'OTP has expired',
    });
  }

  const isValidOTP = await verifyOTP(restaurant?.contact?.phone, otp);
  if (!isValidOTP) {
    return res.status(400).json({
      success: false,
      message: 'Invalid OTP',
    });
  }

  customer.isVerified = true;
  customer.isLoggedIn = true;
  customer.otpExpire = undefined;
  customer.tableId = tableId;

  await customer.save();

  // Update table status
  await Table.findByIdAndUpdate(tableId, {
    $set: { isOccupied: true },
  });

  const token = jwt.sign(
    {
      customerId: customer._id,
      restaurantId: restaurant._id,
      tableId,
    },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );

  // set the token in the cookie
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  console.log('CHECK', customer._id);

  return res.status(200).json({
    success: true,
    data: {
      restaurantId: restaurant._id,
      customerId: customer._id,
      tableId,
    },
  });
});

const Register = asyncHandler(async (req, res) => {
  const { mobileNumber, name, numberOfGuests } = req.body;
  const { restaurantId, tableId } = req.params;

  if (!mobileNumber) {
    return res.status(400).json({
      success: false,
      message: 'Mobile number is required',
    });
  }

  // Validate table availability
  const table = await Table.findOne({
    _id: tableId,
    restaurantId,
    isOccupied: false,
  });

  if (!table) {
    return res.status(400).json({
      success: false,
      message: 'Table is not available',
    });
  }

  let existingCustomer = await Customer.findOne({
    mobileNumber,
    restaurantId,
  });

  const restaurant = await Restaurant.findById(restaurantId);

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found',
    });
  }

  if (existingCustomer) {
    existingCustomer.tableId = tableId;
    existingCustomer.numberOfGuests = numberOfGuests || 1;
    if (name) existingCustomer.name = name;
    existingCustomer.isVerified = true;
    await existingCustomer.save();
  } else {
    existingCustomer = await Customer.create({
      restaurantId,
      tableId,
      name: name || '',
      mobileNumber,
      numberOfGuests: numberOfGuests || 1,
      isVerified: true,
    });
  }

  // verify OTP
  await sendOTPSMS(restaurant?.contact?.phone);

  return res.status(200).json({
    success: true,
    message: 'OTP sent successfully',
  });
});

const login = asyncHandler(async (req, res) => {
  const { mobileNumber } = req.body;
  const { restaurantId, tableId } = req.params;

  if (!mobileNumber) {
    return res.status(400).json({
      success: false,
      message: 'Mobile number is required',
    });
  }

  const customer = await Customer.findOne({
    mobileNumber,
    restaurantId,
  });

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found',
    });
  }

  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found',
    });
  }

  customer.otpExpire = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000;
  customer.tableId = tableId;
  customer.isVerified = false;

  await customer.save();

  const smsSent = await sendOTPSMS(restaurant?.contact?.phone);
  if (!smsSent) {
    return res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'OTP sent successfully',
  });
});

const getAllCustomers = asyncHandler(async (req, res) => {
  const customers = await Customer.find();
  return res.status(200).json({
    success: true,
    data: customers,
  });
});

const getCustomerById = asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  const customer = await Customer.findById(customerId);
  return res.status(200).json({
    success: true,
    data: customer,
  });
});

const logout = asyncHandler(async (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 0,
    expires: new Date(0),
    path: '/',
  });

  return res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
});

module.exports = {
  resendOtp,
  deleteAccount,
  OtpVerify,
  Register,
  login,
  getAllCustomers,
  getCustomerById,
  logout,
};
