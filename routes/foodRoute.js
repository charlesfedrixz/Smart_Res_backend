const express = require('express');
const {
  listFood,
  getFoodByCategory,
  searchFood,
  editFood,
  insertFoodCloud,
  deleteFood,
  getFoodByCategory1,
  getFoodById,
  getFoodByCategoryAndSubcategory,
} = require('../controller/foodController');
const multer = require('multer');
const { authenticateJWTToken } = require('../middleware/authenticateJWTToken');

const foodRoutes = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
// Route to handle food upload

// * can be accessed by all users
foodRoutes.get('/foodList/:restaurant', listFood);

// * can be accessed by super admin or restaurant admin
foodRoutes.delete(
  '/delete/:restaurantId/:foodId',
  authenticateJWTToken,
  deleteFood
);
// foodRoutes.get('/chabora', getFoodByCategory);
// foodRoutes.get('/rooftop', getFoodByCategory1);

// * can be accessed by all users
foodRoutes.get('/find', searchFood);

// * can be uploaded by restaurant admin or super admin
foodRoutes.put(
  '/edit/:restaurantId/:foodId',
  authenticateJWTToken,
  upload.single('image'),
  editFood
);

// * can be uploaded by restaurant admin or super admin
foodRoutes.post(
  '/upload/:restaurant',
  authenticateJWTToken,
  upload.single('image'),
  insertFoodCloud
);

// * GET Food by id from restaurant
foodRoutes.get('/getFood/:restaurantId/:foodId', getFoodById);

// * GET Food by category and subcategory from restaurant
foodRoutes.get(
  '/getFood/:restaurantId/:category/:subcategory',
  getFoodByCategoryAndSubcategory
);

module.exports = { foodRoutes: foodRoutes };
