const mongoose = require("mongoose");
const Order = require("../models/orderModels"); // Adjust the path as necessary
const jwt = require("jsonwebtoken");
const Food = require("../models/foodModels");

function getUserData(headers) {
  // Bearer eyIijewkfneknasdflkasd4
  // console.log(headers?.authorization);
  const token = headers?.authorization?.split(" ")[1];
  if (!token)
    return {
      customerId: null,
    };
  const verifiedToken = jwt.verify(token, process.env.JWT_SECRET);
  if (!verifiedToken || !verifiedToken.user)
    return {
      customerId: null,
    };

  // console.log(verifiedToken);
  return {
    customerId: verifiedToken.user.id,
  };
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
      return res.status(403).json({ msg: "User Expired Please log in again" });
    }
    if (!foodItems) {
      return res.status(400).json({ msg: "No food ordered..." });
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
      return res.status(400).json({ msg: response.message, success: false });
    }
    //  order.isRated = true;
    // Save the order
    await order.save();
    console.log(order);
    return res
      .status(200)
      .json({ msg: "Order created successfully", order, success: true });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Error creating order", error });
  }
};

const deleteOrder = async (req, res, next) => {
  const { orderId } = req.body;

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
    return res.status(500).json({
      success: false,
      message: "Error deleting order",
      error: error.message,
    });
  }

  if (next) {
    next();
  }
};

const deleteFood = async (req, res, next) => {
  const { orderId } = req.params;
  const { foodId } = req.body;

  if (
    !mongoose.Types.ObjectId.isValid(orderId) ||
    !mongoose.Types.ObjectId.isValid(foodId)
  ) {
    return res.status(400).json({ msg: "Invalid order ID or food ID." });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: "Order not found." });
    }

    // Find the index of the food item in the foodItems array
    const foodIndex = order.foodItems.findIndex(
      (item) => item.foodId.toString() === foodId
    );
    if (foodIndex === -1) {
      return res.status(404).json({ msg: "Food not found in order." });
    }

    // Remove the food item from the array
    order.foodItems.splice(foodIndex, 1);

    // Save the updated order
    await order.save();

    res.status(200).json({ order, msg: "Food deleted successfully." });
  } catch (error) {
    res.status(500).json({ msg: "Error deleting food", error: error.message });
  }
  if (next) {
    next();
  }
};

const tableOrder = async (req, res, next) => {
  const { orderId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({ msg: "Invalid  ID." });
  }

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ msg: "Order not found in the table." });
    }

    res.status(200).json({ order, msg: "table order listed successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ msg: "Error list table order", error: error.message });
  }

  if (next) {
    next();
  }
};

//admin order list
const adminOrderList = async (req, res) => {
  console.log("object");
  try {
    // console.log("object");

    const { userId } = getAdminData(req.headers);
    // console.log(userId);
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
    // const customerDetails = await customer.findById(orders.customerId);
    // if (customerDetails) {
    //   return res
    //     .status(200)
    //     .json({ success: true, message: "Customer details with success" });
    // }
    // console.log("object");
    return res.status(200).json({
      success: true,
      orderList,
      message: "Customer Order listed with success ",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
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
    // .populate({ path: "customerId" })
    // .populate({ path: "foodItems.foodId" });
    // Detailed logging to debug
    // orders.forEach((order) => {
    //   if (!order.customerId) {
    //     console.log(`Order with ID ${order._id} has a null customerId`);
    //   }
    // });
    if (orders?.length === 0) {
      return res
        .status(200)
        .json({ success: true, message: "No orders found." });
    }
    return res
      .status(200)
      .json({ orders, success: true, message: "Order listed successfully" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error.message,
    });
  }

  if (next) {
    next();
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
    // console.log("Customer ID:", customerId);

    // Retrieve orders for the customer and populate food details
    const orders = await Order.find({ customerId }).populate(
      "foodItems.foodId"
    );
    if (!orders.length) {
      return res
        .status(200)
        .json({ success: true, message: "No orders found." });
    }
    // console.log("Orders retrieved:", orders);

    // Format the response to include order details with populated food details
    const ordersWithFoodDetails = orders.map((order) => {
      return {
        _id: order._id,
        customerId: order.customerId,
        orderDate: order.orderDate,
        orderStatus: order.status,
        orderTotal: order.totalAmount,
        orderPaymentMode: order.payment_mode,
        orderPayment: order.payment,

        foodItems: order.foodItems.map((item) => ({
          food: item.foodId, // This now includes the full food document
          quantity: item.quantity,
        })),
      };
    });
    // Respond with the order and food details
    return res.status(200).json({
      success: true,
      orders: ordersWithFoodDetails,
      message: "Customer order listed successfully",
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res
      .status(500)
      .json({ msg: "Error fetching orders", error: error.message });
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
      console.log("Socket emmited");
      return;
    }
    if (order.status === newStatus) {
      socket.emit("abc", {
        success: false,
        message: "Order Status is already up-to-date",
      });
      // socket.emit("abcd", {
      //   success: false,
      //   message: "Order Status is already up-to-date",
      // });
      console.log("Socket emmited");
      return;
    }
    await order.updateStatusOrder(newStatus);
    console.log("🚀 ~ updateOrderBySocket ~ order:");
    socket.emit("abc", {
      success: true,
      message: `Order status updated to: ${newStatus}`,
    });
    // socket.emit("abcd", {
    //   success: true,
    //   message: `Order status updated to: ${newStatus}`,
    // });
    console.log("Socket emmited");
  } catch (err) {
    socket.emit("abc", {
      success: false,
      message: `Error updating order status: ${err.message}`,
    });
    // socket.emit("abcd", {
    //   success: false,
    //   message: `Error updating order status: ${err.message}`,
    // });
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
      // socket.emit("abcd", {
      //   success: false,
      //   message: "Order Status is already up-to-date",
      // });
      console.log("Socket emmited");
      return;
    }
    await order.updateStatusPayment(paid);
    console.log("🚀 ~ updateOrderBySocket ~ order:");
    socket.emit("paymentResponse", {
      success: true,
      message: `Order status updated to: ${paid}`,
    });
    // socket.emit("abcd", {
    //   success: true,
    //   message: `Order status updated to: ${paid}`,
    // });
    console.log("Socket emmited");
  } catch (err) {
    socket.emit("paymentResponse", {
      success: false,
      message: `Error updating order status: ${err.message}`,
    });
    // socket.emit("abcd", {
    //   success: false,
    //   message: `Error updating order status: ${err.message}`,
    // });
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
      return res.status(400).json({
        success: false,
        message: "Order Status is already up-to-date",
      });
    }
    await order.updateStatusOrder(newStatus);
    return res.status(200).json({
      success: true,
      message: `Order status updated to: ${newStatus}`,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: `Error updating order status: ${error.message}`,
    });
  }
};

const updateOrderPayment = async (req, res) => {
  try {
    const { orderId, newPayment } = req.body;
    console.log(orderId, newPayment);
    if (!orderId || !newPayment) {
      return res.status(400).json({
        success: false,
        message: "Provide order id and new payment...",
      });
    }
    const order = await Order.findById(orderId.trim());
    console.log(order);
    if (!order) {
      return res
        .status(400)
        .json({ success: false, message: "Order is not found..." });
    }
    console.log("object");
    await order.updateStatusPayment(newPayment);
    return res.status(200).json({
      success: true,
      message: "Payment status is update with success...",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Server Error for ..." });
  }
};
const updateFoodItemStatus = async (req, res) => {
  try {
    const { orderId, foodId, newStatus } = req.body;
    const order = await Order.findById(orderId.trim());

    if (!order) {
      return res
        .status(404)
        .json({ msg: `Order with ID ${orderId} not found.` });
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
    return res.status(200).json({
      success: true,
      message: "Food status is updated... ",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: `Error updating food item status: ${error.message}`,
    });
  }
};

const getItemPriceById = async (foodId) => {
  try {
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
    const { customerId } = getUserData(req.headers);
    if (!customerId)
      return res
        .status(403)
        .json({ success: false, message: "User Expired Please log in again" });

    if (!foodItems || !orderId) {
      return res
        .status(400)
        .json({ success: false, message: "provide food item  and orderid..." });
    }
    console.log(customerId, foodItems);
    console.log("object");
    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(400)
        .json({ success: false, message: " Order is not found..." });
    }
    console.log("Order found:", order);
    foodItems.forEach((item) => {
      order.foodItems.push({
        foodId: new mongoose.Types.ObjectId(item.Id),
        quantity: item.quantity,
      });
    });
    console.log("Updated Food Items:", order.foodItems);
    const totalAmount = await Promise.all(
      order.foodItems.map(async (item) => {
        const itemPrice = await getItemPriceById(item.foodId);
        console.log("Item Price for", item.foodId, ":", itemPrice);
        return item.quantity * itemPrice;
      })
    ).then((results) => results.reduce((sum, price) => sum + price, 0));
    // const totalAmount = order.foodItems.reduce((sum, item) => {
    //   const itemPrice = getItemPriceById(item.foodId);
    //   return sum + item.quantity * itemPrice;
    // }, 0);
    // const totalAmount = await Promise.all(
    //   order.foodItems.map(async (item) => {
    //     const itemPrice = await getItemPriceById(item.foodId);
    //     return item.quantity * itemPrice;
    //   })
    // ).then((results) => results.reduce((sum, price) => sum + price, 0));
    console.log("object2");
    order.totalAmount = totalAmount;
    console.log("Total Amount:", totalAmount);
    await order.save();
    console.log("object3");

    return res
      .status(200)
      .json({ msg: "Order update successfully", order, success: true });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Error creating order", error });
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
    // .populate("customerId")
    // .populate("foodItems.foodId");
    return res.status(200).json({
      success: true,
      historyOrder,
      message: "List the order of yesterday with success",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: true, message: error });
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
  yesterdayOrder,
};
