const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
    },
    contact: {
      email: {
        type: String,
        required: true,
        match: [/^\S+@(gmail\.com|org\.in|gov\.in|edu\.in|example\.org)$/],
      },
      phone: {
        type: String,
        required: true,
        match: [/^[6-9]\d{9}$/, 'Phone number must be Indian number 10 digits'],
      },
      address: {
        type: String,
        required: true,
      },
    },
    settings: {
      isActive: {
        type: Boolean,
        default: true,
      },
      minimumOrderValue: {
        type: Number,
        default: 1,
        min: [1, 'minimum order must be at least 1'],
      },
      taxPercentage: {
        type: Number,
        default: 0,
        min: [0, 'Tax percentage cannot be negative'],
        max: [100, 'Tax percentage cannot exceed 100%'],
      },
    },
  },
  { timestamps: true }
);

const Restaurant = mongoose.model('Restaurant', restaurantSchema);
module.exports = Restaurant;
