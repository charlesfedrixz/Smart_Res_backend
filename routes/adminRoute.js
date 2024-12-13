const express = require('express');
const {
  createUser,
  login,
  requestPasswordReset,
  resetPassword,
  logout,
  verifiedEmailOTP,
  getAllAdmin,
} = require('../controller/adminController');
const { authenticateJWTToken } = require('../middleware/authenticateJWTToken');

const adminRoutes = express.Router();
// create admin by Super Admin
adminRoutes.post('/signup', authenticateJWTToken, createUser);
// No need to authenticate for login
adminRoutes.post('/login', login);
// get all admin by Super Admin only
adminRoutes.get('/allAdmin', authenticateJWTToken, getAllAdmin);
// ! LETS DO LATER
adminRoutes.post(
  '/requestPassword',
  authenticateJWTToken,
  requestPasswordReset
);
// ! LETS DO LATER
adminRoutes.put('/reset', authenticateJWTToken, resetPassword);
adminRoutes.get('/logout', authenticateJWTToken, logout);
// ! LETS DO LATER
adminRoutes.post('/verifiedOtp', authenticateJWTToken, verifiedEmailOTP);
module.exports = {
  adminRoutes: adminRoutes,
};
