const express = require('express');
const { authenticateJWTToken } = require('../middleware/authenticateJWTToken');
const {
  createTable,
  getAllTables,
  getTableById,
  updateTable,
  deleteTable,
  getTableByQR,
  updateTableStatus,
  updateTableOccupancy,
  getAvailableTables,
  getAllTablesForAllRestaurants,
  getTableByTableNumber,
} = require('../controller/tableController');

const tableRouter = express.Router();

// Create a new table (Super_Admin and Restaurant_Admin only)
tableRouter.post('/:restaurantId/table', authenticateJWTToken, createTable);

// Get all tables for a restaurant
tableRouter.get('/:restaurantId/tables', authenticateJWTToken, getAllTables);

// Get available tables for a restaurant
tableRouter.get('/:restaurantSlug/available-tables', getAvailableTables);

// Get specific table by ID
tableRouter.get(
  '/:restaurantId/table/:tableId',
  authenticateJWTToken,
  getTableById
);

// Get table by QR code
// The QR code URL will be in format data:image/png;base64,...
// In Postman, you need to URL encode the QR code string first
// Example: data%3Aimage%2Fpng%3Bbase64%2CiVBORw0...
tableRouter.get('/table/qr/:qrCode', getTableByQR);

// Update table details
tableRouter.put(
  '/:restaurantId/table/:tableId',
  authenticateJWTToken,
  updateTable
);

// Update table status (Active/Inactive/Maintenance)
tableRouter.patch(
  '/:restaurantId/table/:tableId/status',
  authenticateJWTToken,
  updateTableStatus
);

// Update table occupancy (isOccupied/isReserved)
tableRouter.patch(
  '/:restaurantId/table/:tableId/occupancy',
  authenticateJWTToken,
  updateTableOccupancy
);

// Delete a table
tableRouter.delete(
  '/:restaurantId/table/:tableId',
  authenticateJWTToken,
  deleteTable
);

// Get table by table number and restaurantId
tableRouter.get(
  '/table/number/:tableNumber/restaurant/:restaurantId',
  getTableByTableNumber
);

// get all tables for all restaurants
tableRouter.get('/tables', authenticateJWTToken, getAllTablesForAllRestaurants);

module.exports = tableRouter;
