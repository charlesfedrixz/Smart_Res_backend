const mongoose = require("mongoose");
// Create Food Schema
const foodSchema = new mongoose.Schema({
  userId: { type: mongoose.ObjectId, ref: "User", required: true },
  categoryId: { type: mongoose.ObjectId, ref: "Category", required: true },
  name: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
});

const Food = mongoose.model("Food", foodSchema);
module.exports = Food;
