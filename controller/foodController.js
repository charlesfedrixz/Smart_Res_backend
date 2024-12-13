const Food = require('../models/foodModels');
require('dotenv').config();
const asyncHandler = require('express-async-handler');
const getUserData = require('../middleware/authUser');
const Restaurant = require('../models/restaurantModel');
const Category = require('../models/categoryModels');
const cloudinary = require('cloudinary').v2;
const sharp = require('sharp');
const User = require('../models/adminModel');
const { default: mongoose, mongo } = require('mongoose');

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
//insert food
const insertFoodCloud = asyncHandler(async (req, res) => {
  try {
    if (
      req.user.role !== 'Super_Admin' &&
      req.user.role !== 'Restaurant_Admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Unauthorized role.',
      });
    }

    const { restaurant } = req.params;

    if (!mongoose.isValidObjectId(restaurant)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID',
      });
    }

    const restaurantToUploadTheFood = await Restaurant.findById(restaurant);
    if (!restaurantToUploadTheFood) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    if (req.user.role === 'Restaurant_Admin') {
      if (!restaurantToUploadTheFood._id.equals(req.user.restaurant)) {
        return res.status(404).json({
          success: false,
          message: 'Access denied Restaurant mismatch',
        });
      }
    }

    // const finduser = await User.findById(userId);
    // if (!finduser) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'User not found. Please log in again.',
    //   });
    // }

    const {
      name,
      description,
      category,
      price,
      subCategory,
      taxPercentage,
      todaysSpecial,
    } = req.body;
    const image = req.file;
    if (!name || !description || !category || !price || !image || !restaurant) {
      return res
        .status(400)
        .json({ success: false, messagae: 'Please provide all the field...' });
    }

    //convert image to webp format
    const compressedBuffer = await sharp(image.buffer)
      .resize({ width: 800, height: 800, fit: 'inside' })
      .webp({ quality: 80 })
      .toBuffer();

    // Upload image to Cloudinary
    const cloudinaryUpload = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          format: 'webp',
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      uploadStream.end(compressedBuffer);
    });

    if (!cloudinaryUpload) {
      return res
        .status(400)
        .json({ success: false, message: 'Error in uploading image.' });
    }
    //find category
    if (!mongoose.isValidObjectId(category)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid category ID' });
    }

    const findCategory = await Category.findById(category);
    if (!findCategory) {
      return res
        .status(400)
        .json({ success: false, message: 'Category not found' });
    }

    //find subcategory
    if (subCategory) {
      const subcategories = findCategory.subcategory.includes(subCategory);
      if (!subcategories) {
        return res
          .status(400)
          .json({ success: false, message: `${subCategory} not found` });
      }
    }

    // Create new food entry with the image URL from Cloudinary
    const newFood = await Food.create({
      name,
      description,
      category: findCategory._id,
      subcategory: subCategory || '',
      price,
      restaurant: restaurantToUploadTheFood._id,
      image: cloudinaryUpload.secure_url,
      user: req.user._id, // Assuming userId refers to the admin or the creator of the food item
      taxPercentage: taxPercentage || 0,
      todaysSpecial: todaysSpecial || false,
    });
    // Send success response
    return res
      .status(200)
      .json({ success: true, newFood, message: 'Food uploaded successfully' });
  } catch (error) {
    console.error('Error uploading food:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

//delete food
const deleteFood = async (req, res) => {
  try {
    if (
      req.user.role !== 'Super_Admin' &&
      req.user.role !== 'Restaurant_Admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Unauthorized role.',
      });
    }
    const { restaurantId, foodId } = req.params;
    if (
      !mongoose.isValidObjectId(restaurantId) ||
      !mongoose.isValidObjectId(foodId)
    ) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: 'Restaurant not found' });
    }

    if (req.user.role === 'Restaurant_Admin') {
      if (!restaurant._id.equals(req.user.restaurant)) {
        return res.status(404).json({
          success: false,
          message: 'Access denied Restaurant mismatch',
        });
      }
    }

    const foodToBeDeleted = await Food.findById(foodId);
    if (!foodToBeDeleted) {
      return res
        .status(404)
        .json({ success: false, message: 'Food not found' });
    }

    // image link format = https://res.cloudinary.com/dxx6zqz6y/image/upload/v1718288888/food/food_image_public_id.webp
    const publicID = foodToBeDeleted.image.split('/').pop().split('.').shift();
    if (publicID) {
      const result = await cloudinary.uploader.destroy(publicID);
      if (result.result !== 'ok') {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete image from Cloudinary',
        });
      }
      await Food.findByIdAndDelete(foodId);
      return res
        .status(200)
        .json({ success: true, message: 'Food removed successfully...' });
    }
    return res
      .status(400)
      .json({ success: false, message: 'No image found for this food item' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};
//list food
const listFood = async (req, res) => {
  try {
    const { restaurant } = req.params;

    // get all food
    if (restaurant === 'null') {
      const foods = await Food.find();
      return res.status(200).json({
        success: true,
        data: foods || [],
        message: 'Foods fetched successfully.',
      });
    }

    if (!mongoose.isValidObjectId(restaurant)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid restaurant ID' });
    }

    const findrestaurant = await Restaurant.findById(restaurant);
    if (!findrestaurant) {
      return res
        .status(400)
        .json({ success: false, message: 'Restaurant not found...' });
    }

    // * get all food of the restaurant
    const foods = await Food.find({ restaurant });

    return res.status(200).json({
      success: true,
      data: foods || [],
      message: 'Foods fetched successfully.',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};
//edit food
const editFood = async (req, res) => {
  try {
    if (
      req.user.role !== 'Super_Admin' &&
      req.user.role !== 'Restaurant_Admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Unauthorized role.',
      });
    }
    const { restaurantId, foodId } = req.params;

    if (
      !mongoose.isValidObjectId(restaurantId) ||
      !mongoose.isValidObjectId(foodId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Restaurant ID or Food ID',
      });
    }

    const {
      name,
      description,
      category,
      price,
      subCategory,
      taxPercentage,
      taxAmount,
      todaysSpecial,
      discountPrice,
      discountPercentage,
      isAvailable,
    } = req.body; // New values
    const image = req.file; // New image if uploaded

    if (!name || !description || !category || !price) {
      return res
        .status(400)
        .json({ success: false, message: 'Please provide ll fields' });
    }

    if (!mongoose.isValidObjectId(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID',
      });
    }

    // Find the food item in the database
    const food = await Food.findById(foodId);
    if (!food) {
      return res
        .status(400)
        .json({ success: false, message: 'Food item not found...' });
    }

    // Update the food item fields
    food.name = name || food.name; // Update only if a new value is provided
    food.description = description || food.description;
    food.category = category || food.category;
    food.price = price || food.price;
    food.subcategory = subCategory || food.subcategory;
    food.taxPercentage = taxPercentage || food.taxPercentage;
    food.taxAmount = taxAmount || food.taxAmount;
    food.todaysSpecial = todaysSpecial || food.todaysSpecial;
    food.discountPrice = discountPrice || food.discountPrice;
    food.discountPercentage = discountPercentage || food.discountPercentage;
    food.isAvailable = isAvailable || food.isAvailable;

    // If a new image is provided, handle the image upload
    if (image) {
      const publicId = food.image.split('/').pop().split('.').shift();
      if (publicId) {
        // Delete the old image from Cloudinary
        const result = await cloudinary.uploader.destroy(publicId);
        if (result.result !== 'ok') {
          return res.status(500).json({
            success: false,
            message: 'Failed to delete old image from Cloudinary',
          });
        }
        // Upload new image to Cloudinary
        const cloudinaryUpload = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: 'image' },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          );

          // Stream the file to Cloudinary
          if (image?.buffer) {
            uploadStream.end(image.buffer);
          } else {
            reject(new Error('Image upload failed'));
          }
        });

        // Update the food item's image URL and public ID
        food.image = cloudinaryUpload.secure_url; // Update the URL
      }
    }

    await food.save();
    return res
      .status(200)
      .json({ success: true, food, message: 'Food item updated successfully' });
  } catch (error) {
    console.error('Error updating food:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    });
  }
};

//list food by category
const getFoodByCategory = async (req, res) => {
  try {
    const defaultCategory = 'ChaBora 1902'; // Assuming the category is passed as a query parameter

    const foodItems = await Food.find({ category: defaultCategory });
    if (!foodItems || foodItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category is not fouond in the food list...',
      });
    }
    return res.status(200).json({
      success: true,
      foodItems,
      message: `${defaultCategory} category is listed...`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, messagae: 'Server Error' });
  }
};

const getFoodByCategory1 = async (req, res) => {
  try {
    // Default category
    const defaultCategory = 'RoofTop Cafe';

    // Fetch food items by the default category
    const foodItems = await Food.find({ category: defaultCategory });

    if (!foodItems || foodItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No food items found for the category: ${defaultCategory}`,
      });
    }

    return res.status(200).json({
      success: true,
      foodItems,
      message: `${defaultCategory} category food items listed successfully.`,
    });
  } catch (error) {
    console.error('Error fetching food items:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const searchFood = async (req, res) => {
  try {
    const { foodName } = req.query;

    if (!foodName) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'Provide a food name',
      });
    }

    // Create a regex pattern that matches words starting with the search term
    const exactStartPattern = new RegExp(`^${foodName}`, 'i');

    // Also create a pattern for partial matches anywhere in the name
    const partialPattern = new RegExp(foodName, 'i');

    // First try to find foods that start with the search term
    let food = await Food.find({
      name: { $regex: exactStartPattern },
    });

    // If no exact start matches, look for partial matches
    if (food.length === 0) {
      food = await Food.find({
        name: { $regex: partialPattern },
      });
    }

    // If still no matches, try fuzzy search as last resort
    if (food.length === 0) {
      const fuzzyPattern = foodName
        .split('')
        // Creates a regex pattern that matches strings containing all characters
        // For example, if searching for "cat":
        // (?=.*c)(?=.*a)(?=.*t) will match any string containing c, a, and t in any order
        // This allows for fuzzy matching where characters can be in different positions
        .map((char) => `(?=.*${char})`)
        .join('');

      food = await Food.find({
        name: { $regex: new RegExp(fuzzyPattern, 'i') },
      });
    }
    // Return the found food items for exact search
    return res.status(200).json({
      success: true,
      food: food || [],
      message: 'Food is here...',
    });
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

module.exports = {
  listFood,
  getFoodByCategory,
  getFoodByCategory1,
  searchFood,
  editFood,
  insertFoodCloud,
  deleteFood,
};
