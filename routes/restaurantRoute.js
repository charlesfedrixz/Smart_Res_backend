const express = require('express');
const multer = require('multer');

const {
  create,
  deleted,
  edit,
  fetch,
  getRestaurantById,
  getRestaurantBySlug,
} = require('../controller/restaurantController');
const { authenticateJWTToken } = require('../middleware/authenticateJWTToken');
const restaurantRoute = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
});

// api endpoints
// create restaurant - POST /api/restaurant/create
// delete restaurant - DELETE /api/restaurant/delete/:restaurantId
// update restaurant - PUT /api/restaurant/update/:restaurantId
// get all restaurant - GET /api/restaurant/getall
// get restaurant by id - GET /api/restaurant/getById/:restaurantId

restaurantRoute.post(
  '/create',
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
  ]),
  authenticateJWTToken,
  create
);
restaurantRoute.delete('/delete/:restaurantId', authenticateJWTToken, deleted);
restaurantRoute.put(
  '/update/:restaurantId',
  authenticateJWTToken,
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
  ]),
  edit
);

restaurantRoute.get('/getall', authenticateJWTToken, fetch);
restaurantRoute.get(
  '/getById/:restaurantId',
  authenticateJWTToken,
  getRestaurantById
);

// get restaurant by slug
restaurantRoute.get('/getBySlug/:slug', getRestaurantBySlug);

module.exports = restaurantRoute;
