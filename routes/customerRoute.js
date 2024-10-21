const express = require("express");
const {
  resendOtp,
  deleteAccount,
  OtpVerify,
  Register,
} = require("../controller/customerController");

const customerRoutes = express.Router();
customerRoutes.post("/register", Register);
customerRoutes.post("/verify", OtpVerify);
customerRoutes.post("/resend", resendOtp);
customerRoutes.delete("/delete", deleteAccount);

module.exports = {
  customerRoutes: customerRoutes,
};
