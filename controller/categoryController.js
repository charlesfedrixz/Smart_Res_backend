const Category = require("../models/categoryModels");
const jwt = require("jsonwebtoken");
const asynchandler = require("express-async-handler");

//create category
const createCategory = asynchandler(async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide token." });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide token... " });
    }
    const verify = jwt.verify(token, process.env.JWT_SECRET);
    if (!verify) {
      return res.status(400).json({
        success: false,
        message: "Invalid token please login again...",
      });
    }
    const { category } = req.body;
    console.log(category);
    if (!category) {
      return res
        .status(400)
        .json({ success: false, message: "Provide a category..." });
    }
    const categoryFind = await Category.findOne({ category });
    {
      if (categoryFind) {
        return res
          .status(400)
          .json({ success: false, message: "Category is already created..." });
      }
    }
    const newCategory = await Category.create({ category });
    console.log(newCategory);
    return res.status(201).json({
      success: true,
      message: "Category created success",
      data: newCategory,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});

const getCategory = asynchandler(async (req, res) => {
  try {
    const list = await Category.find({});
    if (!list) {
      return res
        .status(400)
        .json({ success: false, message: "Category is not found..." });
    }
    return res.status(200).json({
      success: true,
      list,
      message: "Listed a category with success...",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});
//remove category
const removeCategory = asynchandler(async (req, res) => {
  try {
    const { success, message, userId } = getUserData(req.headers);
    if (!success) {
      const statusCode = message === "Token has expired " ? 401 : 400;
      return res.status(statusCode).json({ success: false, message });
    }
    const { categoryId } = req.params;
    if (!categoryId) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide category..." });
    }
    const item = await Category.findByIdAndDelete(categoryId);
    if (!item) {
      return res
        .status(400)
        .json({ success: false, message: "Category is not found..." });
    }
    return res.status(200).json({
      success: true,
      item,
      userId,
      message: "Remove a category with success...",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});
//upadte category
const updateCategory = asynchandler(async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide token." });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide token... " });
    }
    const verify = jwt.verify(token, process.env.JWT_SECRET);
    if (!verify) {
      return res.status(400).json({
        success: false,
        message: "Invalid token please login again...",
      });
    }
    const { categoryId } = req.params;
    const { category } = req.body;
    if (!category) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide category..." });
    }
    if (!categoryId) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide category Id..." });
    }
    const item = await Category.findByIdAndUpdate(
      categoryId,
      { category },
      { new: true }
    );
    if (!item) {
      return res
        .status(400)
        .json({ success: false, message: "Category is not found..." });
    }
    return res.status(200).json({
      success: true,
      item,
      message: "Update a category with success...",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});
module.exports = {
  createCategory: createCategory,
  getCategory: getCategory,
  removeCategory: removeCategory,
  updateCategory: updateCategory,
};
