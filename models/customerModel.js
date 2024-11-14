const mongoose = require("mongoose");
const customerSchema = new mongoose.Schema(
  {
    currentTableNumber: {
      type: Number,
      required: true,
    },
    mobileNumber: {
      type: Number,
      required: true,
      unique: true,
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

const customer = mongoose.model("Customers", customerSchema);

module.exports = customer;
