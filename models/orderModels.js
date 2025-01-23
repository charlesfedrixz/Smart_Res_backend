const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    tableId: {
      type: mongoose.Types.ObjectId,
      ref: 'Table',
      required: true,
    },
    customerId: {
      type: mongoose.Types.ObjectId,
      ref: 'Customers',
      required: true,
    },
    foodItems: [
      {
        foodId: { type: mongoose.Types.ObjectId, ref: 'Food', required: true },
        quantity: { type: Number, min: 1, required: true },
        isNewItem: { type: Boolean, default: false },
        status: {
          type: String,
          enum: ['Pending', 'Preparing', 'Ready', 'Served'],
          default: 'Pending',
        },
      },
    ],
    totalAmount: { type: Number, required: true },
    newItemsTotalAmount: { type: Number, default: 0 },
    status: {
      type: String,
      required: true,
      enum: ['Preparing', 'Ready', 'Processing', 'Completed'],
      default: 'Processing',
    },
    isRated: { type: Boolean, default: false },
    payment: {
      type: String,
      required: true,
      enum: ['Paid', 'Unpaid'],
      default: 'Unpaid',
    },
    paymentMode: {
      type: String,
      enum: ['Cash', 'Online', 'Card'],
      default: 'Cash',
    },
  },
  { timestamps: true }
);

orderSchema.methods.calculateTotalAmount = async function () {
  await this.populate('foodItems.foodId');

  let totalAmount = 0;
  let newItemsTotal = 0;

  for (const item of this.foodItems) {
    if (!item.foodId) {
      throw new Error('Food item not found');
    }
    const itemTotal = item.foodId.price * item.quantity;
    totalAmount += itemTotal;

    if (item.isNewItem) {
      newItemsTotal += itemTotal;
    }
  }

  this.totalAmount = totalAmount;
  this.newItemsTotalAmount = newItemsTotal;
  await this.save();

  return {
    success: true,
    message: 'Total amount calculated successfully',
  };
};

orderSchema.methods.updatePaymentMode = async function (paymentMode) {
  const validModes = ['Cash', 'Online', 'Card'];

  if (!validModes.includes(paymentMode)) {
    throw new Error(`Invalid payment mode: ${paymentMode}`);
  }

  this.paymentMode = paymentMode;
  await this.save();
};

orderSchema.methods.updatePaymentStatus = async function (paid) {
  this.payment = paid ? 'Paid' : 'Unpaid';
  await this.save();
};

orderSchema.methods.updateOrderStatus = async function (newStatus) {
  const validStatuses = ['Preparing', 'Ready', 'Processing', 'Completed'];

  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid order status: ${newStatus}`);
  }

  this.status = newStatus;
  await this.save();
};

// Orders expire after 7 days from createdAt
// orderSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
