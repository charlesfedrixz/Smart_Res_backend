const mongoose = require('mongoose');
const customerSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    name: {
      type: String,
    },
    tableId: {
      type: mongoose.Types.ObjectId,
      ref: 'Table',
      required: true,
    },
    mobileNumber: {
      type: Number,
      required: true,
      unique: true,
      validate: {
        validator: (value) => {
          // Check if value is a number
          if (typeof value !== 'number') return false;

          // Convert to string for validation
          const mobileStr = value.toString();

          // Check length is exactly 10 digits
          if (mobileStr.length !== 10) return false;

          // Check first digit is between 6-9
          if (!/^[6-9]/.test(mobileStr)) return false;

          // Check all characters are digits
          if (!/^\d+$/.test(mobileStr)) return false;

          return true;
        },
      },
    },
    numberOfGuests: {
      type: Number,
      default: 1,
      min: [1, 'The number of guests must be at least 1 '],
    },
    visitCount: {
      type: Number,
      default: 0,
    },
    otp: {
      type: String,
    },
    otpExpire: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isLoggedIn: {
      type: Boolean,
      default: false, // Default to false, set to true only when logged in
    },
  },
  { timestamps: true }
);

const customer = mongoose.model('Customers', customerSchema);

module.exports = customer;
