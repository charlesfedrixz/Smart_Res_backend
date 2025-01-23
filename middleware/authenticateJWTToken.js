const jwt = require('jsonwebtoken');
const User = require('../models/adminModel');

// * Just to check [if the user is logged in]
// - if the token is valid
// - check for user and if there is user put req.user as the user found.
async function authenticateJWTToken(req, res, next) {
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
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          status: 401,
          message: 'Unauthorized',
        });
      }
      req.user = user;

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
  authenticateJWTToken,
};
