const Food = require("../models/foodModels");
require("dotenv").config();
const asyncHandler = require("express-async-handler");
const getUserData = require("../middleware/authUser");
const cloudinary = require("cloudinary").v2;
const sendResponse = require("../middleware/sendResponse");
const AppError = require("../middleware/errorHandler");

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
//insert food
const insertFoodCloud = asyncHandler(async (req, res, next) => {
  try {
    const { userId } = getUserData(req.headers);
    if (!userId) {
      return next(new AppError("User Expired Please log in again", 400));
    }
    const { name, description, category, price } = req.body;
    const image = req.file;

    if (!name || !description || !category || !price || !image) {
      return next(new AppError("Please provide all the field...", 400));
    }
    // Upload image to Cloudinary
    const cloudinaryUpload = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: "image" },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      // Stream the file to Cloudinary
      if (image && image.buffer) {
        uploadStream.end(image.buffer);
      } else {
        reject(new Error("Image upload failed"));
      }
    });

    if (!cloudinaryUpload) {
      return next(new AppError("Error in uploading image.", 400));
    }

    // Create new food entry with the image URL from Cloudinary
    const newFood = await Food.create({
      name,
      description,
      category,
      price,
      image: cloudinaryUpload.secure_url,
      publicId: cloudinaryUpload.public_id, // Use the secure URL from Cloudinary
      userId, // Assuming userId refers to the admin or the creator of the food item
    });
    // Send success response
    return sendResponse(res, true, 200, "Food uploaded successfully", {
      newFood,
    });
  } catch (error) {
    console.error("Error uploading food:", error);
    return next(new AppError("Server Error", 500));
  }
});
//delete food
const deleteFood = async (req, res, next) => {
  try {
    const { userId, success, message } = getUserData(req.headers);
    const { id } = req.body;
    if (!userId) {
      return next(new AppError("User Expired Please log in again", 403));
    }
    if (!success) {
      const statusCode = message === "Token has expired " ? 401 : 400;
      return res.status(statusCode).json({ success: false, message });
    }
    if (!id) {
      return next(new AppError("Please provide Food_id...", 400));
    }
    const food = await Food.findById(id);
    if (!food) {
      return next(new AppError("Food is not found...", 400));
    }
    const publicID = food.publicId;
    if (publicID) {
      const result = await cloudinary.uploader.destroy(publicID);
      if (result.result !== "ok") {
        return next(
          new AppError("Failed to delete image from Cloudinary", 500)
        );
      }
      await Food.findByIdAndDelete(id);
      return sendResponse(res, true, 200, "Food removed successfully...");
    } else {
      return next(new AppError("No image found for this food item", 400));
    }
  } catch (error) {
    console.log(error);
    return next(new AppError("Server Error", 500));
  }
};
//list food
const listFood = async (req, res, next) => {
  try {
    const foods = await Food.find({}).populate("userId", "email");
    if (!foods) {
      return next(new AppError("Food is not found...", 400));
    }
    return res.status(200).json({
      success: true,
      Data: foods,
      message: "food listed successfully",
    });
  } catch (error) {
    console.log(error);
    return next(new AppError("Server Error", 500));
  }
};
//edit food
const editFood = async (req, res, next) => {
  try {
    const { userId, success, message } = getUserData(req.headers);
    const { id } = req.params;
    const { name, description, category, price, publicId } = req.body; // New values
    const image = req.file; // New image if uploaded

    // Check if user is authenticated
    if (!userId) {
      return next(new AppError("Token Error. Please log in again.", 403));
    }

    // Check for token success
    if (!success) {
      const statusCode = message === "Token has expired" ? 401 : 400;
      return res.status(statusCode).json({ success: false, message });
    }

    // Check if food ID is provided
    if (!id) {
      return next(new AppError("Please provide Food ID...", 400));
    }
    if (!name || !description || !category || !price || !publicId) {
      return next(new AppError("Please provide ll fields", 400));
    }

    // Find the food item in the database
    const food = await Food.findById(id);
    if (!food) {
      return next(new AppError("Food item not found...", 400));
    }

    // Update the food item fields
    food.name = name || food.name; // Update only if a new value is provided
    food.description = description || food.description;
    food.category = category || food.category;
    food.price = price || food.price;

    // If a new image is provided, handle the image upload
    if (image) {
      if (publicId) {
        // Delete the old image from Cloudinary
        const result = await cloudinary.uploader.destroy(publicId);
        if (result.result !== "ok") {
          return next(
            new AppError("Failed to delete old image from Cloudinary", 500)
          );
        }
        // Upload new image to Cloudinary
        const cloudinaryUpload = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: "image" },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          );

          // Stream the file to Cloudinary
          if (image && image.buffer) {
            uploadStream.end(image.buffer);
          } else {
            reject(new Error("Image upload failed"));
          }
        });

        // Update the food item's image URL and public ID
        food.image = cloudinaryUpload.secure_url; // Update the URL
        food.publicId = cloudinaryUpload.public_id; // Store the new public ID
      }
    } else {
      food.publicId = food.publicId; // This line ensures publicId isn't undefined
    }
    await food.save();
    return sendResponse(res, true, 200, "Food item updated successfully", {
      food,
    });
  } catch (error) {
    console.error("Error updating food:", error);
    return next(new AppError("Server error. Please try again later.", 500));
  }
};

//list food by category
const getFoodByCategory = async (req, res, next) => {
  try {
    const { category } = req.query; // Assuming the category is passed as a query parameter
    if (!category) {
      return next(new AppError("Category is required", 400));
    }
    const foodItems = await Food.find({ userId: userId, category: category });
    if (!foodItems || foodItems.length === 0) {
      return next(
        new AppError("Category is not fouond in the food list...", 404)
      );
    }
    return sendResponse(res, true, 200, `${category} category is listed...`, {
      foodItems,
    });
  } catch (error) {
    return next(new AppError("Server error. Please try again later.", 500));
  }
};
//search food
const searchFood = async (req, res, next) => {
  try {
    const { foodName } = req.query;
    const food = await Food.find({ name: { $regex: foodName, $options: "i" } });
    if (!foodName) {
      return res
        .status(200)
        .json({ success: true, message: "Provide a food name", food });
    }
    if (!food || food.length === 0) {
      return res
        .status(200)
        .json({ success: true, message: "Food is not found", food: [] });
    }
    return sendResponse(res, true, 200, "Food is here...", { food });
  } catch (error) {
    return next(new AppError("Server error. Please try again later.", 500));
  }
};

module.exports = {
  listFood,
  getFoodByCategory,
  searchFood,
  editFood,
  insertFoodCloud,
  deleteFood,
};
