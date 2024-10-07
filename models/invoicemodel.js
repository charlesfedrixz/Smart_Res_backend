const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema(
  {
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
      enum: ["Pending", "Paid", "Cancelled"],
      default: "Cancelled",
    },
  },
  {
    timestamps: true,
  }
);

InvoiceSchema.methods.updateStatus = async function (status) {
  console.log("status", status);
  switch (status) {
    case "Pending":
      this.status = "Pending";
      break;
    case "Paid":
      this.status = "Paid";
      break;
    default:
      this.status = "Cancelled";
  }
  await this.save();
  console.log(this);
};

const Invoice =
  mongoose.models.Invoice || mongoose.model("Invoice", InvoiceSchema);

module.exports = Invoice;
