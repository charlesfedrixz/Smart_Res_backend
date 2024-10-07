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
<<<<<<< HEAD
  yesterdayOrder,
=======
>>>>>>> 18d00605b33224bc145136653b11b4c19b569080
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
<<<<<<< HEAD
order.get("/yesterdayOrderList", yesterdayOrder);
order.post("/addOrder", addOrder);
=======
>>>>>>> 18d00605b33224bc145136653b11b4c19b569080

module.exports = {
  order: order,
};
