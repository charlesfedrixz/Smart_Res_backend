const asyncHandler = require("express-async-handler");
const customer = require("../models/customerModel");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const twilio = require("twilio");
const AppError = require("../middleware/errorHandler");
const sendResponse = require("../middleware/sendResponse");

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
const resendOtp = asyncHandler(async (req, res, next) => {
  try {
    const { mobileNumber } = req.body;
    if (!mobileNumber) {
      return next(new AppError("Please provide a mobile number.", 400));
    }
    const user = await customer.findOne({
      mobileNumber,
    });
    if (!user) {
      return next(new AppError("User not found.", 400));
    }
    const otp = generateOTP();
    user.isVerified = false;
    user.otp = otp;
    user.otpExpire = Date.now() + 1000 * 60 * 5;
    await user.save();
    await sendOTPSMS(mobileNumber, otp);
    return sendResponse(res, true, 200, "Resend OTP with success.", { user });
  } catch (error) {
    console.error("Error sending SMS:", error);
    return next(new AppError("Server Error", 500));
  }
});
const deleteAccount = asyncHandler(async (req, res, next) => {
  const { currentTableNumber } = req.body;
  try {
    const user = await customer.findOne({
      currentTableNumber,
    });
    if (!user) {
      return next(new AppError("User not found.", 400));
    }
    await customer.deleteOne({ _id: user._id });
    return sendResponse(
      res,
      true,
      200,
      "Account and associated orders deleted successfully."
    );
  } catch (error) {
    console.error(error.message);
    return next(new AppError("Server Error", 500));
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

const Register = asyncHandler(async (req, res, next) => {
  try {
    const { mobileNumber, currentTableNumber } = req.body;
    if (!mobileNumber || !currentTableNumber) {
      return next(new AppError("Please provide a Mobile Number", 400));
    }
    const customerFind = await customer.findOne({ mobileNumber });
    if (customerFind && customerFind.currentTableNumber != currentTableNumber) {
      return next(
        new AppError(
          "Table's occupied by another customer try a new table",
          400
        )
      );
    } else if (
      customerFind &&
      customerFind.currentTableNumber == currentTableNumber
    ) {
      const otp = generateOTP();
      customerFind.currentTableNumber = currentTableNumber;
      customerFind.otp = otp;
      await customerFind.save();
      //send otp function
      await sendOTPSMS(mobileNumber, otp);
      return sendResponse(
        res,
        true,
        200,
        "OTP pppp is send and register with success for existing user ",
        { token: null }
      );
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
    return sendResponse(
      res,
      true,
      200,
      "Register a new customer and OTP is send with success",
      { Data: newCustomer }
    );
  } catch (error) {
    console.error(error);
    return next(new AppError("Server Error", 500));
  }
});
module.exports = {
  resendOtp: resendOtp,
  deleteAccount: deleteAccount,
  OtpVerify: OtpVerify,
  Register: Register,
};
