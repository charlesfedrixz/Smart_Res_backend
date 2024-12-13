const Category = require('../models/categoryModels');
const asynchandler = require('express-async-handler');
const getUserData = require('../middleware/authUser');
const Restaurant = require('../models/restaurantModel');
const User = require('../models/adminModel');
const { default: mongoose } = require('mongoose');

//create category
const createCategory = asynchandler(async (req, res) => {
  try {
    if (
      req.user.role !== 'Super_Admin' &&
      req.user.role !== 'Restaurant_Admin'
    ) {
      return res
        .status(403)
        .json({ success: false, message: 'Access denied. Unauthorized role.' });
    }
    const { restaurantId } = req.params;
    const { category } = req.body;
    if (!mongoose.isValidObjectId(restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Restaurant ID.',
      });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found.',
      });
    }

    if (req.user.role === 'Restaurant_Admin') {
      if (!restaurant._id.equals(req.user.restaurant)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Unauthorized role.',
        });
      }
    }

    const newCategory = await Category.create({
      category,
      restaurant: restaurant._id,
    });

    return res.status(201).json({
      success: true,
      newCategory,
      message: 'Category created successfully.',
    });
  } catch (error) {
    console.error('Error in createCategory:', error);
    return res.status(500).json({
      success: false,
      message:
        error.code === 11000 ? 'Category already exists' : 'Server Error',
    });
  }
});

//create subcategory
const createSubcategory = asynchandler(async (req, res) => {
  try {
    if (
      req.user.role !== 'Super_Admin' &&
      req.user.role !== 'Restaurant_Admin'
    ) {
      return res
        .status(403)
        .json({ success: false, message: 'Access denied. Unauthorized role.' });
    }
    const { restaurantId } = req.params;
    const { categoryId, subcategories } = req.body;

    if (
      !mongoose.isValidObjectId(categoryId) ||
      !mongoose.isValidObjectId(restaurantId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Category or Restaurant ID.',
      });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found.',
      });
    }

    const categoriesExisted = await Category.findById(categoryId);
    if (!categoriesExisted) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    if (req.user.role === 'Restaurant_Admin') {
      if (!categoriesExisted.restaurant.equals(req.user.restaurant)) {
        return res.status(400).json({
          success: false,
          message: 'Restaurant mismatch.',
        });
      }
    }

    // check if all the subcategories is unique
    const uniqueSubcategories = [...new Set(subcategories)];
    console.log(uniqueSubcategories, subcategories);
    if (uniqueSubcategories?.length !== subcategories?.length) {
      return res.status(400).json({
        success: false,
        message: 'Subcategories must be unique.',
      });
    }

    // check if the subcategory is already exists
    const subcategoryExists = await Category.findOne({
      subcategory: { $in: subcategories },
      restaurant: restaurant._id,
    });

    if (subcategoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Subcategory already exists.',
      });
    }

    categoriesExisted.subcategory = [
      ...categoriesExisted.subcategory,
      ...subcategories,
    ];
    await categoriesExisted.save();

    return res.status(201).json({
      success: true,
      categoriesExisted,
      message: 'Subcategory created successfully.',
    });
  } catch (error) {
    console.error('Error in createSubcategory:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

const getCategory = asynchandler(async (req, res) => {
  try {
    const { restaurantId } = req.params;
    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the restaurant ID.',
      });
    }

    if (!mongoose.isValidObjectId(restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Restaurant ID.',
      });
    }

    const findrestaurant = await Restaurant.findById(restaurantId);

    if (!findrestaurant) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant not found.',
      });
    }
    const category = await Category.find({ restaurant: findrestaurant._id });
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is not found...',
      });
    }

    return res.status(200).json({
      success: true,
      category: category || [],
      message: 'Listed categories for the restaurant successfully.',
    });
  } catch (error) {
    console.error('Error in listing Category', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});
//remove category
const removeCategory = asynchandler(async (req, res) => {
  try {
    if (
      req.user.role !== 'Super_Admin' &&
      req.user.role !== 'Restaurant_Admin'
    ) {
      return res
        .status(403)
        .json({ success: false, message: 'Access denied. Unauthorized role.' });
    }

    const { restaurantId, categoryId } = req.params;
    if (
      !mongoose.isValidObjectId(categoryId) ||
      !mongoose.isValidObjectId(restaurantId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Category or Restaurant ID.',
      });
    }

    const findrestaurant = await Restaurant.findById(restaurantId);
    if (!findrestaurant) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant not found.',
      });
    }
    // check if the category is in the restaurant
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category not found.',
      });
    }
    if (!category.restaurant.equals(findrestaurant._id)) {
      return res.status(400).json({
        success: false,
        message: 'Category not found in this restaurant.',
      });
    }

    if (req.user.role === 'Restaurant_Admin') {
      if (!category.restaurant.equals(req.user.restaurant)) {
        return res.status(400).json({
          success: false,
          message: 'Restaurant mismatch.',
        });
      }
    }

    await Category.findByIdAndDelete(categoryId);

    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully.',
    });
  } catch (error) {
    console.error('Error in removing category', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

//remove subcategory
const removeSubcategory = asynchandler(async (req, res) => {
  try {
    if (
      req.user.role !== 'Super_Admin' &&
      req.user.role !== 'Restaurant_Admin'
    ) {
      return res
        .status(403)
        .json({ success: false, message: 'Access denied. Unauthorized role.' });
    }
    const { restaurantId, categoryId, subcategoryName } = req.params;
    if (
      !mongoose.isValidObjectId(categoryId) ||
      !mongoose.isValidObjectId(restaurantId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Category or Restaurant ID.',
      });
    }

    const findrestaurant = await Restaurant.findById(restaurantId);
    if (!findrestaurant) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant not found.',
      });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category not found.',
      });
    }

    if (!category.restaurant.equals(findrestaurant._id)) {
      return res.status(400).json({
        success: false,
        message: 'Category not found in this restaurant.',
      });
    }

    if (req.user.role === 'Restaurant_Admin') {
      if (!category.restaurant.equals(req.user.restaurant)) {
        return res.status(400).json({
          success: false,
          message: 'Restaurant mismatch.',
        });
      }
    }

    category.subcategory = category.subcategory.filter(
      (sub) => sub !== subcategoryName
    );
    await category.save();

    return res.status(200).json({
      success: true,
      message: 'Subcategory deleted successfully.',
    });
  } catch (error) {
    console.error('Error in removing subcategory', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

//upadte category
const updateCategory = asynchandler(async (req, res) => {
  try {
    if (
      req.user.role !== 'Super_Admin' &&
      req.user.role !== 'Restaurant_Admin'
    ) {
      return res
        .status(403)
        .json({ success: false, message: 'Access denied. Unauthorized role.' });
    }
    const { restaurantId, categoryId } = req.params;
    const { category } = req.body;
    if (
      !mongoose.isValidObjectId(categoryId) ||
      !mongoose.isValidObjectId(restaurantId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Category or Restaurant ID.',
      });
    }

    const findRestaurant = await Restaurant.findById(restaurantId);
    if (!findRestaurant) {
      return res
        .status(400)
        .json({ success: false, message: 'Restaurant not found' });
    }

    if (req.user.role === 'Restaurant_Admin') {
      if (!findRestaurant._id.equals(req.user.restaurant)) {
        return res.status(400).json({
          success: false,
          message: 'Restaurant mismatch.',
        });
      }
    }

    const item = await Category.findOneAndUpdate(
      { _id: categoryId },
      { category, restaurant: findRestaurant._id },
      { new: true }
    );
    if (!item) {
      return res
        .status(400)
        .json({ success: false, message: 'Category is not found...' });
    }
    return res.status(200).json({
      success: true,
      item,
      message: 'Restaurant updated successfully for the category',
    });
  } catch (error) {
    console.error('Error in updating category', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

//update subcategory
const updateSubcategory = asynchandler(async (req, res) => {
  try {
    if (
      req.user.role !== 'Super_Admin' &&
      req.user.role !== 'Restaurant_Admin'
    ) {
      return res
        .status(403)
        .json({ success: false, message: 'Access denied. Unauthorized role.' });
    }
    const { restaurantId, categoryId, subcategoryName } = req.params;
    const { subcategory } = req.body;

    if (
      !mongoose.isValidObjectId(categoryId) ||
      !mongoose.isValidObjectId(restaurantId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Category or Restaurant ID.',
      });
    }

    const findRestaurant = await Restaurant.findById(restaurantId);
    if (!findRestaurant) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant not found.',
      });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category not found.',
      });
    }

    if (!category.restaurant.equals(findRestaurant._id)) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant mismatch.',
      });
    }

    if (req.user.role === 'Restaurant_Admin') {
      if (!category.restaurant.equals(req.user.restaurant)) {
        return res.status(400).json({
          success: false,
          message: 'Restaurant mismatch.',
        });
      }
    }

    category.subcategory = category.subcategory.map((sub) =>
      sub === subcategoryName ? subcategory : sub
    );
    await category.save();

    return res.status(200).json({
      success: true,
      message: 'Subcategory updated successfully.',
    });
  } catch (error) {
    console.error('Error in updating subcategory', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

//fetch single category
const getAllSubcategories = asynchandler(async (req, res) => {
  try {
    const { restaurantId, categoryId } = req.params;
    if (
      !mongoose.isValidObjectId(categoryId) ||
      !mongoose.isValidObjectId(restaurantId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Category or Restaurant ID.',
      });
    }

    const findrestaurant = await Restaurant.findById(restaurantId);
    if (!findrestaurant) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant not found.',
      });
    }

    const findcategory = await Category.findById(categoryId);
    if (!findcategory) {
      return res.status(400).json({
        success: false,
        message: 'Category not found.',
      });
    }

    if (!findcategory.restaurant.equals(findrestaurant._id)) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant mismatch.',
      });
    }

    return res.status(200).json({
      success: true,
      subcategories: findcategory.subcategory,
      message: 'Subcategories fetched successfully.',
    });
  } catch (error) {
    console.error('Error on fetching category.', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});
module.exports = {
  createCategory,
  getCategory,
  removeCategory,
  updateCategory,
  createSubcategory,
  getAllSubcategories,
  removeSubcategory,
  updateSubcategory,
};
