const express = require("express");
const {
  // register,
  // verifyOtp,
  resendOtp,
  deleteAccount,
  mobileRegister,
  OtpVerify,
} = require("../controller/customerController");

const customerRoutes = express.Router();
customerRoutes.post("/register", mobileRegister);
customerRoutes.post("/verify", OtpVerify);
customerRoutes.post("/resend", resendOtp);
customerRoutes.delete("/delete", deleteAccount);
customerRoutes.post("/reg", mobileRegister);
customerRoutes.post("/veri", OtpVerify);

module.exports = {
  customerRoutes: customerRoutes,
};
