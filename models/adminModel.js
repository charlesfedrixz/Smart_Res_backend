const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: {
      validator: function (v) {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: (props) => `${props.value} is not a valid email address.`,
    },
  },
  password: {
    type: String,
    required: true,
    minilength: [6, "minimum password length is 6...."],
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: { type: Date },
  jwt: { type: String },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
