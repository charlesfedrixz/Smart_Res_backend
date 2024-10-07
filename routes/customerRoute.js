const express = require("express");
const {
<<<<<<< HEAD
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
=======
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
>>>>>>> 18d00605b33224bc145136653b11b4c19b569080
customerRoutes.post("/veri", OtpVerify);

module.exports = {
  customerRoutes: customerRoutes,
};
