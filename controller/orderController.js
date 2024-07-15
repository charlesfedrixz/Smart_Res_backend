const mongoose = require("mongoose");
const Order = require("../models/orderModels"); // Adjust the path as necessary
const jwt = require("jsonwebtoken");
const Food = require("../models/foodModels");

function getUserData(headers) {
  // Bearer eyIijewkfneknasdflkasd4
  const token = headers.authorization.split(" ")[1];
  if (!token)
    return {
      customerId: null,
    };
  const verifiedToken = jwt.verify(token, process.env.JWT_SECRET);
  if (!verifiedToken)
    return {
      customerId: null,
    };
  return {
    customerId: verifiedToken.user.id,
  };
}

const createOrder = async (req, res) => {
  try {
    const { foodItems } = req.body;
    const { customerId } = getUserData(req.headers);
    if (!customerId)
      return res.status(403).json({ msg: "User Expired Please log in again" });

    if (!foodItems) {
      return res.status(400).json({ msg: "No food ordered..." });
    }
    console.log(customerId, foodItems);
    const order = new Order({
      customerId,
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
    return res.status(400).json({ msg: "Invalid order ID." });
  }

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ msg: "Order not found." });
    }

    await Order.deleteOne({ _id: orderId });

    res.status(200).json({ msg: "Order deleted successfully." });
  } catch (error) {
    res.status(500).json({ msg: "Error deleting order", error: error.message });
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

const listOrders = async (req, res, next) => {
  try {
    const orders = await Order.find();

    if (!orders.length) {
      return res.status(404).json({ msg: "No orders found." });
    }
    res.status(200).json({ orders });
  } catch (error) {
    return res
      .status(500)
      .json({ msg: "Error fetching orders", error: error.message });
  }

  if (next) {
    next();
  }
};
//
const customerOrderlist = async (req, res) => {
  try {
    const { customerId } = getUserData(req.headers);
    console.log("Customer ID:", customerId);

    // Retrieve orders for the customer and populate food details
    const orders = await Order.find({ customerId }).populate(
      "foodItems.foodId"
    );
    if (!orders.length) {
      return res
        .status(404)
        .json({ success: false, message: "No orders found." });
    }
    console.log("Orders retrieved:", orders);

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
    res.status(200).json({
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
};
