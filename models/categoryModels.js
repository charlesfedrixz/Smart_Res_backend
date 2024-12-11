const mongoose = require("mongoose");
// Define a schema for the category
const categorySchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    unique: true,
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
  },
  subcategory: {
    type: [String],
    default: [],
  },
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
