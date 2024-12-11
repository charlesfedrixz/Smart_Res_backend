const asyncHandler = require("express-async-handler");
const Restaurant = require("../models/restaurantModel");
const cloudinary = require("cloudinary").v2;
const sharp = require("sharp");

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//upload to cloudinary
const cloudinaryUpload = (imageBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        format: "webp",
        transformation: [
          { width: 800, height: 800, crop: "limit" },
          { quality: "auto" },
          { fetch_format: "auto" },
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
    uploadStream.end(imageBuffer);
  });
};

//create restaurant
const create = asyncHandler(async (req, res) => {
  try {
    const { name, slug, description, email, phone, address, taxPercentage } =
      req.body;
    if (
      !name ||
      !slug ||
      !description ||
      !email ||
      !phone ||
      !address ||
      !taxPercentage
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide a Field" });
    }

    const logo = req.files?.logo?.[0];
    const coverImage = req.files?.coverImage?.[0];
    // Ensure files are uploaded
    if (!req.files || !req.files.logo || !req.files.coverImage) {
      return res.status(400).json({
        success: false,
        message: "Logo and Cover Image are required.",
      });
    }

    const findRestaurant = await Restaurant.findOne({ name });
    if (!findRestaurant) {
      const logoBuffer = await sharp(logo.buffer)
        .resize({ width: 800, height: 800, fit: "inside" })
        .webp({ quality: 80 })
        .toBuffer();

      const logoUpload = await cloudinaryUpload(logoBuffer);

      const coverImageBuffer = await sharp(coverImage.buffer)
        .resize({ width: 800, height: 800, fit: "inside" })
        .webp({ quality: 80 })
        .toBuffer();

      const coverImageUpload = await cloudinaryUpload(coverImageBuffer);

      const newRestaurant = await Restaurant.create({
        slug,
        name,
        description,
        logo: logoUpload.secure_url,
        coverImage: coverImageUpload.secure_url,
        contact: { email, phone, address },
        settings: { taxPercentage },
      });
      return res.status(201).json({
        success: true,
        newRestaurant,
        message: `${name}Restaurant created successfully.`,
      });
    }
    return res.status(401).json({
      success: false,
      message: "Restaurant Already Created",
    });
  } catch (error) {
    console.error("Error in creating restaurant", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});

//delete restaurant
const deleted = asyncHandler(async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide a field" });
    }
    const findRestaurant = await Restaurant.findOneAndDelete({ name });
    if (!findRestaurant) {
      return res.status(401).json({
        success: false,
        message: "Restaurant not found.",
      });
    }

    const logoPublicId = findRestaurant.logo.split("/").pop().split(".")[0];
    const coverImagePublicId = findRestaurant.coverImage
      .split("/")
      .pop()
      .split(".")[0];

    await cloudinary.uploader.destroy(logoPublicId);
    await cloudinary.uploader.destroy(coverImagePublicId);

    await Restaurant.findByIdAndDelete(findRestaurant._id);
    return res.status(200).json({
      success: true,
      message: "Restaurant and associated images deleted successfully.",
    });
  } catch (error) {
    console.error("Error in deleting Restaurant", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});

//edit restaurant
const edit = asyncHandler(async (req, res) => {
  try {
    const { restaurantId } = req.params;
    if (!restaurantId) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide a restaurntId" });
    }
    // Find the restaurant first
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found.",
      });
    }
    const {
      newName,
      newEmail,
      newSlug,
      newdescription,
      newphone,
      newAddress,
      newTaxpercentage,
    } = req.body;

    const newLogo = req.files?.logo?.[0];
    const newCoverImage = req.files?.coverImage?.[0];

    if (
      !newName ||
      !newEmail ||
      !newSlug ||
      !newdescription ||
      !newphone ||
      !newAddress ||
      !newTaxpercentage
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide all field" });
    }
    const updateFields = {};
    if (newName && newName !== restaurant.name) updateFields.name = newName;
    if (newSlug && newSlug !== restaurant.slug) updateFields.slug = newSlug;
    if (newdescription && newdescription !== restaurant.description)
      updateFields.description = newdescription;
    if (newEmail && newEmail !== restaurant.email)
      updateFields.contact = { ...restaurant.contact, email: newEmail };
    if (newphone && newphone !== restaurant.phone)
      updateFields.contact = { ...restaurant.contact, phone: newphone };
    if (newAddress && newAddress !== restaurant.address)
      updateFields.contact = { ...restaurant.contact, address: newAddress };
    if (newTaxpercentage && newTaxpercentage !== restaurant.taxPercentage)
      updateFields.settings = {
        ...restaurant.settings,
        taxPercentage: newTaxpercentage,
      };
    if (newLogo) {
      // Delete old logo from Cloudinary
      if (restaurant.logo) {
        const oldLogoPublicId = restaurant.logo.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(oldLogoPublicId);
      }
      // Upload new logo
      const logoUploadResult = await cloudinaryUpload(newLogo.buffer);
      updateFields.logo = logoUploadResult.secure_url;
    }

    if (newCoverImage) {
      // Delete old cover image from Cloudinary
      if (restaurant.coverImage) {
        const oldCoverImagePublicId = restaurant.coverImage
          .split("/")
          .pop()
          .split(".")[0];
        await cloudinary.uploader.destroy(oldCoverImagePublicId);
      }
      // Upload new cover image using cloudinaryUpload
      const coverImageUploadResult = await cloudinaryUpload(
        newCoverImage.buffer
      );
      updateFields.coverImage = coverImageUploadResult.secure_url;
    }
    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      restaurantId,
      { $set: updateFields },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      updatedRestaurant,
      message: "Restaurant updated successfully",
    });
  } catch (error) {
    console.error("Error in editing Restaurant", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});

const fetch = asyncHandler(async (req, res) => {
  try {
    const list = await Restaurant.find();
    if (list.length <= 0) {
      return res
        .status(200)
        .json({ success: "true", message: "No Restaurant found" });
    }
    const restaurantNames = list.map((restaurant) => restaurant.name);
    return res.status(200).json({
      success: "true",
      restaurantNames,
      message: "Restaurant listed successfully.",
    });
  } catch (error) {
    console.error("Error in fetching restaurant", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});
module.exports = {
  create,
  deleted,
  edit,
  fetch,
};
