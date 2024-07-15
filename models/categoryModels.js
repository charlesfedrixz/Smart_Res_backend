const mongoose = require("mongoose");
// Define a schema for the category
const categorySchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: [
      "Noodles",
      "Drinks",
      "Bora",
      "Singju",
      "Deserts",
      "Pizza",
      "Salads",
      "Maindishes",
      "Beverages",
      "Appetizers",
    ],
  },
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
