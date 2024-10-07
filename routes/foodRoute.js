const express = require("express");
const {
  uploadFood,
  listFood,
  removedFood,
  getFoodByCategory,
  searchFood,
  editFood,
} = require("../controller/foodController");
const multer = require("multer");
const { auth } = require("../middleware/checkAuth");

const foodRoutes = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
// Route to handle food upload
foodRoutes.post("/uploadFood", upload.single("image"), uploadFood);
foodRoutes.get("/foodList", listFood);
foodRoutes.delete("/remove", removedFood);
foodRoutes.get("/search", getFoodByCategory);
foodRoutes.get("/find", searchFood);
foodRoutes.put("/edit/:id", upload.single("image"), editFood);
module.exports = { foodRoutes: foodRoutes };
