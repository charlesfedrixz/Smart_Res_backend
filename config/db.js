const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose
    .connect(
      "mongodb+srv://chand_10:1Qaz_wsx@cluster0.7xsryzu.mongodb.net/table"
    )
    .then((result) => {
      console.log("Connected to MongoDB");
      // Start your server or perform other operations
    })
    .catch((error) => {
      console.error("Error connecting to MongoDB:", error);
    });
};
module.exports = connectDB;
