const asyncHandler = require("express-async-handler");
const customer = require("../models/customerModel");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const twilio = require("twilio");
const getUserData = require("../middleware/authUser");
const Restaurant = require("../models/restaurantModel");

const countryCode = "+91";
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};
const accountSid = process.env.TWILIO_ACCOUNT_SID; // Your Account SID from www.twilio.com/console
const authToken = process.env.TWILIO_AUTH_TOKEN; // Your Auth Token from www.twilio.com/console
const client = twilio(accountSid, authToken);

async function sendOTPSMS(restaurantNumber, otp) {
  try {
    console.log("phone:", restaurantNumber);
    const formattedPhoneNumber = `${countryCode}${restaurantNumber.replace(
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
    console.error("Error in sending otp", error);
  }
}
const resendOtp = asyncHandler(async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    if (!mobileNumber) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide a mobile number." });
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
    return res
      .status(200)
      .json({ success: true, user, message: "Resend OTP with success." });
  } catch (error) {
    console.error("Error sending SMS:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});
const deleteAccount = asyncHandler(async (req, res) => {
  try {
    const { currentTableNumber } = req.body;

    const user = await customer.findOne({
      currentTableNumber,
    });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found." });
    }
    await customer.updateOne(
      { _id: user._id },
      { $set: { isLoggedIn: false } }
    );
    await customer.deleteOne({ _id: user._id });

    return res.status(200).json({
      success: true,
      message: "Your Account logout successfully.",
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});

const OtpVerify = async (req, res) => {
  try {
    const { name, otp } = req.body;
    console.log("Data:", name, otp);

    if (!name || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide the field." });
    }
    const findCustomer = await customer.findOne({ name });
    if (!findCustomer) {
      return res
        .status(200)
        .json({ success: false, message: "Customer not found" });
    }
    if (findCustomer.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }
    if (findCustomer.otpExpire < Date.now()) {
      return res.status(400).json({ success: false, message: "Expired OTP." });
    }
    console.log("otp:", findCustomer.otp);
    const findRestaurant = await Restaurant.findById(findCustomer.restaurant);
    findCustomer.isVerified = true;
    findCustomer.isLoggedIn = true;
    findCustomer.otp = undefined;
    findCustomer.otpExpire = undefined;
    await findCustomer.save();

    const payload = {
      user: {
        id: findCustomer._id,
        name: findCustomer.name,
        restaurant: findRestaurant.name,
      },
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "5h",
    });
    return res.status(200).json({
      success: true,
      token,
      Data: {
        Restaurant: findRestaurant.name,
        Table_No: findCustomer.currentTableNumber,
      },
      message: "OTP verified with success",
    });
  } catch (error) {
    console.error("Error in verifying otp", error);
    return res.status(400).json({ success: false, message: "Server Error" });
  }
};

const Register = asyncHandler(async (req, res) => {
  try {
    const { mobileNumber, currentTableNumber, name, guest, restaurant } =
      req.body;
    if (
      !mobileNumber ||
      !currentTableNumber ||
      !name ||
      !guest ||
      !restaurant
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide a require fields" });
    }
    const customerFind = await customer.findOne({ mobileNumber });
    if (
      customerFind &&
      customerFind.currentTableNumber != currentTableNumber &&
      customerFind.isVerified
    ) {
      return res.status(400).json({
        success: false,
        token: null,
        message: "Table's occupied by another customer try a new table",
      });
    }
    if (customerFind && !customerFind.isVerified) {
      const otp = generateOTP();
      customerFind.otp = otp;
      customerFind.otpExpire = Date.now() + 1000 * 60 * 5; // Reset OTP expiry time
      await customerFind.save();

      //send otp function
      await sendOTPSMS(mobileNumber, otp);
      console.log("OTP resent to unverified customer");

      return res.status(200).json({
        success: true,
        token: null,
        message: "OTP is sent again for unverified customer",
      });
    }
    if (
      customerFind &&
      customerFind.currentTableNumber == currentTableNumber &&
      customerFind.isVerified
    ) {
      const otp = generateOTP();
      customerFind.currentTableNumber = currentTableNumber;
      customerFind.otp = otp;
      customerFind.otpExpire = Date.now() + 1000 * 60 * 5;
      customerFind.isLoggedIn = true;
      await customerFind.save();
      //send otp function
      await sendOTPSMS(mobileNumber, otp);
      console.log("existing number");
      return res.status(200).json({
        success: true,
        token: null,
        message: "OTP is send and register with success for existing user ",
      });
    }

    if (!customerFind) {
      const otp = generateOTP();
      const newCustomer = await customer.create({
        mobileNumber: mobileNumber,
        currentTableNumber: currentTableNumber,
        otp: otp,
        otpExpire: Date.now() + 1000 * 60 * 5,
        isLoggedIn: false,
      });

      //send otp function
      await sendOTPSMS(mobileNumber, otp);
      console.log("new number");

      return res.status(200).json({
        success: true,
        Data: newCustomer.mobileNumber,
        token: null,
        message: "Register a new customer and OTP is send with success",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: true, message: "Server Error" });
  }
});

const login = asyncHandler(async (req, res) => {
  try {
    const { restaurant } = req.params;

    const { phone, currentTableNumber, name, guest } = req.body;
    console.log("name:", restaurant, phone, currentTableNumber, name, guest);
    if (!phone || !currentTableNumber || !name || !guest || !restaurant) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide a require fields" });
    }

    const findRestaurant = await Restaurant.findOne({ name: restaurant });
    if (!findRestaurant) {
      return res
        .status(400)
        .json({ success: false, message: `${Restaurant} not found` });
    }
    const restaurantNumber = findRestaurant.contact.phone;
    const customerFind = await customer.findOne({ name });
    if (!customerFind) {
      const otp = generateOTP();
      //send otp function
      await sendOTPSMS(restaurantNumber, otp);
      const newCustomer = await customer.create({
        name,
        currentTableNumber,
        guest,
        phone,
        restaurant: findRestaurant._id,
        otp: otp,
        otpExpire: Date.now() + 1000 * 60 * 5, //5 minutes
      });
      return res.status(201).json({
        success: "true",
        message: "New customer cerated successfully.",
        Data: {
          OTP: otp,
          Table_No: newCustomer.currentTableNumber,
          numberOfGuest: newCustomer.guest,
          Restaurant: findRestaurant.name,
        },
      });
    }
    if (!customerFind.isVerified) {
      const otp = generateOTP();
      customerFind.otp = otp;
      customerFind.otpExpire = Date.now() + 1000 * 60 * 5;
      customerFind.save();
      await sendOTPSMS(restaurantNumber, otp);
      return res.status(200).json({
        success: "true",
        Data: { OTP: otp },
        message: "Customer otp is send.",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: true, message: "Server Error" });
  }
});
module.exports = {
  resendOtp: resendOtp,
  deleteAccount: deleteAccount,
  OtpVerify: OtpVerify,
  Register: Register,
  login: login,
};
