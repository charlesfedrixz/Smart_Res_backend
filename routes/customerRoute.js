const express = require("express");
const {
<<<<<<< HEAD
=======
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
>>>>>>> a66210d9847ab045370c8d6b6cfd4ef9f93d57a3
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
<<<<<<< HEAD
=======
customerRoutes.post("/reg", mobileRegister);
>>>>>>> 18d00605b33224bc145136653b11b4c19b569080
>>>>>>> a66210d9847ab045370c8d6b6cfd4ef9f93d57a3
customerRoutes.post("/veri", OtpVerify);

module.exports = {
  customerRoutes: customerRoutes,
};
