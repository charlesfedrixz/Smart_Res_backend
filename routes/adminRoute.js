const express = require("express");
const {
  createUser,
  login,
  requestPasswordReset,
  resetPassword,
  logout,
} = require("../controller/adminController");
const { auth } = require("../middleware/checkAuth");

const adminRoutes = express.Router();
adminRoutes.post("/signup", createUser);
adminRoutes.post("/login", login);
adminRoutes.post("/requestPassword", requestPasswordReset);
adminRoutes.post("/reset", resetPassword);
adminRoutes.post("/logout", logout);
module.exports = {
  adminRoutes: adminRoutes,
};
