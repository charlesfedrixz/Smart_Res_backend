const mongoose = require("mongoose");
const Food = require("./foodModels");
//const sendSMSNotification = require("../utils/sms")

const orderSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.ObjectId, ref: "Customers", required: true },
    // tableNumber: { type: mongoose.ObjectId, ref: "Table", required: true },
    foodItems: [
      {
        foodId: { type: mongoose.ObjectId, ref: "Food", required: true },
        quantity: { type: Number, min: 1, required: true },
        status: {
          type: String,
          required: true,
          enum: [
            "Your order is being prepared ...",
            "Your order is ready...",
            "Food Processing...",
            "Completed",
          ],
          default: "Your order is being prepared ...",
        },
      },
    ],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      required: true,
      enum: [
        "Your order is being prepared ...",
        "Your order is ready...",
        "Completed",
      ],
      default: "Your order is being prepared ...",
    },

    // createdAt: { type: Date, default: Date.now },
    isRated: { type: Boolean, default: false },
    payment_mode: {
      type: String,
      required: true,
      enum: ["Cash", "Online"],
      default: "Cash",
    },
    payment: {
      type: String,
      required: true,
      enum: ["Paid", "Unpaid"],
      default: "Unpaid",
    },
  },
  {
    timestamps: true,
  }
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
  const validStatuses = [
    "Your order is being prepared ...",
    "Your order is ready...",
    "Completed",
  ];

  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}`);
  }

  this.status = newStatus;
  await this.save();
};
// Fetch customer phone number from the database
// const customer = await mongoose.model("customer").findById(this.customerId);
// if (customer && customer.mobileNumber) {
//   const message = `Your order status has been updated to: ${newStatus}`;
//   try {
//     await sendSMSNotification(customer.mobileNumber, message);
//   } catch (error) {
//     console.error(`Failed to send SMS notification: ${error.message}`);
//   }
// }

// orderSchema.methods.updateFoodItemStatus = async function (foodId, newStatus) {
//   const validStatuses = [
//     "Food Processing",
//     "Ready for Delivery",
//     "Completed",
//     "Payment Pending",
//     "Payment Done",
//     "Food Unpaid",
//     "Food Paid",
//     "Cash Mode",
//     "Online Mode",
//   ];

//   if (!validStatuses.includes(newStatus)) {
//     throw new Error(`Invalid status: ${newStatus}`);
//   }

//   const foodItem = this.foodItems.find(
//     (item) => item.foodId.toString() === foodId
//   );
//   if (!foodItem) {
//     throw new Error(`Food item with ID ${foodId} not found in this order.`);
//   }

//   foodItem.status = newStatus;
//   await this.save();
// };
const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
