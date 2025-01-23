const jwt = require('jsonwebtoken');
const Customer = require('../models/customerModel');
const Restaurant = require('../models/restaurantModel');
const Table = require('../models/tableModel');

async function authenticateJWTTokenCustomer(req, res, next) {
  try {
    // Check if JWT exists in cookies
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: 'No token found in cookies',
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Verify customer exists
      const customer = await Customer.findById(decoded.customerId);
      if (!customer) {
        return res.status(401).json({
          success: false,
          status: 401,
          message: 'Unauthorized',
        });
      }

      const restaurant = await Restaurant.findById(decoded.restaurantId);
      if (!restaurant) {
        return res.status(401).json({
          success: false,
          status: 401,
          message: 'Unauthorized',
        });
      }

      const table = await Table.findById(decoded.tableId);
      if (!table) {
        return res.status(401).json({
          success: false,
          status: 401,
          message: 'Unauthorized',
        });
      }

      // Add decoded data to request
      req.user = {
        customerId: decoded.customerId,
        restaurantId: decoded.restaurantId,
        tableId: decoded.tableId,
      };

      next();
    } catch (err) {
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          status: 401,
          message: 'Invalid token',
        });
      }
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          status: 401,
          message: 'Token has expired',
        });
      }
      throw err;
    }
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({
      success: false,
      status: 500,
      message: 'Internal server error',
    });
  }
}

module.exports = {
  authenticateJWTTokenCustomer,
};
