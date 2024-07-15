const Food = require("../models/foodModels");
const fs = require("fs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

function getUserData(headers) {
  // Split the Bearer token
  const token = headers.authorization.split(" ")[1];
  if (!token) {
    return res
      .status(400)
      .json({ success: false, message: "Token header missing", userId: null });
  }
  const verifiedToken = jwt.verify(token, process.env.JWT_SECRET);
  console.log(verifiedToken);

  if (!verifiedToken)
    return {
      success: false,
      message: "Invalid token",
      userId: null,
    };
  return {
    success: true,
    message: "Token verified successfully",
    userId: verifiedToken.id, // Assuming the token payload contains the user ID as 'id'
  };
}

const uploadFood = async (req, res) => {
  try {
    const { userId } = getUserData(req.headers);
    const { name, description, category, price } = req.body;
    console.log(userId);

    let imagePath = req.file.filename; // File path after upload
    console.log(name, description, category, price, imagePath);
    if (!userId) {
      return res
        .status(403)
        .json({ success: false, message: "User Expired Please log in again" });
    }
    if (!name || !description || !category || !price || !imagePath) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide all the field..." });
    }
    console.log("object");
    // Save food details to MongoDB
    const newFood = await Food.create({
      name: name,
      description: description,
      category: category,
      price: price,
      image: imagePath,
      userId: userId,
    });
    console.log(newFood);
    return res
      .status(201)
      .json({ success: true, newFood, message: "Food uploaded successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
//list food
const listFood = async (req, res) => {
  try {
    // const { userId } = getUserData(req.headers);
    const foods = await Food.find({});
    // if (!userId) {
    //   return res
    //     .status(403)
    //     .json({ success: false, message: "User Expired Please log in again" });
    // }
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
//remove food
const removedFood = async (req, res) => {
  try {
    // const { userId } = getUserData(req.headers);
    const { id } = req.body;
    // if (!userId) {
    //   return res
    //     .status(403)
    //     .json({ success: false, message: "User Expired Please log in again" });
    // }
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
    fs.unlink(`uploads/${food.image}`, () => {});
    await Food.findByIdAndDelete(id);
    return res
      .status(200)
      .json({ success: true, message: "Food removed successfully..." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getFoodByCategory = async (req, res) => {
  try {
    //const { userId } = getUserData(req.headers);
    const { category } = req.query; // Assuming the category is passed as a query parameter
    // if (!userId) {
    //   return res
    //     .status(403)
    //     .json({ success: false, message: "User Expired Please log in again" });
    // }
    if (!category) {
      return res.status(400).json({ msg: "Category is required" });
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
    return res
      .status(500)
      .json({ msg: `Error fetching food items by category: ${error.message}` });
  }
};

const searchFood = async (req, res) => {
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
    return res
      .status(200)
      .json({ success: true, message: "Food is here...", food });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
module.exports = {
  uploadFood: uploadFood,
  listFood: listFood,
  removedFood: removedFood,
  getFoodByCategory: getFoodByCategory,
  searchFood: searchFood,
};
