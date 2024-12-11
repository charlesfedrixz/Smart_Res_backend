const Category = require("../models/categoryModels");
const asynchandler = require("express-async-handler");
const getUserData = require("../middleware/authUser");
const Restaurant = require("../models/restaurantModel");
const User = require("../models/adminModel");

//create category
const createCategory = asynchandler(async (req, res) => {
  try {
    const { success, message, userId } = getUserData(req.headers);
    if (!userId || !success) {
      const statusCode = message === "Token has expired" ? 401 : 400;
      return res
        .status(statusCode)
        .json({ success: false, message: userId ? message : "Token Error" });
    }

    // Find the user and check their role
    const findUser = await User.findById(userId);
    if (!findUser) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please log in again.",
      });
    }
    if (!["Restaurant_Admin", "Super_Admin"].includes(findUser.role)) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied. Unauthorized role." });
    }
    const { restaurant } = req.params;
    const { category, subcategory } = req.body;
    if (!category || !restaurant) {
      return res
        .status(400)
        .json({ success: false, message: "Provide a fields..." });
    }
    const findRestaurant = await Restaurant.findOne({ name: restaurant });
    if (!findRestaurant) {
      return res
        .status(400)
        .json({ success: false, message: "Restaurant not found" });
    }
    const categoryFind = await Category.findOne({ category });
    if (categoryFind) {
      if (!findUser.role === "Super_Admin") {
        if (!categoryFind.restaurant.equals(findRestaurant._id)) {
          return res
            .status(400)
            .json({ success: false, message: "Restaurant mismatch" });
        }
      }
      // Ensure `subcategories` is an array
      const processedSubcategories = Array.isArray(subcategory)
        ? subcategory.filter(
            (item) => item !== null && item !== "" && item !== undefined
          )
        : subcategory
        ? [subcategory]
        : [];

      // If category exists, update subcategories
      const updatedSubcategories = [
        ...new Set([...categoryFind.subcategory, ...processedSubcategories]), // Prevent duplicates
      ];
      categoryFind.subcategory = updatedSubcategories.filter(
        (item) => item !== null
      );
      await categoryFind.save();
      return res.status(200).json({
        success: true,
        category: categoryFind,
        message: "Subcategories updated successfully",
      });
    }
    const processedSubcategories = Array.isArray(subcategory)
      ? subcategory
      : [subcategory];

    const newCategory = await Category.create({
      category,
      subcategory: processedSubcategories,
      restaurant: findRestaurant._id,
    });
    return res.status(201).json({
      success: true,
      newCategory,
      message: "Category and subcategories created successfully",
    });
  } catch (error) {
    console.error("Error in createCategory:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});

const getCategory = asynchandler(async (req, res) => {
  try {
    const { restaurant } = req.params;
    if (!restaurant) {
      return res.status(400).json({
        success: false,
        message: "Please provide the restaurant ID.",
      });
    }
    const findrestaurant = await Restaurant.findOne({ name: restaurant });

    if (!findrestaurant) {
      return res.status(400).json({
        success: false,
        message: `${findrestaurant} not found.`,
      });
    }
    const category = await Category.find({ restaurant: findrestaurant._id });
    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is not found...",
      });
    }

    if (category.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No categories found for this restaurant.",
      });
    }
    return res.status(200).json({
      success: true,
      category,
      message: `Listed categories for the ${restaurant} successfully.`,
    });
  } catch (error) {
    console.error("Error in listing Category", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});
//remove category
const removeCategory = asynchandler(async (req, res) => {
  try {
    const { success, message, userId } = getUserData(req.headers);
    if (!userId || !success) {
      const statusCode = message === "Token has expired" ? 401 : 400;
      return res
        .status(statusCode)
        .json({ success: false, message: userId ? message : "Token Error" });
    }
    const { restaurant, category, subcategoryName } = req.params;
    if (!category || !restaurant) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide fields ..." });
    }
    const finduser = await User.findById(userId);
    if (!finduser) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }
    const findrestaurant = await Restaurant.findOne({ name: restaurant });

    if (!findrestaurant) {
      return res.status(400).json({
        success: false,
        message: `${findrestaurant} not found.`,
      });
    }
    const categories = await Category.findOne({ category });
    if (!categories) {
      return res.status(400).json({
        success: false,
        message: "category not found.",
      });
    }
    if (!["Restaurant_Admin", "Super_Admin"].includes(finduser.role)) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied. Unauthorized role." });
    }
    if (!finduser.role === "Super_Admin") {
      if (!categories.restaurant.equals(findrestaurant._id)) {
        return res
          .status(400)
          .json({ success: false, message: "Restaurant mismatch" });
      }
    }

    console.log("subcategoryName:", subcategoryName);
    if (subcategoryName) {
      const subcategoryIndex = categories.subcategory.indexOf(subcategoryName);
      if (subcategoryIndex === -1) {
        return res.status(400).json({
          success: false,
          message: "Subcategory not found in the category...",
        });
      }
      categories.subcategory.splice(subcategoryIndex, 1);
      await categories.save();
      return res.status(200).json({
        success: true,
        message: "Subcategory removed successfully.",
      });
    } else {
      await Category.findOneAndDelete({ category });
      return res.status(200).json({
        success: true,
        message: "Category deleted successfully.",
      });
    }
  } catch (error) {
    console.error("Error in removing category", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});

//upadte category
const updateCategory = asynchandler(async (req, res) => {
  try {
    const { success, message, userId } = getUserData(req.headers);
    if (!success) {
      const statusCode = message === "Token has expired " ? 401 : 400;
      return res.status(statusCode).json({ success: false, message, userId });
    }
    const { category, restaurant } = req.body;
    console.log("data:", category, restaurant);
    if (!category) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide category..." });
    }

    const findRestaurant = await Restaurant.findOne({ name: restaurant });
    console.log("find :", findRestaurant);
    if (!findRestaurant) {
      return res
        .status(400)
        .json({ success: false, message: "Restaurant not found" });
    }
    const item = await Category.findOneAndUpdate(
      { category },
      { category, restaurant: findRestaurant._id },
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
      message: "Restaurant updated successfully for the category",
    });
  } catch (error) {
    console.error("Error in updating category", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});

//fetch single category
const categorySingle = asynchandler(async (req, res) => {
  try {
    const { restaurant, category } = req.params;
    if (!restaurant || !category) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide a fields." });
    }
    const findrestaurant = await Restaurant.findOne({ name: restaurant });
    if (!findrestaurant) {
      return res
        .status(400)
        .json({ success: false, message: "Restaurant not found." });
    }
    const findcategory = await Category.findOne({ category });
    if (!findcategory) {
      return res
        .status(400)
        .json({ success: false, message: "Category not found." });
    }
    if (!findcategory.restaurant.equals(findrestaurant._id)) {
      return res
        .status(400)
        .json({ success: false, message: "Restaurant mismatch" });
    }
    return res.status(200).json({
      success: true,
      subcategories: findcategory.subcategory,
      message: "Subcategories fetched successfully.",
    });
  } catch (error) {
    console.error("Error on fetching category.", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});
module.exports = {
  createCategory: createCategory,
  getCategory: getCategory,
  removeCategory: removeCategory,
  updateCategory: updateCategory,
  categorySingle: categorySingle,
};
