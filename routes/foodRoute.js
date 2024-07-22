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
// const path = require('path');
const { auth } = require("../middleware/checkAuth");

const foodRoutes = express.Router();
//image storage engine
const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    return cb(null, `${Date.now()} ${file.originalname}`);
  },
});

const upload = multer({ storage: storage });
// Route to handle food upload
foodRoutes.post("/uploadFood", upload.single("image"), uploadFood);
foodRoutes.get("/foodList", listFood);
foodRoutes.delete("/remove", removedFood);
foodRoutes.get("/search", getFoodByCategory);
foodRoutes.get("/find", searchFood);
foodRoutes.put("/edit", upload.single("image"), editFood);
module.exports = { foodRoutes: foodRoutes };
