const express = require("express");
const multer = require("multer");
const {
  create,
  deleted,
  edit,
  fetch,
} = require("../controller/restaurantController");
const restaurantRoute = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
});

restaurantRoute.post(
  "/create",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  create
);
restaurantRoute.delete("/delete", deleted);
restaurantRoute.put(
  "/update/:restaurantId",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  edit
);
restaurantRoute.get("/list", fetch);

module.exports = restaurantRoute;
