const express = require("express");
const {
  createCategory,
  getCategory,
  removeCategory,
  updateCategory,
} = require("../controller/categoryController");

const categoryRoutes = express.Router();
categoryRoutes.post("/create", createCategory); // header token, query category
categoryRoutes.get("/list", getCategory); // header token, query category
categoryRoutes.delete("/remove/:categoryId", removeCategory); // header token, params categoryid
categoryRoutes.put("/update/:categoryId", updateCategory); // header token, params categoryid and body category

module.exports = {
  categoryRoutes: categoryRoutes,
};
