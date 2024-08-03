const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: (props) => `${props.value} is not a valid email address.`,
      },
    },
    password: {
      type: String,
      required: true,
      minilength: [6, "minimum password length is 6...."],
    },
    otp: {
      type: String,
      default: null,
    },

    otpExpire: {
      type: Date,
    },
    isOTPVerified: {
      type: Boolean,
      default: false,
    },
    isResetPasswordVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
