const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose
    .connect(process.env.MONGODB_URL)
    .then((result) => {
      console.log("Connected to MongoDB");
      // Start your server or perform other operations
    })
    .catch((error) => {
      console.error("Error connecting to MongoDB:", error);
    });
};
module.exports = connectDB;
