const express = require("express");
const {
  register,
  verifyOtp,
  resendOtp,
  deleteAccount,
} = require("../controller/customerController");

const customerRoutes = express.Router();
customerRoutes.post("/register", register);
customerRoutes.post("/verify", verifyOtp);
customerRoutes.post("/resend", resendOtp);
customerRoutes.delete("/delete", deleteAccount);

module.exports = {
  customerRoutes: customerRoutes,
};
