const express = require("express");
const {
  listFood,
  getFoodByCategory,
  searchFood,
  editFood,
  insertFoodCloud,
  deleteFood,
  getFoodByCategory1,
} = require("../controller/foodController");
const multer = require("multer");

const foodRoutes = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
// Route to handle food upload
foodRoutes.get("/foodList/:restaurant", listFood);
foodRoutes.delete("/remove", deleteFood);
foodRoutes.get("/chabora", getFoodByCategory);
foodRoutes.get("/rooftop", getFoodByCategory1);
foodRoutes.get("/find", searchFood);
foodRoutes.put("/edit/:id", upload.single("image"), editFood);
foodRoutes.post("/upload/:restaurant", upload.single("image"), insertFoodCloud);
module.exports = { foodRoutes: foodRoutes };
