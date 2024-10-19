const mongoose = require("mongoose");
const Food = require("./foodModels");
const orderSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Types.ObjectId,
      ref: "Customers",
      required: true,
    },
    foodItems: [
      {
        foodId: { type: mongoose.Types.ObjectId, ref: "Food", required: true },
        quantity: { type: Number, min: 1, required: true },
        isNewItem: { type: Boolean, default: false },
      },
    ],
    totalAmount: { type: Number, required: true },
    newItemsTotalAmount: { type: Number, default: 0 },
    status: {
      type: String,
      required: true,
      enum: ["Preparing", "Ready", "Processing", "Completed"],
      default: "Processing",
    },

    isRated: { type: Boolean, default: false },
    payment: {
      type: String,
      required: true,
      enum: ["Paid", "Unpaid"],
      default: "Unpaid",
    },
  },
  { timestamps: true }
);

orderSchema.methods.calculateTotalAmount = async function () {
  await this.populate("foodItems.foodId");

  let totalAmount = 0;

  for (const item of this.foodItems) {
    const food = await Food.findById(item.foodId);
    if (!food) {
      return {
        success: false,
        message: `Food item with ID ${item.foodId} not found.`,
      };
    }
    totalAmount += food.price * item.quantity;
  }
  this.totalAmount = totalAmount;
  return {
    success: true,
    message: `Order placed successfully`,
  };
};

orderSchema.methods.updatePaymentMode = async function (payment_mode) {
  switch (payment_mode) {
    case "Cash":
      this.payment_mode = "Cash";
      break;
    case "Online":
      this.payment_mode = "Online";
      break;
    default:
      this.payment_mode = "Cash";
  }
  await this.save();
};
orderSchema.methods.updateStatusPayment = async function (paid) {
  if (paid) {
    this.payment = "Paid";
  } else this.payment = "Unpaid";
  await this.save();
};

orderSchema.methods.updateStatusOrder = async function (newStatus) {
  const validStatuses = ["Preparing", "Ready", "Processing", "Completed"];

  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}`);
  }

  this.status = newStatus;
  await this.save();
};
//order expire after 7 days
orderSchema.index({ created: 1 }), { expireAfterSeconds: 7 * 24 * 60 * 60 };

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
