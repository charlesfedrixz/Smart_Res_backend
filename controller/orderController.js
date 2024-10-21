const mongoose = require("mongoose");
const Order = require("../models/orderModels"); // Adjust the path as necessary
const jwt = require("jsonwebtoken");
const Food = require("../models/foodModels");
const Category = require("../models/categoryModels");
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

const createOrder = async (req, res) => {
  try {
    const { foodItems } = req.body;
    const userData = getUserData(req.headers);
    if (!userData?.customerId) {
      return res
        .status(403)
        .json({ success: false, message: "User Expired Please log in again" });
    }
    if (!foodItems) {
      return res
        .status(400)
        .json({ success: false, message: "No food ordered..." });
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
      return res
        .status(400)
        .json({ success: false, message: response.message });
    }
    await order.save();
    console.log(order);
    return res
      .status(200)
      .json({ success: true, order, message: "Order created successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Error creating order" });
  }
};

const deleteOrder = async (req, res) => {
  const { orderId } = req.body;
  if (orderId) return next(new AppError("Please order ID", 400));
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid order ID." });
  }
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(200)
        .json({ success: true, message: "Order not found." });
    }
    await Order.deleteOne({ _id: orderId });
    return res
      .status(200)
      .json({ success: true, message: "Order deleted successfully." });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Error deleting order" });
  }
};

const deleteFood = async (req, res) => {
  const { orderId } = req.params;
  const { foodId } = req.body;

  if (
    !mongoose.Types.ObjectId.isValid(orderId) ||
    !mongoose.Types.ObjectId.isValid(foodId)
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid order ID or food ID." });
  }
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }
    // Find the index of the food item in the foodItems array
    const foodIndex = order.foodItems.findIndex(
      (item) => item.foodId.toString() === foodId
    );
    if (foodIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Food not found in order." });
    }
    order.foodItems.splice(foodIndex, 1);
    await order.save();
    return res
      .status(200)
      .json({ success: true, order, message: "Food deleted successfully." });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Error deleting food" });
  }
};

const tableOrder = async (req, res) => {
  const { orderId } = req.body;
  if (orderId)
    return res
      .status(400)
      .json({ success: false, message: "Please provide OrderId" });

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({ success: false, message: "Invalid  ID." });
  }
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found in the table." });
    }
    return res.status(200).json({
      success: true,
      order,
      message: "table order listed successfully.",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Error list table order" });
  }
};

//admin order list
const adminOrderList = async (req, res) => {
  try {
    const { userId } = getAdminData(req.headers);
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide token" });
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
    return res.status(200).json({
      success: true,
      orderList,
      message: "Customer Order listed with success ",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
const listOrders = async (req, res) => {
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
    return res
      .status(200)
      .json({ success: true, orders, message: "Order listed successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Error fetching orders" });
  }
};
//
const customerOrderlist = async (req, res) => {
  try {
    const { customerId } = getUserData(req.headers);
    if (!customerId)
      return res
        .status(403)
        .json({ success: false, message: "User Expired Please log in again" });
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
    return res.status(200).json({
      success: true,
      orders: ordersWithFoodDetails,
      message: "Customer order listed successfully",
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error fetching orders" });
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

const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, newStatus } = req.body;
    if (!orderId || !newStatus) {
      return res.status(400).json({
        success: false,
        message: "Please provide OrderId and New status...",
      });
    }
    const order = await Order.findById(orderId.trim());
    if (!order) {
      console.error(`Order with ID ${orderId} not found.`);
      return res
        .status(400)
        .json({ success: false, message: "Order is not found.." });
    }
    if (order.status == newStatus) {
      return res
        .status(200)
        .json({ success: true, message: "Order Status is already up-to-date" });
    }
    await order.updateStatusOrder(newStatus);
    return res.status(200).json({
      success: true,
      message: `Order status updated to: ${newStatus}`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Error updating order status: ${error.message}`,
    });
  }
};

const updateOrderPayment = async (req, res) => {
  try {
    const { orderId, newPayment } = req.body;
    if (!orderId || !newPayment) {
      return res.status(400).json({
        success: false,
        message: "Provide order id and new payment...",
      });
    }
    const order = await Order.findById(orderId.trim());
    if (!order) {
      return res
        .status(400)
        .json({ success: false, message: "Order is not found..." });
    }
    await order.updateStatusPayment(newPayment);
    return res.status(200).json({
      success: true,
      message: "Payment status is update with success...",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error " });
  }
};
const updateFoodItemStatus = async (req, res) => {
  try {
    const { orderId, foodId, newStatus } = req.body;
    const order = await Order.findById(orderId.trim());

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order with ID ${orderId} not found.`,
      });
    }
    const foodItem = order.foodItems.find(
      (item) => item.foodId.toString() === foodId
    );
    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: `Food item with ID ${foodItem} not found in order.`,
      });
    }
    if (foodItem.status == newStatus) {
      return res
        .status(400)
        .json({ success: false, message: "Food Status is already up-to-date" });
    }
    foodItem.status = newStatus;
    await order.save();
    return res
      .status(200)
      .json({ success: true, message: "Food status is updated... " });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Error updating food item status: ${error.message}`,
    });
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
const addOrder = async (req, res) => {
  try {
    const { orderId, foodItems } = req.body;
    const customer = getUserData(req.headers);
    if (!customer)
      return res
        .status(403)
        .json({ success: false, message: "User Expired Please log in again" });

    if (!foodItems || !orderId) {
      return res
        .status(400)
        .json({ success: false, message: "provide food item  and orderid..." });
    }

    const order = await Order.findById(orderId).populate("foodItems.foodId");
    if (!order) {
      return res
        .status(400)
        .json({ success: false, message: " Order is not found..." });
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
            return res.status(400).json({
              success: false,
              message: `Food item price not found for ID: ${item.foodId}`,
            });
          }
          console.log("Item Price for", item.id, ":", itemPrice);
          return item.quantity * itemPrice;
        } catch (error) {
          console.error(`Error fetching price for item ID: ${item.id}`, error);
          return res.status(500).json({
            success: false,
            message: `Error fetching price for item ID: ${item.id}`,
          });
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

    return res
      .status(200)
      .json({ success: true, order, message: "AddOrder update successfully" });
  } catch (error) {
    console.error("Error adding new order:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error adding new order" });
  }
};

const yesterdayOrder = async (req, res) => {
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
    return res.status(200).json({
      success: true,
      historyOrder,
      message: "List the order of yesterday with success",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

const customerlistOrder = async (req, res) => {
  try {
    const { customerId } = getUserData(req.headers);
    if (!customerId)
      return res
        .status(403)
        .json({ success: false, message: "User Expired Please log in again" });
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
    return res.status(200).json({
      success: true,
      orders: ordersWithFoodDetails,
      message: "Customer order listed successfully",
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error fetching orders" });
  }
};

const dailyOrder = async (req, res) => {
  try {
    const { userId } = getUserData(req.headers);
    if (!userId)
      return res
        .status(400)
        .json({ success: false, message: "Token Expired or Invalid" });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(24, 59, 59, 999);

    const todayOrders = await Order.find({
      createdAt: { $gte: startOfToday, $lt: endOfToday },
    });
    const totalFoodItems = await Food.countDocuments();
    const totalCategories = await Category.countDocuments();
    if (!todayOrders.length) {
      return res.status(200).json({
        success: true,
        totalOrders: 0,
        totalAmount: 0,
        totalFoodItems,
        totalCategories,
        message: "No order found for today",
      });
    }
    totalOrders = todayOrders.length;
    totalAmount = todayOrders.reduce(
      (acc, order) => acc + order.totalAmount,
      0
    );
    return res.status(200).json({
      success: true,
      totalOrders,
      totalAmount,
      totalFoodItems,
      totalCategories,
      orders: todayOrders,
      message: "Today's orders retrieved successfully",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Error fetching today's orders" });
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
