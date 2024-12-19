const express = require('express');
const {
  createOrder,
  // deleteOrder,
  listOrders,
  tableOrder,
  deleteFood,
  // updateOrderStatus,
  updateFoodItemStatus,
  customerOrderlist,
  addOrder,
  updateOrderPayment,
  adminOrderList,
  yesterdayOrder,
  customerlistOrder,
  dailyOrder,
  deleteAllOrder,
} = require('../controller/orderController'); // Ensure correct path
const { authenticateJWTToken } = require('../middleware/authenticateJWTToken');
const {
  authenticateJWTTokenCustomer,
} = require('../middleware/authenticateJWTTokenCustomer');

const order = express.Router();

// Create an order (customer view)
order.post('/create', authenticateJWTTokenCustomer, createOrder);
// order.post('/delete/:restaurantId/:orderId', deleteOrder);
// Get all orders for a restaurant (admin view)
order.get('/list/restaurant/:restaurantId', authenticateJWTToken, listOrders);

// Get order details for a specific table
// View - Customer
order.post('/tableOrder', authenticateJWTTokenCustomer, tableOrder);

// Delete a food item from an order
// View - Admin
order.delete(
  '/deleteFood/restaurant/:restaurantId/order/:orderId',
  authenticateJWTToken,
  deleteFood
);

// Update status of individual food items in an order
// View - Admin
order.patch(
  '/foodStatus/restaurant/:restaurantId/order/:orderId',
  authenticateJWTToken,
  updateFoodItemStatus
);

// Get orders for customers in a restaurant (customer view)
// Different from listOrders as it shows only relevant customer data
order.get('/myOrders', authenticateJWTTokenCustomer, customerOrderlist);

order.put('/addOrder', authenticateJWTTokenCustomer, addOrder);

// Update payment mode and status for an order (admin view)
order.put(
  '/updatePayment/restaurant/:restaurantId/order/:orderId',
  authenticateJWTToken,
  updateOrderPayment
);

// delete all order of a customer
order.delete('/deleteAll', authenticateJWTToken, deleteAllOrder);

// order.get('/adminOrderList/restaurant/:restaurantId', adminOrderList);
// order.get('/yesterdayOrderList/restaurant/:restaurantId', yesterdayOrder);
// order.post(
//   '/addOrder/restaurant/:restaurantId/table/:tableId/customer/:customerId',
//   addOrder
// );
// order.get('/customerlist/restaurant/:restaurantId', customerlistOrder);
// order.get('/today/restaurant/:restaurantId', dailyOrder);

module.exports = {
  order: order,
};
