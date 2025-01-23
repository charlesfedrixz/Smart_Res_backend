const mongoose = require('mongoose');
// Create Food Schema
const foodSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true, // Tracks the user who added or manages the food item
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true, // Links food to the specific restaurant
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true, // Links food to its category
    },
    subcategory: {
      type: String,
    },
    name: {
      type: String,
      required: true, // Food name is mandatory
      trim: true, // Removes leading/trailing whitespace
    },
    description: {
      type: String,
      required: true, // Description of the food item
      trim: true,
    },
    image: {
      type: String,
      required: true, // Image URL or path
    },
    price: {
      type: Number,
      required: true, // Price is mandatory
      min: [0, 'Price cannot be negative'], // Ensures valid pricing
    },
    discountPercentage: {
      type: Number,
      default: 0,
    },
    discountPrice: {
      type: Number,
      default: 0,
    },
    taxPercentage: {
      type: Number,
      default: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    todaysSpecial: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: true, // Default availability status
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

const Food = mongoose.model('Food', foodSchema);
module.exports = Food;
