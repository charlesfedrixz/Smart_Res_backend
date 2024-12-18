const asyncHandler = require('express-async-handler');
const Restaurant = require('../models/restaurantModel');
const cloudinary = require('cloudinary').v2;
const sharp = require('sharp');
const mongoose = require('mongoose');

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
    uploadStream.end(imageBuffer);
  });
};

//create restaurant
const create = asyncHandler(async (req, res) => {
  // TODO: Make the cover image optional
  const user = req.user;
  if (user.role !== 'Super_Admin') {
    return res
      .status(401)
      .json({ success: false, message: `${user.role} is not authorized` });
  }

  try {
    const { name, slug, description, email, phone, address, taxPercentage } =
      req.body;
    if (!name || !slug || !description || !email || !phone || !address) {
      return res
        .status(400)
        .json({ success: false, message: 'Please provide all the fields' });
    }

    const logo = req.files?.logo?.[0];
    const coverImage = req.files?.coverImage?.[0];
    // Ensure files are uploaded
    // *** Changed the cover image to optional
    // if (!req.files || !req.files.logo || !req.files.coverImage) {
    if (!req.files || !req.files.logo) {
      return res.status(400).json({
        success: false,
        message: 'Logo is required.',
      });
    }

    // *** Changed the name to slug
    // const findRestaurant = await Restaurant.findOne({ name });
    const findRestaurant = await Restaurant.findOne({ slug });

    // if the restaurant is not already available
    if (!findRestaurant) {
      const logoBuffer = await sharp(logo.buffer)
        .resize({ width: 800, height: 800, fit: 'inside' })
        .webp({ quality: 80 })
        .toBuffer();

      const logoUpload = await cloudinaryUpload(logoBuffer);

      let coverImageUpload = {
        secure_url: '',
        public_id: '',
      };
      if (coverImage) {
        const coverImageBuffer = await sharp(coverImage.buffer)
          .resize({ width: 800, height: 800, fit: 'inside' })
          .webp({ quality: 80 })
          .toBuffer();

        coverImageUpload = await cloudinaryUpload(coverImageBuffer);
      }

      const newRestaurant = await Restaurant.create({
        slug,
        name,
        description,
        logo: logoUpload?.secure_url,
        coverImage: coverImageUpload?.secure_url,
        contact: { email, phone, address },
        settings: {
          taxPercentage: Number.isNaN(Number(taxPercentage))
            ? 0
            : Number(taxPercentage),
        },
      });
      return res.status(201).json({
        success: true,
        newRestaurant,
        message: `${name}Restaurant created successfully.`,
      });
    }
    // if the restaurant is already exists
    return res.status(400).json({
      success: false,
      message: 'Restaurant Already Exists',
    });
  } catch (error) {
    console.error('Error in creating restaurant', error);
    return res
      .status(500)
      .json({ success: false, message: error?.message || 'Server Error' });
  }
});

//delete restaurant
const deleted = asyncHandler(async (req, res) => {
  try {
    if (req.user.role !== 'Super_Admin') {
      return res.status(401).json({
        success: false,
        message: `${req.user.role} is not authorized`,
      });
    }
    // *** Changed the name to restaurantId
    const { restaurantId } = req.params;
    // const { name } = req.body;
    // if (!name) {
    if (!restaurantId) {
      return res
        .status(400)
        .json({ success: false, message: 'Please provide a field' });
    }
    // const findRestaurant = await Restaurant.findOneAndDelete({ name });
    const findRestaurant = await Restaurant.findByIdAndDelete(restaurantId);

    // check if the restaurant is not found
    if (!findRestaurant) {
      return res.status(401).json({
        success: false,
        message: 'Restaurant not found.',
      });
    }

    let logoPublicId;
    let coverImagePublicId;

    if (findRestaurant.logo) {
      logoPublicId = findRestaurant.logo.split('/').pop().split('.')[0];
    }

    if (findRestaurant.coverImage) {
      coverImagePublicId = findRestaurant.coverImage
        .split('/')
        .pop()
        .split('.')[0];
    }

    if (logoPublicId) {
      await cloudinary.uploader.destroy(logoPublicId);
    }

    if (coverImagePublicId) {
      await cloudinary.uploader.destroy(coverImagePublicId);
    }

    // ! Please check this
    // await Restaurant.findByIdAndDelete(findRestaurant._id);
    return res.status(200).json({
      success: true,
      message: 'Restaurant and associated images deleted successfully.',
    });
  } catch (error) {
    console.error('Error in deleting Restaurant', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

//edit restaurant
const edit = asyncHandler(async (req, res) => {
  try {
    if (
      req.user.role !== 'Super_Admin' &&
      req.user.role !== 'Restaurant_Admin'
    ) {
      return res.status(401).json({
        success: false,
        message: `${req.user.role} is not authorized`,
      });
    }
    const { restaurantId } = req.params;

    if (!restaurantId) {
      return res
        .status(400)
        .json({ success: false, message: 'Please provide a restaurantId' });
    }

    if (!mongoose.isValidObjectId(restaurantId)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid restaurantId' });
    }

    if (req.user.role === 'Restaurant_Admin') {
      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant._id.equals(req.user.restaurant)) {
        return res
          .status(401)
          .json({ success: false, message: 'Unauthorized' });
      }
    }

    // Find the restaurant first
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found.',
      });
    }
    const {
      newName,
      newEmail,
      // newSlug,
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
      // !newSlug ||
      !newdescription ||
      !newphone ||
      !newAddress ||
      !newTaxpercentage
    ) {
      return res
        .status(400)
        .json({ success: false, message: 'Please provide all field' });
    }

    const updateFields = {};
    if (newName !== restaurant.name) updateFields.name = newName;
    // if (newSlug !== restaurant.slug) updateFields.slug = newSlug;
    if (newdescription !== restaurant.description)
      updateFields.description = newdescription;
    if (newEmail !== restaurant.email)
      updateFields.contact = { ...restaurant.contact, email: newEmail };
    if (newphone !== restaurant.phone)
      updateFields.contact = { ...restaurant.contact, phone: newphone };
    if (newAddress !== restaurant.address)
      updateFields.contact = { ...restaurant.contact, address: newAddress };
    if (newTaxpercentage !== restaurant.taxPercentage)
      updateFields.settings = {
        ...restaurant.settings,
        taxPercentage: newTaxpercentage,
      };

    if (newLogo) {
      // Delete old logo from Cloudinary
      if (restaurant.logo) {
        const oldLogoPublicId = restaurant.logo.split('/').pop().split('.')[0];
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

          .split('/')
          .pop()
          .split('.')[0];
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
      message: 'Restaurant updated successfully',
    });
  } catch (error) {
    console.error('Error in editing Restaurant', error);
    return res
      .status(500)
      .json({ success: false, message: error?.message || 'Server Error' });
  }
});

const fetch = asyncHandler(async (req, res) => {
  try {
    if (req.user.role !== 'Super_Admin') {
      return res.status(401).json({
        success: false,
        message: `${req.user.role} is not authorized`,
      });
    }

    const restaurants = await Restaurant.find();
    // if (restaurants.length === 0) {
    //   return res
    //     .status(200)
    //     .json({ success: 'true', message: 'No Restaurant found' });
    // }

    return res.status(200).json({
      success: 'true',
      restaurants,
      message: 'Restaurant listed successfully.',
    });
  } catch (error) {
    console.error('Error in fetching restaurant', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

const getRestaurantById = asyncHandler(async (req, res) => {
  if (req.user.role !== 'Super_Admin' && req.user.role !== 'Restaurant_Admin') {
    return res
      .status(401)
      .json({ success: false, message: `${req.user.role} is not authorized` });
  }
  const { restaurantId } = req.params;

  if (!restaurantId) {
    return res.status(400).json({
      success: false,
      message: 'Restaurant ID is required',
    });
  }

  if (!mongoose.isValidObjectId(restaurantId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid restaurant ID format',
    });
  }

  const restaurant = await Restaurant.findById(restaurantId);

  console.log(
    // biome-ignore lint/style/noUnusedTemplateLiteral: <explanation>
    `🚀 ~ file: restaurantController.js:376 ~ getRestaurantById ~ restaurant:`,
    restaurant
  );

  if (
    req.user.role === 'Restaurant_Admin' &&
    !restaurant?._id.equals(req.user.restaurant)
  ) {
    return res.status(401).json({
      success: false,
      message: 'You are not authorized to access this restaurant',
    });
  }

  return res.status(200).json({
    success: true,
    restaurant: restaurant || {},
    message: 'Restaurant fetched successfully',
  });
});

// get restaurant by slug
const getRestaurantBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  console.log(slug);
  const restaurant = await Restaurant.findOne({ slug });
  if (!restaurant) {
    res.statusCode = 404;
    throw new Error('Restaurant not found');
  }
  console.log(restaurant);
  return res.status(200).json({ success: true, restaurant });
});

module.exports = {
  create,
  deleted,
  edit,
  fetch,
  getRestaurantById,
  getRestaurantBySlug,
};
