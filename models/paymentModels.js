const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
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
      enum: ["created", "completed", "failed"],
      default: "created",
    },
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", PaymentSchema);

module.exports = Payment;
