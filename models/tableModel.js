const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    tableNumber: {
      type: Number,
      required: true,
    },
    capacity: {
      type: Number,
      min: 1,
    },
    isOccupied: {
      type: Boolean,
      default: false,
    },
    isReserved: {
      type: Boolean,
      default: false,
    },
    currentOrder: {
      type: mongoose.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    qrCode: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Maintenance'],
      default: 'Active',
    },
  },
  { timestamps: true }
);

// Compound index to ensure table numbers are unique within a restaurant
tableSchema.index({ restaurantId: 1, tableNumber: 1 }, { unique: true });

const Table = mongoose.model('Table', tableSchema);

module.exports = Table;
