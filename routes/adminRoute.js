const express = require("express");
const {
  createUser,
  login,
  requestPasswordReset,
  resetPassword,
  logout,
  verifiedEmailOTP,
} = require("../controller/adminController");

const adminRoutes = express.Router();
adminRoutes.post("/signup", createUser);
adminRoutes.post("/login", login);
adminRoutes.post("/requestPassword", requestPasswordReset);
adminRoutes.put("/reset", resetPassword);
adminRoutes.post("/logout", logout);
adminRoutes.post("/verifiedOtp", verifiedEmailOTP);
module.exports = {
  adminRoutes: adminRoutes,
};
