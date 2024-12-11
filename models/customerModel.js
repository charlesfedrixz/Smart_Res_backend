const mongoose = require("mongoose");
const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    currentTableNumber: {
      type: Number,
      required: true,
      min: [1, "Table number must be at least 1"],
      max: [100, "Table number cannot exceed 100"],
    },
    mobileNumber: {
      type: Number,
      required: true,
      unique: true,
      validate: {
        validator: function (value) {
          const regex = /^[6-9]\d{9}$/;
          return regex.test(value);
        },
      },
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    guest: {
      type: Number,
      required: true,
      default: 1,
      min: [1, "The number of guests must be at least 1 "],
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
