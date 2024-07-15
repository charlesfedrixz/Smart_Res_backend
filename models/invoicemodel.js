const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order", // Assuming you have a Customer model
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "paid", "cancelled"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

InvoiceSchema.methods.updateStatus = async function (status) {
  console.log("status", status);
  switch (status) {
    case "pending":
      this.status = "pending";
      break;
    case "paid":
      this.status = "paid";
      break;
    default:
      this.status = "cancelled";
  }
  await this.save();
  console.log(this);
};

const Invoice = mongoose.model("Invoice", InvoiceSchema);

module.exports = { Invoice };
