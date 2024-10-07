const mongoose = require("mongoose");
const Food = require("./foodModels");
<<<<<<< HEAD
const { Invoice } = require("./invoicemodel");
=======
>>>>>>> 18d00605b33224bc145136653b11b4c19b569080
//const sendSMSNotification = require("../utils/sms")

const orderSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Types.ObjectId,
      ref: "Customers",
      required: true,
    },
<<<<<<< HEAD
=======
    // tableNumber: { type: mongoose.ObjectId, ref: "Table", required: true },
>>>>>>> 18d00605b33224bc145136653b11b4c19b569080
    foodItems: [
      {
        foodId: { type: mongoose.Types.ObjectId, ref: "Food", required: true },
        quantity: { type: Number, min: 1, required: true },
<<<<<<< HEAD
        isNewItem: { type: Boolean, default: false },
=======
<<<<<<< HEAD
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
=======
        // status: {
        //   type: String,
        //   required: true,
        //   enum: [
        //     "Preparing...",
        //     "Ready...",
        //     "Processing...",
        //     "Completed",
        //     "Your order is being prepared ...",
        //     "Your order is ready...",
        //     "Food Processing...",
        //     "Completed",
        //   ],
        //   default: "Preparing...",
        // },
>>>>>>> a66210d9847ab045370c8d6b6cfd4ef9f93d57a3
      },
    ],
    totalAmount: { type: Number, required: true },
    newItemsTotalAmount: { type: Number, default: 0 },
    status: {
      type: String,
      required: true,
      enum: ["Preparing...", "Ready...", "Processing...", "Completed"],
      default: "Preparing...",
    },
<<<<<<< HEAD
=======

    // createdAt: { type: Date, default: Date.now },
>>>>>>> 18d00605b33224bc145136653b11b4c19b569080
>>>>>>> a66210d9847ab045370c8d6b6cfd4ef9f93d57a3
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
<<<<<<< HEAD
    // await Invoice.updateStatus("Paid");
  } else this.payment = "Unpaid";
  // await Invoice.updateStatus("Pending");
=======
  } else this.payment = "Unpaid";
>>>>>>> 18d00605b33224bc145136653b11b4c19b569080
  await this.save();
};

orderSchema.methods.updateStatusOrder = async function (newStatus) {
<<<<<<< HEAD
  const validStatuses = ["Preparing", "Ready", "Processing", "Completed"];
=======
  const validStatuses = [
    "Preparing...",
    "Ready...",
    "Processing...",
    "Completed",
  ];
>>>>>>> 18d00605b33224bc145136653b11b4c19b569080

  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}`);
  }

  this.status = newStatus;
  await this.save();
};
<<<<<<< HEAD
//order expire after 7 days
orderSchema.index({ created: 1 }), { expireAfterSeconds: 7 * 24 * 60 * 60 };

=======
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
>>>>>>> 18d00605b33224bc145136653b11b4c19b569080
const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
