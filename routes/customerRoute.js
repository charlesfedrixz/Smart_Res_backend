const express = require('express');
const {
  resendOtp,
  deleteAccount,
  OtpVerify,
  Register,
  login,
  getAllCustomers,
  getCustomerById,
  logout,
} = require('../controller/customerController');
const {
  authenticateJWTTokenCustomer,
} = require('../middleware/authenticateJWTTokenCustomer');

const customerRoutes = express.Router();

// Customer registration and authentication routes
customerRoutes.post(
  '/register/restaurant/:restaurantId/table/:tableId',
  Register
);
customerRoutes.post(
  '/verify/restaurant/:restaurantId/table/:tableId',
  OtpVerify
);
customerRoutes.post(
  '/resend/restaurant/:restaurantId/table/:tableId',
  resendOtp
);
customerRoutes.delete(
  '/delete/restaurant/:restaurantId/customer/:customerId',
  deleteAccount
);
customerRoutes.post('/login/restaurant/:restaurantId/table/:tableId', login);

// get all customers
customerRoutes.get('/customers', getAllCustomers);

// get customer by id
customerRoutes.get('/customers/:customerId', getCustomerById);

// logout customer
customerRoutes.post('/logout', authenticateJWTTokenCustomer, logout);

module.exports = {
  customerRoutes: customerRoutes,
};
