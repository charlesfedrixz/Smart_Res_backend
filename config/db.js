const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    console.log('Error details:', {
      message: error.message,
      code: error.code,
      reason: error.reason,
    });
    console.log(process.env.MONGODB_URL);
    throw error;
  }
};

module.exports = connectDB;
