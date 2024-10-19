const Food = require("../models/foodModels");
require("dotenv").config();
const asyncHandler = require("express-async-handler");
const getUserData = require("../middleware/authUser");
const cloudinary = require("cloudinary").v2;

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
//insert food
const insertFoodCloud = asyncHandler(async (req, res) => {
  try {
    const { userId } = getUserData(req.headers);
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User Expired Please log in again" });
    }
    const { name, description, category, price } = req.body;
    const image = req.file;

    if (!name || !description || !category || !price || !image) {
      return res
        .status(400)
        .json({ success: false, messagae: "Please provide all the field..." });
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
      return res
        .status(400)
        .json({ success: false, message: "Error in uploading image." });
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
    return res
      .status(200)
      .json({ success: true, newFood, message: "Food uploaded successfully" });
  } catch (error) {
    console.error("Error uploading food:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});
//delete food
const deleteFood = async (req, res) => {
  try {
    const { userId, success, message } = getUserData(req.headers);
    const { id } = req.body;
    if (!userId) {
      return res
        .status(403)
        .json({ success: false, message: "User Expired Please log in again" });
    }
    if (!success) {
      const statusCode = message === "Token has expired " ? 401 : 400;
      return res.status(statusCode).json({ success: false, message });
    }
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide Food_id..." });
    }
    const food = await Food.findById(id);
    if (!food) {
      return res
        .status(400)
        .json({ success: false, message: "Food is not found..." });
    }
    const publicID = food.publicId;
    if (publicID) {
      const result = await cloudinary.uploader.destroy(publicID);
      if (result.result !== "ok") {
        return res.status(500).json({
          success: false,
          message: "Failed to delete image from Cloudinary",
        });
      }
      await Food.findByIdAndDelete(id);
      return res
        .status(200)
        .json({ success: true, message: "Food removed successfully..." });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "No image found for this food item" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
//list food
const listFood = async (req, res) => {
  try {
    const foods = await Food.find({}).populate("userId", "email");
    if (!foods) {
      return res
        .status(400)
        .json({ success: false, message: "Food is not found..." });
    }
    return res.status(200).json({
      success: true,
      Data: foods,
      message: "food listed successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
//edit food
const editFood = async (req, res) => {
  try {
    const { userId, success, message } = getUserData(req.headers);
    const { id } = req.params;
    const { name, description, category, price, publicId } = req.body; // New values
    const image = req.file; // New image if uploaded

    // Check if user is authenticated
    if (!userId) {
      return res
        .status(403)
        .json({ success: false, message: "Token Error. Please log in again." });
    }

    // Check for token success
    if (!success) {
      const statusCode = message === "Token has expired" ? 401 : 400;
      return res.status(statusCode).json({ success: false, message });
    }

    // Check if food ID is provided
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide Food ID..." });
    }
    if (!name || !description || !category || !price || !publicId) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide ll fields" });
    }

    // Find the food item in the database
    const food = await Food.findById(id);
    if (!food) {
      return res
        .status(400)
        .json({ success: false, message: "Food item not found..." });
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
          return res.status(500).json({
            success: false,
            message: "Failed to delete old image from Cloudinary",
          });
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
    return res
      .status(200)
      .json({ success: true, food, message: "Food item updated successfully" });
  } catch (error) {
    console.error("Error updating food:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

//list food by category
const getFoodByCategory = async (req, res) => {
  try {
    const { category } = req.query; // Assuming the category is passed as a query parameter
    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }
    const foodItems = await Food.find({ userId: userId, category: category });
    if (!foodItems || foodItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Category is not fouond in the food list...",
      });
    }
    return res.status(200).json({
      success: true,
      foodItems,
      message: `${category} category is listed...`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, messagae: "Server Error" });
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
        .json({ success: true, food, messagae: "Provide a food name" });
    }
    if (!food || food.length === 0) {
      return res
        .status(200)
        .json({ success: true, food, messagae: "Food is not found" });
    }
    return res
      .status(200)
      .json({ success: true, food, messagae: "Food is here..." });
  } catch (error) {
    return res.status(500).json({ success: false, messagae: "Server Error" });
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
