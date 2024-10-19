const mongoose = require("mongoose");
const Order = require("../models/orderModels"); // Adjust the path as necessary
const jwt = require("jsonwebtoken");
const Food = require("../models/foodModels");
const sendResponse = require("../middleware/sendResponse");
const AppError = require("../middleware/errorHandler");

function getUserData(headers) {
  const authHeader = headers?.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error(
      "Authorization header is missing or does not contain Bearer token"
    );
    return { customerId: null };
  }
  const token = authHeader?.split(" ")[1];
  if (!token) {
    return { customerId: null };
  }
  try {
    const verifiedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!verifiedToken || !verifiedToken.user)
      return {
        customerId: null,
      };
    return {
      customerId: verifiedToken.user.id,
    };
  } catch (error) {
    console.error("JWT verification error:", error.message);
    return { customerId: null }; // Invalid or malformed token
  }
}

function getAdminData(headers) {
  // Split the Bearer token
  const token = headers.authorization.split(" ")[1];
  if (!token) {
    return res
      .status(400)
      .json({ success: false, message: "Token header missing", userId: null });
  }
  // console.log(token);
  const verifiedToken = jwt.verify(token, process.env.JWT_SECRET);
  // console.log(verifiedToken);

  if (!verifiedToken)
    return {
      success: false,
      message: "Invalid token",
      userId: null,
    };
  return {
    success: true,
    message: "Token verified successfully",
    userId: verifiedToken.id, // Assuming the token payload contains the user ID as 'id'
  };
}

const createOrder = async (req, res, next) => {
  try {
    const { foodItems } = req.body;
    const userData = getUserData(req.headers);
    if (!userData?.customerId) {
      return next(new AppError("User Expired Please log in again", 403));
    }
    if (!foodItems) {
      return next(new AppError("No food ordered...", 400));
    }
    const order = new Order({
      customerId: userData?.customerId,
      foodItems: foodItems.map((item) => ({
        foodId: new mongoose.Types.ObjectId(item.id),
        quantity: item.quantity,
      })),
    });
    // Calculate the total amount
    const response = await order.calculateTotalAmount();
    if (!response.success) {
      return next(new AppError(response.message, 400));
    }
    await order.save();
    console.log(order);
    return sendResponse(res, true, 200, "Order created successfully", {
      order,
    });
  } catch (error) {
    return next(new AppError("Error creating order", 500));
  }
};

const deleteOrder = async (req, res, next) => {
  const { orderId } = req.body;
  if (orderId) return next(new AppError("Please order ID", 400));
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return next(new AppError("Invalid order ID.", 400));
  }
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(200)
        .json({ success: true, message: "Order not found." });
    }
    await Order.deleteOne({ _id: orderId });
    return sendResponse(res, true, 200, "Order deleted successfully.");
  } catch (error) {
    return next(new AppError("Error deleting order", 500));
  }
};

const deleteFood = async (req, res, next) => {
  const { orderId } = req.params;
  const { foodId } = req.body;

  if (
    !mongoose.Types.ObjectId.isValid(orderId) ||
    !mongoose.Types.ObjectId.isValid(foodId)
  ) {
    return next(new AppError("Invalid order ID or food ID.", 400));
  }
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return next(new AppError("Order not found.", 404));
    }
    // Find the index of the food item in the foodItems array
    const foodIndex = order.foodItems.findIndex(
      (item) => item.foodId.toString() === foodId
    );
    if (foodIndex === -1) {
      return next(new AppError("Food not found in order.", 404));
    }
    order.foodItems.splice(foodIndex, 1);
    await order.save();
    return sendResponse(res, true, 200, "Food deleted successfully.", {
      order,
    });
  } catch (error) {
    return next(new AppError("Error deleting food", 500));
  }
};

const tableOrder = async (req, res, next) => {
  const { orderId } = req.body;
  if (orderId) return next(new AppError("Please provide OrderId", 400));

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return next(new AppError("Invalid  ID.", 400));
  }
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return next(new AppError("Order not found in the table.", 404));
    }
    return sendResponse(res, true, 200, "table order listed successfully.", {
      order,
    });
  } catch (error) {
    return next(new AppError("Error list table order", 500));
  }
};

//admin order list
const adminOrderList = async (req, res, next) => {
  try {
    const { userId } = getAdminData(req.headers);
    if (!userId) {
      return next(new AppError("Please provide token", 400));
    }
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const orderList = await Order.find({
      createdAt: {
        $gte: startOfToday,
        $lt: endOfToday,
      },
    })
      .sort({ createdAt: -1 })
      .exec()
      .populate("customerId")
      .populate("foodItems.foodId");
    return sendResponse(res, true, 200, "Customer Order listed with success ", {
      orderList,
    });
  } catch (error) {
    return next(new AppError("Server Error", 500));
  }
};
const listOrders = async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const orders = await Order.find({
      createdAt: {
        $gte: startOfToday,
        $lt: endOfToday,
      },
    })
      .sort({ createdAt: -1 })
      .populate("customerId")
      .populate("foodItems.foodId")
      .exec();
    if (orders?.length === 0) {
      return res
        .status(200)
        .json({ success: true, message: "No orders found." });
    }
    return sendResponse(res, true, 200, "Order listed successfully", {
      orders,
    });
  } catch (error) {
    return next(new AppError("Error fetching orders", 500));
  }
};
//
const customerOrderlist = async (req, res, next) => {
  try {
    const { customerId } = getUserData(req.headers);
    if (!customerId)
      return next(new AppError("User Expired Please log in again", 403));
    const orders = await Order.find({ customerId })
      .populate("foodItems.foodId")
      .exec();
    if (!orders.length) {
      return res
        .status(200)
        .json({ success: true, message: "No orders found." });
    }
    const ordersWithFoodDetails = orders.map((order) => {
      const allFooditems = order.foodItems.map((item) => ({
        food: item.foodId ? item.foodId : "Food not found",
        quantity: item.quantity,
      }));
      const newFooditems = order.foodItems
        .filter((item) => item.isNewItem && item.foodId)
        .map((item) => ({
          food: item.foodId,
          quantity: item.quantity,
        }));
      console.log("Add order: ", newFooditems);
      console.log("Old order: ", allFooditems);
      return {
        _id: order._id,
        customerId: order.customerId,
        orderDate: order.orderDate,
        orderStatus: order.status,
        orderTotal: order.totalAmount,
        orderPaymentMode: order.payment_mode,
        orderPayment: order.payment,
        allFooditems: allFooditems,
        newFooditems: newFooditems,

        foodItems: order.foodItems.map((item) => ({
          food: item.foodId, // This now includes the full food document
          quantity: item.quantity,
        })),
      };
    });
    return sendResponse(res, true, 200, "Customer order listed successfully", {
      orders: ordersWithFoodDetails,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return next(new AppError("Error fetching orders", 500));
  }
};

const updateOrderBySocket = async (orderId, newStatus, socket) => {
  try {
    const order = await Order.findById(orderId.trim());
    if (!order) {
      console.error(`Order with ID ${orderId} not found.`);
      socket.emit("abc", {
        success: false,
        message: "Order is not found..",
      });
      return;
    }
    if (order.status === newStatus) {
      socket.emit("abc", {
        success: false,
        message: "Order Status is already up-to-date",
      });

      return;
    }
    await order.updateStatusOrder(newStatus);
    console.log("🚀 ~ updateOrderBySocket ~ order:");
    socket.emit("abc", {
      success: true,
      message: `Order status updated to: ${newStatus}`,
    });
    console.log("Socket emmited");
  } catch (err) {
    socket.emit("abc", {
      success: false,
      message: `Error updating order status: ${err.message}`,
    });
    console.log("Socket emmited");
  }
};
const updateOrderPaymentBySocket = async (orderId, paid, socket) => {
  try {
    const order = await Order.findById(orderId.trim());
    if (!order) {
      console.error(`Order with ID ${orderId} not found.`);
      socket.emit("paymentResponse", {
        success: false,
        message: "Order is not found..",
      });
      console.log("Socket emmited");
      return;
    }
    if (order.status === paid) {
      socket.emit("paymentResponse", {
        success: false,
        message: "Order Status is already up-to-date",
      });
      console.log("Socket emmited");
      return;
    }
    await order.updateStatusPayment(paid);
    console.log("🚀 ~ updateOrderBySocket ~ order:");
    socket.emit("paymentResponse", {
      success: true,
      message: `Order status updated to: ${paid}`,
    });
    console.log("Socket emmited");
  } catch (err) {
    socket.emit("paymentResponse", {
      success: false,
      message: `Error updating order status: ${err.message}`,
    });
    console.log("Socket emmited");
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId, newStatus } = req.body;
    if (!orderId || !newStatus) {
      return next(
        new AppError("Please provide OrderId and New status...", 400)
      );
    }
    const order = await Order.findById(orderId.trim());
    if (!order) {
      console.error(`Order with ID ${orderId} not found.`);
      return next(new AppError("Order is not found..", 400));
    }
    if (order.status == newStatus) {
      return next(new AppError("Order Status is already up-to-date", 200));
    }
    await order.updateStatusOrder(newStatus);
    return sendResponse(
      res,
      true,
      200,
      `Order status updated to: ${newStatus}`
    );
  } catch (error) {
    return next(
      new AppError(`Error updating order status: ${error.message}`, 400)
    );
  }
};

const updateOrderPayment = async (req, res, next) => {
  try {
    const { orderId, newPayment } = req.body;
    if (!orderId || !newPayment) {
      return next(new AppError("Provide order id and new payment...", 400));
    }
    const order = await Order.findById(orderId.trim());
    if (!order) {
      return next(new AppError("Order is not found...", 400));
    }
    await order.updateStatusPayment(newPayment);
    return sendResponse(
      res,
      true,
      200,
      "Payment status is update with success..."
    );
  } catch (error) {
    return next(new AppError("Server Error ", 500));
  }
};
const updateFoodItemStatus = async (req, res, next) => {
  try {
    const { orderId, foodId, newStatus } = req.body;
    const order = await Order.findById(orderId.trim());

    if (!order) {
      return next(new AppError(`Order with ID ${orderId} not found.`, 404));
    }
    const foodItem = order.foodItems.find(
      (item) => item.foodId.toString() === foodId
    );
    if (!foodItem) {
      return next(
        new AppError(`Food item with ID ${foodItem} not found in order.`, 404)
      );
    }
    if (foodItem.status == newStatus) {
      return next(new AppError("Food Status is already up-to-date", 400));
    }
    foodItem.status = newStatus;
    await order.save();
    return sendResponse(res, true, 200, "Food status is updated... ");
  } catch (error) {
    return next(
      new AppError(`Error updating food item status: ${error.message}`, 500)
    );
  }
};

const getItemPriceById = async (foodId) => {
  try {
    console.log(foodId);
    const foodItem = await Food.findById(foodId); // Assuming you have a FoodItems model
    if (!foodItem) {
      throw new Error(`Food item not found for ID: ${foodId}`);
    }
    return foodItem.price; // Adjust according to your actual implementation
  } catch (error) {
    console.error("Error fetching food item price:", error);
    throw error;
  }
};
const addOrder = async (req, res, next) => {
  try {
    const { orderId, foodItems } = req.body;
    const customer = getUserData(req.headers);
    if (!customer)
      return next(new AppError("User Expired Please log in again", 403));

    if (!foodItems || !orderId) {
      return next(new AppError("provide food item  and orderid...", 400));
    }

    const order = await Order.findById(orderId).populate("foodItems.foodId");
    if (!order) {
      return next(new AppError(" Order is not found...", 400));
    }

    foodItems.forEach((item) => {
      const existingFooditem = order.foodItems.find(
        (foodItem) => foodItem.foodId && foodItem.foodId.equals(item.id)
      );
      if (existingFooditem) {
        existingFooditem.quantity += item.quantity;
      } else {
        order.foodItems.push({
          foodId: new mongoose.Types.ObjectId(item.id),
          quantity: item.quantity,
          isNewItem: true,
        });
      }
    });
    const newItemsAmount = await Promise.all(
      foodItems.map(async (item) => {
        try {
          const itemPrice = await getItemPriceById(item.id);
          if (!itemPrice) {
            return next(
              new AppError(
                `Food item price not found for ID: ${item.foodId}`,
                400
              )
            );
          }
          console.log("Item Price for", item.id, ":", itemPrice);
          return item.quantity * itemPrice;
        } catch (error) {
          console.error(`Error fetching price for item ID: ${item.id}`, error);
          return next(
            new AppError(`Error fetching price for item ID: ${item.id}`, 500)
          );
        }
      })
    );
    const newItemsTotalAmount = newItemsAmount.reduce(
      (sum, price) => sum + price,
      0
    );
    order.newItemsTotalAmount =
      (order.newItemsTotalAmount || 0) + newItemsTotalAmount;
    await order.save();

    return sendResponse(res, true, 200, "AddOrder update successfully", {
      order,
    });
  } catch (error) {
    console.error("Error adding new order:", error);
    return next(new AppError("Error adding new order", 500));
  }
};

const yesterdayOrder = async (req, res, next) => {
  try {
    const startOfYesterday = new Date();
    startOfYesterday.setTime(startOfYesterday.getDate() - 1);
    startOfYesterday.setHours(0, 0, 0, 0);

    const endOfYesterday = new Date();
    endOfYesterday.setTime(endOfYesterday.getDate() - 1);
    endOfYesterday.setHours(23, 59, 59, 999);
    const historyOrder = await Order.find({
      createdAt: {
        $gte: startOfYesterday,
        $lt: endOfYesterday,
      },
    })
      .sort({ createdAt: -1 })
      .exec();
    return sendResponse(
      res,
      true,
      200,
      "List the order of yesterday with success",
      { historyOrder }
    );
  } catch (error) {
    console.log(error);
    return next(new AppError("Error list of yesterday order", 500));
  }
};

const customerlistOrder = async (req, res, next) => {
  try {
    const { customerId } = getUserData(req.headers);
    if (!customerId)
      return next(new AppError("User Expired Please log in again", 403));
    const orders = await Order.find({ customerId })
      .populate("foodItems.foodId")
      .exec();
    if (!orders.length) {
      return res
        .status(200)
        .json({ success: true, message: "No orders found." });
    }
    const ordersWithFoodDetails = orders.map((order) => {
      const allFooditems = order.foodItems.map((item) => ({
        food: item.foodId ? item.foodId : "Food not found",
        quantity: item.quantity,
      }));
      return {
        _id: order._id,
        customerId: order.customerId,
        orderDate: order.orderDate,
        orderStatus: order.status,
        orderTotal: order.totalAmount,
        orderPaymentMode: order.payment_mode,
        orderPayment: order.payment,
        allFooditems,
      };
    });
    return sendResponse(res, true, 200, "Customer order listed successfully", {
      orders: ordersWithFoodDetails,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return next(new AppError("Error fetching orders", 500));
  }
};

const dailyOrder = async (req, res) => {
  try {
    const { userId } = getUserData(req.headers);
    if (!userId) return next(new AppError("Token Expired or Invalid", 400));

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(24, 59, 59, 999);

    const todayOrders = await Order.find({
      createdAt: { $gte: startOfToday, $lt: endOfToday },
    });
    if (!todayOrders.length) {
      return sendResponse(res, true, 200, "No order found for today", {
        totalOrders: 0,
        totalAmount: 0,
      });
    }
    totalOrders = todayOrders.length;
    totalAmount = todayOrders.reduce(
      (acc, order) => acc + order.totalAmount,
      0
    );
    return sendResponse(
      res,
      true,
      200,
      "Today's orders retrieved successfully",
      {
        totalOrders,
        totalAmount,
        orders: todayOrders,
      }
    );
  } catch (error) {
    return next(new AppError("Error fetching today's orders", 500));
  }
};
module.exports = {
  createOrder: createOrder,
  deleteOrder: deleteOrder,
  tableOrder: tableOrder,
  listOrders: listOrders,
  deleteFood: deleteFood,
  updateOrderStatus: updateOrderStatus,
  updateFoodItemStatus: updateFoodItemStatus,
  getUserData,
  customerOrderlist: customerOrderlist,
  addOrder: addOrder,
  updateOrderPayment: updateOrderPayment,
  adminOrderList: adminOrderList,
  updateOrderBySocket,
  updateOrderPaymentBySocket,
  yesterdayOrder: yesterdayOrder,
  addOrder: addOrder,
  customerlistOrder: customerlistOrder,
  dailyOrder: dailyOrder,
};
