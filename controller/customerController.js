const asyncHandler = require("express-async-handler");
const customer = require("../models/customerModel");
const jwt = require("jsonwebtoken");
const { throwError } = require("../utils/errorHandler");
const crypto = require("crypto");
const twilio = require("twilio");
const { Server } = require("http");
const Order = require("../models/orderModels");

const countryCode = "+91";
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};
const accountSid = process.env.TWILIO_ACCOUNT_SID; // Your Account SID from www.twilio.com/console
const authToken = process.env.TWILIO_AUTH_TOKEN; // Your Auth Token from www.twilio.com/console
const client = twilio(accountSid, authToken);

async function sendOTPSMS(mobileNumber, otp) {
  try {
    const formattedPhoneNumber = `${countryCode}${mobileNumber.replace(
      /\D/g,
      ""
    )}`;
    const message = await client.messages.create({
      body: `Smart Restaurant verification OTP code: ${otp}.
              Code is valid for 5 minutes.
               - Smart Restaurant Team `,
      from: process.env.TWILIO_PHONE_NUMBER, // Your Twilio phone number
      to: formattedPhoneNumber,
    });
    console.log(`Message sent: ${message.sid}`);
  } catch (error) {
    console.error(error);
  }
}
const resendOtp = asyncHandler(async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    if (!mobileNumber) {
      return res.status(400).json({ msg: "Please provide a mobile number." });
    }
    const user = await customer.findOne({
      mobileNumber,
    });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found." });
    }
    const otp = generateOTP();
    user.isVerified = false;
    user.otp = otp;
    user.otpExpire = Date.now() + 1000 * 60 * 5;
    await user.save();
    await sendOTPSMS(mobileNumber, otp);
    return res.status(200).json({
      success: true,
      user,
      message: "Resend OTP with success.",
    });
  } catch (error) {
    console.error("Error sending SMS:", error);
    return res.status(500).json({
      success: false,
      message: error,
    });
  }
});
const deleteAccount = asyncHandler(async (req, res) => {
  const { currentTableNumber } = req.body;
  console.log(currentTableNumber);
  try {
    const user = await customer.findOne({
      currentTableNumber,
    });
    console.log("user", user);
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found." });
    }
    // await Order.deleteMany({ customerId: user._id });  
    await customer.deleteOne({ _id: user._id });
    return res.status(200).json({
      message: "Account and associated orders deleted successfully.",
      success: true,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      success: false,
      message: error,
    });
  }
});

const mobileRegister = asyncHandler(async (req, res) => {
  try {
    const { mobileNumber, currentTableNumber } = req.body;
    if (!mobileNumber || !currentTableNumber) {
      return res.status(400).json({
        success: false,
        message: "Please provide a Mobile Number",
      });
    }
    const tableNumber = await customer.findOne({ currentTableNumber });
    if (tableNumber) {
      return res.status(400).json({
        success: false,
        message: "Table's occupied by another customer",
      });
    }
    const customerFind = await customer.findOne({ mobileNumber });
    if (customerFind) {
      const otp = generateOTP();
      customerFind.currentTableNumber = currentTableNumber;
      customerFind.otp = otp;
      await customerFind.save();

      //send otp function
      await sendOTPSMS(mobileNumber, otp);
      return res.status(200).json({
        success: true,
        token: null,
        message:
          "OTP pppp is send and register with success for existing user ",
      });
    }

    const otp = generateOTP();
    const newCustomer = await customer.create({
      mobileNumber: mobileNumber,
      currentTableNumber: currentTableNumber,
      otp: otp,
      otpExpire: Date.now() + 1000 * 60 * 5,
    });
    //send otp function
    await sendOTPSMS(mobileNumber, otp);
    return res.status(200).json({
      success: true,
      Data: newCustomer,
      token: null,
      message: "Register a new customer and OTP is send with success",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error });
  }
});
const OtpVerify = async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body;
    if (!mobileNumber || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide the field." });
    }
    const findCustomer = await customer.findOne({ mobileNumber });
    if (!findCustomer) {
      return res.status(200).json({ success: false, message: "No Data found" });
    }
    // if (findCustomer.otp !== otp || findCustomer.otpExpire < Date.now()) {
    //   return res.status(400).json({ success: false, message: "Invalid OTP." });
    // }
    if (findCustomer.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }
    if (findCustomer.otpExpire < Date.now()) {
      return res.status(400).json({ success: false, message: "Expired OTP." });
    }
    console.log(findCustomer.otp, otp);
    findCustomer.isVerified = true;
    findCustomer.otp = undefined;
    findCustomer.otpExpire = undefined;
    await findCustomer.save();

    const payload = {
      user: {
        id: findCustomer._id,
        mobileNumber: findCustomer.mobileNumber,
      },
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "5h",
    });
    // await sendSMSNotification(
    //   mobileNumber,
    //   `Smart Restaurant verified your ${mobileNumber} successfully.`
    // );
    return res.status(200).json({
      success: true,
      token,
      Data: {
        findCustomer,
      },
      message: "OTP verified with success",
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ success: false, message: error });
  }
};
module.exports = {
  resendOtp: resendOtp,
  deleteAccount: deleteAccount,
  mobileRegister: mobileRegister,
  OtpVerify: OtpVerify,
};
