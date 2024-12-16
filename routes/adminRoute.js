const express = require('express');
const {
  createUser,
  login,
  requestPasswordReset,
  resetPassword,
  logout,
  verifiedEmailOTP,
  getAllAdmin,
  getPermissions,
  addPermissions,
  deletePermissions,
  updatePermissions,
  getAdmin,
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
adminRoutes.get(
  '/getPermissions/:userId',
  authenticateJWTToken,
  getPermissions
);
adminRoutes.post(
  '/addPermissions/:userId',
  authenticateJWTToken,
  addPermissions
);
adminRoutes.delete(
  '/deletePermissions/:userId',
  authenticateJWTToken,
  deletePermissions
);

adminRoutes.put(
  '/updatePermissions/:userId',
  authenticateJWTToken,
  updatePermissions
);

// GET ADMIN BY ID
adminRoutes.get('/getAdmin/:userId', authenticateJWTToken, getAdmin);

module.exports = {
  adminRoutes: adminRoutes,
};
