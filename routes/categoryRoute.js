const express = require('express');
const {
  createCategory,
  getCategory,
  removeCategory,
  updateCategory,
  createSubcategory,
  removeSubcategory,
  updateSubcategory,
  getAllSubcategories,
} = require('../controller/categoryController');
const { authenticateJWTToken } = require('../middleware/authenticateJWTToken');

const categoryRouter = express.Router();
categoryRouter.post(
  '/create/category/:restaurantId',
  authenticateJWTToken,
  createCategory
); // header token, query category

categoryRouter.post(
  '/create/subcategory/:restaurantId',
  authenticateJWTToken,
  createSubcategory
);

// * anyone can access
categoryRouter.get('/list/:restaurantId', getCategory); // header token,  params restaurantname

categoryRouter.delete(
  '/delete/category/:restaurantId/:categoryId',
  authenticateJWTToken,
  removeCategory
); // header token, params categoryid

categoryRouter.delete(
  '/delete/subcategory/:restaurantId/:categoryId/:subcategoryName',
  authenticateJWTToken,
  removeSubcategory
); // header token, params categoryid and subcategoryid
categoryRouter.put(
  '/update/category/:restaurantId/:categoryId',
  authenticateJWTToken,
  updateCategory
); // header token, body category and restaurant

categoryRouter.put(
  '/update/subcategory/:restaurantId/:categoryId/:subcategoryName',
  authenticateJWTToken,
  updateSubcategory
); // header token, body category and restaurant

// list all subcategory
categoryRouter.get('/list/:restaurantId/:categoryId', getAllSubcategories); // header token, body category and restaurant

module.exports = {
  categoryRoutes: categoryRouter,
};
