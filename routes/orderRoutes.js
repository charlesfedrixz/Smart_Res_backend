const express = require("express");
const {
  createOrder,
  deleteOrder,
  listOrders,
  tableOrder,
  deleteFood,
  updateOrderStatus,
  updateFoodItemStatus,
  customerOrderlist,
  addOrder,
  updateOrderPayment,
  adminOrderList,
  yesterdayOrder,
  customerlistOrder,
  dailyOrder,
} = require("../controller/orderController"); // Ensure correct path

const order = express.Router();
order.post("/create", createOrder);
order.post("/delete", deleteOrder);
order.get("/list", listOrders);
order.post("/tableOrder", tableOrder);
order.delete("/deleteFood/:orderId", deleteFood);
order.put("/updateStatus", updateOrderStatus);
order.post("/foodStatus", updateFoodItemStatus);
order.get("/customerlist", customerOrderlist);
order.put("/addOrder", addOrder);
order.put("/updatePayment", updateOrderPayment);
order.get("/adminOrderList", adminOrderList);
order.get("/yesterdayOrderList", yesterdayOrder);
order.post("/addOrder", addOrder);
order.post("/newlist", customerlistOrder);
order.get("/today", dailyOrder);

module.exports = {
  order: order,
};
