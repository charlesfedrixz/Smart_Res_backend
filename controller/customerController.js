const asyncHandler = require("express-async-handler");
const customer = require("../models/customerModel");
const jwt = require("jsonwebtoken");
const { throwError } = require("../utils/errorHandler");
const crypto = require("crypto");
const twilio = require("twilio");

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
      body: `Your OTP code is ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER, // Your Twilio phone number
      to: formattedPhoneNumber,
    });

    console.log(`Message sent: ${message.sid}`);
  } catch (error) {
    console.error("Error sending SMS:", error);
  }
}
const sendSMSNotification = (mobileNumber, newStatus) => {
  return client.messages.create({
    body: newStatus,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: mobileNumber,
  });
};

const register = asyncHandler(async (req, res) => {
  const { mobileNumber, currentTableNumber } = req.body;
  console.log(mobileNumber, currentTableNumber);
  if (!mobileNumber || !currentTableNumber) {
    return res
      .status(400)
      .json({ msg: "Please provide the mobile number and table number. " });
  }

  const table = await customer.findOne({ currentTableNumber });
  const user = await customer.findOne({ mobileNumber });

  if (table) {
    res.status(200).json({
      success: true,
      msg: `Table ${currentTableNumber} is already exist. So, Scan another Table...  `,
    });
  }

  // If user is already exist
  if (user) {
    user.currentTableNumber = currentTableNumber;
    //await user.save();

    const payload = {
      userData: {
        id: user.id,
        mobileNumber: user.mobileNumber,
        currentTableNumber,
      },
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET);
    console.log(token);
    // user.isVerified = true;
    // user.otp = undefined;
    // user.otpExpire = undefined;
    await user.save();
    res.status(200).json({
      message: "login with success...",
      success: true,
      token,
    });
    console.log(res);
    // return res.status(200).json({
    //   msg: "Mobile number is already registered.",
    //   token,
    //   success: true,
    // });
  }

  // const otp = generateOTP();
  // user.otp = otp;
  // user.otpExpire = Date.now() + 3600000;
  // user.currentTableNumber = currentTableNumber;
  // await user.save();
  //   await sendOTPSMS(mobileNumber, otp);
  //   return res.status(200).json({ msg: `OTP sent to your ${mobileNumber}.` , success: true});

  // }

  // * There is no existing user
  const otp = generateOTP();

  await customer.create({
    otp,
    otpExpire: Date.now() + 1000 * 60 * 2,
    mobileNumber,
    currentTableNumber,
  });
  // user = new customer({  mobileNumber, currentTableNumber });
  // user.otp = otp;
  // user.otpExpire = Date.now() + 3600000; // OTP valid for 1 hour

  try {
    // await user.save();
    await sendOTPSMS(mobileNumber, otp);
    return res.status(200).json({
      msg: `OTP sent to your mobile number: ${mobileNumber}.`,
      success: true,
      token: null,
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Error registering user or sending OTP. Please try again.",
    });

    //throwError("Error registering user or sending OTP. Please try again.", 400);

    // return res.status(400).json({
    //   msg: "Error registering user or sending OTP. Please try again.",
    // });
  }
});

const verifyOtp = async (req, res) => {
  const { mobileNumber, otp } = req.body;

  try {
    let user = await customer.findOne({ mobileNumber, otp });

    if (!user) {
      return res
        .status(400)
        .json({ msg: "User does not exist", token: null, success: false });
    }
    console.log(`Current Time: ${Date.now()}`);
    console.log(`OTP Expiry Time: ${user.otpExpire}`);
    console.log(`Provided OTP: ${otp}`);
    // console.log(`Stored OTP: ${user.otp}`);

    if (user.otp !== otp || user.otpExpire < Date.now()) {
      return res.status(400).json({ msg: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();
    const payload = {
      user: {
        id: user.id,
        phone: user.mobileNumber,
      },
    };
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET
      //, { expiresIn: "1h",}
    );

    res
      .status(200)
      .json({ msg: "OTP verified successfully", token, success: true });
    console.log(token);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
    // throwError("Server error", 500);
  }
};

const resendOtp = asyncHandler(async (req, res) => {
  const { mobileNumber } = req.body;

  if (!mobileNumber) {
    return res
      .status(400)
      .json({ msg: "Please provide a mobile number and table number." });
  }
  // Please add an ERROR for invalid mobile number
  const formattedMobileNumber = `${countryCode}${mobileNumber.replace(
    /\D/g,
    ""
  )}`;
  let user = await customer.findOne({ mobileNumber: formattedMobileNumber });

  if (!user) {
    return res.status(400).json({ msg: "User not found." });
  }

  const otp = generateOTP();
  user.otp = otp;
  user.otpExpire = Date.now() + 3600000; // OTP valid for 1 hour

  try {
    await user.save();
    await sendOTPSMS(formattedMobileNumber, otp);
    return res
      .status(200)
      .json({ msg: `New OTP sent to your +${formattedMobileNumber}.` });
  } catch (error) {
    console.error("Error sending SMS:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
    //throwError("Error resending OTP. Please try again later.", 500);

    // return res
    //   .status(500)
    //   .json({ msg:  });
  }
});

// const deleteAccount = asyncHandler(async (req, res) => {
//   const { mobileNumber } = req.body;
//   console.log(mobileNumber);

//   try {
//     const user = await customer.findOne({
//       mobileNumber,
//     });
//     console.log(user);
//     if (!user) {
//       return res.status(400).json({ msg: "User not found." });
//     }

//     await customer.deleteOne({ _id: user._id });

//     return res
//       .status(200)
//       .json({ msg: "Account deleted successfully.", success: true });
//   } catch (error) {
//     console.error(error.message);
//     throwError(" Server Error ", 500);
//   }
// });
const deleteAccount = asyncHandler(async (req, res) => {
  const { currentTableNumber } = req.body;
  console.log(currentTableNumber);

  try {
    const user = await customer.findOne({
      currentTableNumber,
    });
    console.log(user);
    if (!user) {
      return res.status(400).json({ msg: "User not found." });
    }

    await customer.deleteOne({ _id: user._id });

    return res
      .status(200)
      .json({ msg: "Account deleted successfully.", success: true });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
    //throwError(" Server Error ", 500);
  }
});
module.exports = {
  register: register,
  verifyOtp: verifyOtp,
  resendOtp: resendOtp,
  sendSMSNotification: sendSMSNotification,
  deleteAccount: deleteAccount,
};
