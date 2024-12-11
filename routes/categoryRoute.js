const express = require("express");
const {
  createCategory,
  getCategory,
  removeCategory,
  updateCategory,
  categorySingle,
} = require("../controller/categoryController");

const categoryRoutes = express.Router();
categoryRoutes.post("/create/:restaurant", createCategory); // header token, query category
categoryRoutes.get("/list/:restaurant", getCategory); // header token,  params restaurantname
categoryRoutes.delete(
  "/remove/:restaurant/:category/:subcategoryName?",
  removeCategory
); // header token, params categoryid
categoryRoutes.put("/update", updateCategory); // header token, body category and restaurant
categoryRoutes.get("/list/:restaurant/:category", categorySingle); // header token, body category and restaurant

module.exports = {
  categoryRoutes: categoryRoutes,
};
