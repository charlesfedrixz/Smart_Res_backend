const Table = require('../models/tableModel');
const QRCode = require('qrcode');
const mongoose = require('mongoose');
const Restaurant = require('../models/restaurantModel');
const asyncHandler = require('express-async-handler');

// Create a new table
const createTable = asyncHandler(async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { tableNumber, capacity } = req.body;

    if (!restaurantId || !tableNumber) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID and table number are required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID format',
      });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    // Generate QR code
    const qrData = `${process.env.FRONTEND_URL}/${restaurant.slug}/table/${tableNumber}`;
    let qrCode;
    try {
      qrCode = await QRCode.toDataURL(qrData);
    } catch (qrError) {
      console.error('QR code generation error:', qrError);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate QR code',
      });
    }

    const tableData = {
      restaurantId,
      tableNumber,
      qrCode,
    };

    // Only add capacity if provided
    if (capacity) {
      if (typeof capacity !== 'number' || capacity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Capacity must be a positive number',
        });
      }
      tableData.capacity = capacity;
    }

    const table = new Table(tableData);
    await table.save();

    res.status(201).json({
      success: true,
      message: 'Table created successfully',
      data: table,
    });
  } catch (error) {
    console.error('Create table error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Table number already exists for this restaurant',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create table',
    });
  }
});

// Get all tables for a restaurant
const getAllTables = asyncHandler(async (req, res) => {
  try {
    const { restaurantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID format',
      });
    }

    const tables = await Table.find({ restaurantId }).lean();

    res.status(200).json({
      success: true,
      data: tables,
    });
  } catch (error) {
    console.error('Get all tables error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tables',
    });
  }
});

// Get available tables
const getAvailableTables = asyncHandler(async (req, res) => {
  try {
    const { restaurantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID format',
      });
    }

    const tables = await Table.find({
      restaurantId,
      isOccupied: false,
      isReserved: false,
      status: 'Active',
    }).lean();

    res.status(200).json({
      success: true,
      data: tables,
    });
  } catch (error) {
    console.error('Get available tables error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available tables',
    });
  }
});

// Get table by ID
const getTableById = asyncHandler(async (req, res) => {
  try {
    const { tableId, restaurantId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(tableId) ||
      !mongoose.Types.ObjectId.isValid(restaurantId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
    }

    const table = await Table.findOne({
      _id: tableId,
      restaurantId,
    }).lean();

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found',
      });
    }

    res.status(200).json({
      success: true,
      data: table,
    });
  } catch (error) {
    console.error('Get table by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch table',
    });
  }
});

// Get table by QR code
const getTableByQR = asyncHandler(async (req, res) => {
  try {
    const { qrCode } = req.params;

    if (!qrCode) {
      return res.status(400).json({
        success: false,
        message: 'QR code is required',
      });
    }

    const decodedQR = decodeURIComponent(qrCode);

    console.log(decodedQR);

    const table = await Table.findOne({ qrCode: decodedQR }).lean();

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found',
      });
    }

    res.status(200).json({
      success: true,
      data: table,
    });
  } catch (error) {
    console.error('Get table by QR error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch table',
    });
  }
});

// Update table details
const updateTable = asyncHandler(async (req, res) => {
  try {
    const { tableId, restaurantId } = req.params;
    const updates = { ...req.body };

    if (
      !mongoose.Types.ObjectId.isValid(tableId) ||
      !mongoose.Types.ObjectId.isValid(restaurantId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
    }

    // Validate capacity if provided
    if (updates.capacity !== undefined) {
      if (typeof updates.capacity !== 'number' || updates.capacity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Capacity must be a positive number',
        });
      }
    }

    // Prevent updating certain fields directly
    updates.qrCode = undefined;
    updates.currentOrder = undefined;
    updates.restaurantId = undefined;

    const table = await Table.findOneAndUpdate(
      { _id: tableId, restaurantId },
      updates,
      { new: true, runValidators: true }
    ).lean();

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Table updated successfully',
      data: table,
    });
  } catch (error) {
    console.error('Update table error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update table',
    });
  }
});

// Update table status
const updateTableStatus = asyncHandler(async (req, res) => {
  try {
    const { tableId, restaurantId } = req.params;
    const { status } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(tableId) ||
      !mongoose.Types.ObjectId.isValid(restaurantId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
    }

    if (!status || !['Active', 'Inactive', 'Maintenance'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }

    const table = await Table.findOneAndUpdate(
      { _id: tableId, restaurantId },
      { status },
      { new: true }
    ).lean();

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Table status updated successfully',
      data: table,
    });
  } catch (error) {
    console.error('Update table status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update table status',
    });
  }
});

// Update table occupancy
const updateTableOccupancy = asyncHandler(async (req, res) => {
  try {
    const { tableId, restaurantId } = req.params;
    const { isOccupied, isReserved } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(tableId) ||
      !mongoose.Types.ObjectId.isValid(restaurantId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
    }

    if (typeof isOccupied !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isOccupied must be a boolean value',
      });
    }

    const updates = {
      isOccupied,
    };

    // Only include isReserved in updates if provided
    if (typeof isReserved === 'boolean') {
      updates.isReserved = isReserved;
    }

    const table = await Table.findOneAndUpdate(
      { _id: tableId, restaurantId },
      updates,
      { new: true }
    ).lean();

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Table occupancy updated successfully',
      data: table,
    });
  } catch (error) {
    console.error('Update table occupancy error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update table occupancy',
    });
  }
});

// Delete table
const deleteTable = asyncHandler(async (req, res) => {
  try {
    const { tableId, restaurantId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(tableId) ||
      !mongoose.Types.ObjectId.isValid(restaurantId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
    }

    const table = await Table.findOneAndDelete({
      _id: tableId,
      restaurantId,
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Table deleted successfully',
    });
  } catch (error) {
    console.error('Delete table error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete table',
    });
  }
});

// get all tables for all restaurants
const getAllTablesForAllRestaurants = asyncHandler(async (req, res) => {
  try {
    const tables = await Table.find().lean();
    res.status(200).json({ success: true, data: tables });
  } catch (error) {
    console.error('Get all tables error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tables' });
  }
});

// Get table by table number and restaurantId
const getTableByTableNumber = asyncHandler(async (req, res) => {
  const { tableNumber, restaurantId } = req.params;
  const table = await Table.findOne({ tableNumber, restaurantId }).lean();
  res.status(200).json({ success: true, data: table });
});

module.exports = {
  createTable,
  getAllTables,
  getAvailableTables,
  getTableById,
  getTableByQR,
  updateTable,
  updateTableStatus,
  updateTableOccupancy,
  deleteTable,
  getAllTablesForAllRestaurants,
  getTableByTableNumber,
};
