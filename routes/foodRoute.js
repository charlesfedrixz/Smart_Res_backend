const express = require("express");
const {
  listFood,
  getFoodByCategory,
  searchFood,
  editFood,
  insertFoodCloud,
  deleteFood,
} = require("../controller/foodController");
const multer = require("multer");

const foodRoutes = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
// Route to handle food upload
foodRoutes.get("/foodList", listFood);
foodRoutes.delete("/remove", deleteFood);
foodRoutes.get("/search", getFoodByCategory);
foodRoutes.get("/find", searchFood);
foodRoutes.put("/edit", upload.single("image"), editFood);
foodRoutes.post("/upload", upload.single("image"), insertFoodCloud);
module.exports = { foodRoutes: foodRoutes };
