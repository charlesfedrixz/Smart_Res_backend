const mongoose = require("mongoose");

<<<<<<< HEAD
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
=======
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
>>>>>>> 18d00605b33224bc145136653b11b4c19b569080

InvoiceSchema.methods.updateStatus = async function (status) {
  console.log("status", status);
  switch (status) {
<<<<<<< HEAD
    case "Pending":
      this.status = "Pending";
      break;
    case "Paid":
      this.status = "Paid";
      break;
    default:
      this.status = "Cancelled";
=======
    case "pending":
      this.status = "pending";
      break;
    case "paid":
      this.status = "paid";
      break;
    default:
      this.status = "cancelled";
>>>>>>> 18d00605b33224bc145136653b11b4c19b569080
  }
  await this.save();
  console.log(this);
};

<<<<<<< HEAD
const Invoice =
  mongoose.models.Invoice || mongoose.model("Invoice", InvoiceSchema);

module.exports = Invoice;
=======
<<<<<<< HEAD
const Invoice =
  mongoose.models.Invoice || mongoose.model("Invoice", InvoiceSchema);

module.exports = Invoice;
=======
const Invoice = mongoose.model("Invoice", InvoiceSchema);

module.exports = { Invoice };
>>>>>>> 18d00605b33224bc145136653b11b4c19b569080
>>>>>>> a66210d9847ab045370c8d6b6cfd4ef9f93d57a3
