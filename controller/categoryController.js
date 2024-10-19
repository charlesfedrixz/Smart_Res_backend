const Category = require("../models/categoryModels");
const asynchandler = require("express-async-handler");
const getUserData = require("../middleware/authUser");
const AppError = require("../middleware/errorHandler");
const sendResponse = require("../middleware/sendResponse");

//create category
const createCategory = asynchandler(async (req, res, next) => {
  try {
    const { success, message, userId } = getUserData(req.headers);
    if (!userId) {
      return next(new AppError("Token Error", 400));
    }
    if (!success) {
      const statusCode = message === "Token has expired" ? 401 : 400;
      return res.status(statusCode).json({ success: false, message });
    }
    const { category } = req.body;
    console.log(category);
    if (!category) {
      return next(new AppError("Provide a category...", 400));
    }
    const categoryFind = await Category.findOne({ category });
    if (categoryFind) {
      return sendResponse(
        res,
        false,
        400,
        "Category is already created...",
        {}
      );
    }
    const newCategory = await Category.create({ category });
    return sendResponse(res, true, 201, "Category created success", {
      newCategory,
    });
  } catch (error) {
    return next(new AppError("Server Error", 500));
  }
});

const getCategory = asynchandler(async (req, res, next) => {
  try {
    const list = await Category.find({});
    if (!list) {
      return next(new AppError("Category is not found...", 400));
    }
    return sendResponse(res, true, 200, "Listed a category with success...", {
      list,
    });
  } catch (error) {
    console.log(error);

    return next(new AppError("Server Error", 500));
  }
});
//remove category
const removeCategory = asynchandler(async (req, res, next) => {
  try {
    const { success, message, userId } = getUserData(req.headers);
    if (!success) {
      const statusCode = message === "Token has expired " ? 401 : 400;
      return res.status(statusCode).json({ success: false, message });
    }
    const { categoryId } = req.params;
    if (!categoryId) {
      return next(new AppError("Please provide category...", 400));
    }
    const item = await Category.findByIdAndDelete(categoryId);
    if (!item) {
      return next(new AppError("Category is not found...", 400));
    }
    return sendResponse(res, true, 200, "Remove a category with success...", {
      item,
      userId,
    });
  } catch (error) {
    return next(new AppError("Server Error", 500));
  }
});
//upadte category
const updateCategory = asynchandler(async (req, res, next) => {
  try {
    const { success, message, userId } = getUserData(req.headers);
    if (!success) {
      const statusCode = message === "Token has expired " ? 401 : 400;
      return res.status(statusCode).json({ success: false, message, userId });
    }
    const { categoryId } = req.params;
    const { category } = req.body;
    if (!category) {
      return next(new AppError("Please provide category...", 400));
    }
    if (!categoryId) {
      return next(new AppError("Please provide category Id...", 400));
    }
    const item = await Category.findByIdAndUpdate(
      categoryId,
      { category },
      { new: true }
    );
    if (!item) {
      return next(new AppError("Category is not found...", 400));
    }
    return sendResponse(res, true, 200, "Update a category with success...", {
      item,
    });
  } catch (error) {
    return next(new AppError("Server Error", 500));
  }
});
module.exports = {
  createCategory: createCategory,
  getCategory: getCategory,
  removeCategory: removeCategory,
  updateCategory: updateCategory,
};
