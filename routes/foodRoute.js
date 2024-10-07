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
<<<<<<< HEAD
=======
//image storage engine
<<<<<<< HEAD
// const storage = multer.diskStorage({
//   destination: "uploads",
//   filename: (req, file, cb) => {
//     return cb(null, `${Date.now()} ${file.originalname}`);
//   },
// });
>>>>>>> a66210d9847ab045370c8d6b6cfd4ef9f93d57a3

const storage = multer.memoryStorage();
=======
const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    return cb(null, `${Date.now()} ${file.originalname}`);
  },
});

>>>>>>> 18d00605b33224bc145136653b11b4c19b569080
const upload = multer({ storage: storage });
// Route to handle food upload
foodRoutes.post("/uploadFood", upload.single("image"), uploadFood);
foodRoutes.get("/foodList", listFood);
foodRoutes.delete("/remove", removedFood);
foodRoutes.get("/search", getFoodByCategory);
foodRoutes.get("/find", searchFood);
foodRoutes.put("/edit/:id", upload.single("image"), editFood);
module.exports = { foodRoutes: foodRoutes };
