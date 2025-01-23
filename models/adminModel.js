const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: (v) =>
          /^\S+@(gmail\.com|org\.in|gov\.in|edu\.in|example\.org)$/.test(v),
        message: (props) => `${props.value} is not a valid email address.`,
      },
    },
    password: {
      type: String,
      required: true,
      minilength: [6, 'minimum password length is 6....'],
    },

    role: {
      type: String,
      required: true,
      enum: ['Restaurant_Admin', 'Super_Admin'],
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      default: null, // Default to null for SUPER_ADMIN
    },
    permissions: {
      type: [
        {
          title: String,
          url: String,
          icon: String,
        },
      ],
      default: [],
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

const User = mongoose.model('User', userSchema);
module.exports = User;
