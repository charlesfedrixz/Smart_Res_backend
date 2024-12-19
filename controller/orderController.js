const Order = require('../models/orderModels');
const Table = require('../models/tableModel');
const Food = require('../models/foodModels');
const { default: mongoose } = require('mongoose');
const asyncHandler = require('express-async-handler');
/*
Customer Flow & Table Management:

1. When a customer leaves after paying:
   - Their order status is set to 'Completed'
   - The table's currentOrder is set to null
   - The table remains occupied until staff marks it as unoccupied
   
2. When a new customer arrives:
   - Staff marks the table as occupied
   - A new order is created with new customerId
   - The table's currentOrder is updated to the new order

3. For multiple orders by same customer:
   - When customer pays for first order, mark it as 'Completed' 
   - Create new order with same customerId
   - Table's currentOrder points to latest active order
   - Previous completed orders remain in history

UI Flow & API Integration:

Admin Panel Flow:
1. Admin Dashboard
   - View all orders: GET /api/orders/admin/{restaurantId}
   - View today's orders: GET /api/orders/daily/{restaurantId}
   - View yesterday's orders: GET /api/orders/yesterday/{restaurantId}

2. Table Management
   - Create new order: POST /api/orders/create/{restaurantId}/{tableId}/{customerId}
   - View table order: GET /api/orders/table/{restaurantId}/{tableId}
   - Add items to order: POST /api/orders/add/{restaurantId}/{tableId}/{customerId}
   - Update food status: PUT /api/orders/food-status/{restaurantId}/{orderId}
   - Process payment: PUT /api/orders/payment/{restaurantId}/{orderId}

Customer App Flow:
1. Customer Login/Registration
   - Login with mobile number
   - After verification, get customerId

2. Order Flow
   - View menu and select items
   - Create order: POST /api/orders/create/{restaurantId}/{tableId}/{customerId}
   - Add more items: POST /api/orders/add/{restaurantId}/{tableId}/{customerId}
   - View order status: GET /api/orders/customer/{restaurantId}
   - View order history: GET /api/orders/customer-list/{restaurantId}

3. Payment Flow
   - View bill details
   - Select payment mode
   - Process payment: PUT /api/orders/payment/{restaurantId}/{orderId}
*/

// Create a new order
const createOrder = async (req, res) => {
  try {
    const { restaurantId, tableId, customerId } = req.user;
    const { foodItems, paymentMode = 'Cash' } = req.body;

    if (!restaurantId || !tableId || !customerId || !foodItems?.length) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Check if table has any incomplete orders
    const existingOrder = await Order.findOne({
      restaurantId,
      tableId,
      status: { $ne: 'Completed' },
    });

    if (existingOrder) {
      return res.status(400).json({
        success: false,
        message:
          'Table has an active order. Please complete or cancel it first.',
      });
    }

    // Validate food items exist
    const foodIds = foodItems.map((item) => item.foodId);
    const validFoodItems = await Food.find({
      _id: { $in: foodIds },
      restaurant: restaurantId,
      isAvailable: true,
    });
    console.log(validFoodItems);
    if (validFoodItems.length !== foodIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more food items are invalid or unavailable',
      });
    }

    const order = new Order({
      restaurantId,
      tableId,
      customerId,
      foodItems,
      totalAmount: 0,
      status: 'Processing',
      payment: 'Unpaid',
      paymentMode,
    });

    // Calculate total amount
    await order.calculateTotalAmount();
    await order.save();

    // Update table's currentOrder
    await Table.findByIdAndUpdate(tableId, {
      currentOrder: order._id,
      isOccupied: true,
    });

    console.log('CHECK -- ', order.customerId);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
    });
  }
};

// delete all order of a customer
const deleteAllOrder = async (req, res) => {
  try {
    await Order.deleteMany({});
    res.status(200).json({ success: true, message: 'All orders deleted' });
  } catch (error) {
    console.error('Delete all order error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to delete orders' });
  }
};

// List orders for a restaurant
const listOrders = async (req, res) => {
  try {
    if (
      req.user?.role !== 'Super_Admin' &&
      req.user?.role !== 'Restaurant_Admin'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { restaurantId } = req.params;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID is required',
      });
    }

    const orders = await Order.find({ restaurantId })
      .populate('customerId', '-password -__v')
      .populate('tableId', '-__v')
      .populate('foodItems.foodId', '-__v')
      .select('-__v')
      .lean();

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('List orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
    });
  }
};

// Get table order
const tableOrder = async (req, res) => {
  try {
    const { restaurantId, tableId, customerId } = req.user;
    const { foodItems } = req.body;

    if (!restaurantId || !tableId || !customerId || !foodItems?.length) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Check if table has any incomplete orders
    const existingOrder = await Order.findOne({
      restaurantId,
      tableId,
      status: { $ne: 'Completed' },
    });

    if (existingOrder) {
      return res.status(400).json({
        success: false,
        message:
          'Table has an active order. Please complete or cancel it first.',
      });
    }

    // Validate food items
    const foodIds = foodItems.map((item) => item.foodId);
    const validFoodItems = await Food.find({
      _id: { $in: foodIds },
      restaurantId,
      isAvailable: true,
    });

    if (validFoodItems.length !== foodIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more food items are invalid or unavailable',
      });
    }

    const order = new Order({
      restaurantId,
      tableId,
      customerId,
      foodItems,
      totalAmount: 0,
      status: 'Processing',
    });

    await order.calculateTotalAmount();
    await order.save();

    await Table.findByIdAndUpdate(tableId, {
      currentOrder: order._id,
      isOccupied: true,
    });

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Table order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create table order',
    });
  }
};

// Delete food item from order
const deleteFood = async (req, res) => {
  try {
    const { restaurantId, orderId } = req.params;
    const { foodItemId } = req.body;

    if (!restaurantId || !orderId || !foodItemId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const order = await Order.findOne({ _id: orderId, restaurantId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify completed order',
      });
    }

    const initialLength = order.foodItems.length;
    console.log(order.foodItems);
    order.foodItems = order.foodItems.filter(
      (item) => !item._id.equals(foodItemId)
    );
    console.log(order.foodItems);
    if (order.foodItems.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found in order',
      });
    }

    await order.calculateTotalAmount();
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Food item removed successfully',
      data: order,
    });
  } catch (error) {
    console.error('Delete food error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete food item',
    });
  }
};

// Update food item status
const updateFoodItemStatus = async (req, res) => {
  try {
    const { restaurantId, orderId } = req.params;
    const { foodItemId, status } = req.body;

    if (!restaurantId || !orderId || !foodItemId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const validStatuses = ['Pending', 'Preparing', 'Ready', 'Served'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid food status',
      });
    }

    const order = await Order.findOne({ _id: orderId, restaurantId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify completed order',
      });
    }

    const foodItem = order.foodItems.id(foodItemId);
    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found in order',
      });
    }

    foodItem.status = status;
    await order.save();

    const io = req.app.get('io');
    io.to(restaurantId.toString()).emit('foodStatusUpdate', {
      orderId: order._id,
      foodItemId: foodItemId,
      status: status,
      order: order,
    });

    res.status(200).json({
      success: true,
      message: 'Food status updated successfully',
      data: order,
    });
  } catch (error) {
    console.error('Update food status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update food status',
    });
  }
};

// Get customer order list
const customerOrderlist = async (req, res) => {
  try {
    const { restaurantId, customerId, tableId } = req.user;

    if (!restaurantId || !customerId || !tableId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    console.log('CHECK THIS TOO', customerId);

    const orders = await Order.find({
      restaurantId,
      customerId,
      tableId,
      // status: { $ne: 'Completed' },
    })
      .populate('customerId', '-password -__v')
      .populate('tableId', '-__v')
      .populate('foodItems.foodId', '-__v')
      .select('-__v')
      .lean();

    console.log(orders);

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('Customer order list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer orders',
    });
  }
};

// Add items to existing order
const addOrder = asyncHandler(async (req, res) => {
  try {
    const { restaurantId, tableId, customerId } = req.user;
    const { foodItems, paymentMode = 'Cash' } = req.body;

    console.log(req.body);

    if (!restaurantId || !tableId || !customerId || !foodItems?.length) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Validate food items
    console.log(restaurantId);
    const foodIds = foodItems.map((item) => item.foodId);
    const validFoodItems = await Food.find({
      _id: { $in: foodIds },
      restaurant: restaurantId,
      isAvailable: true,
    });

    console.log(validFoodItems, foodIds);

    if (validFoodItems.length !== foodIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more food items are invalid or unavailable',
      });
    }

    let order = await Order.findOne({
      restaurantId,
      tableId,
      customerId,
      status: 'Processing',
    });

    if (!order) {
      order = new Order({
        restaurantId,
        tableId,
        customerId,
        foodItems: foodItems.map((item) => ({ ...item, isNewItem: true })),
        status: 'Processing',
        paymentMode,
      });
    } else {
      order.foodItems.push(
        ...foodItems.map((item) => ({ ...item, isNewItem: true }))
      );
    }

    await order.calculateTotalAmount();
    await order.save();

    await Table.findByIdAndUpdate(tableId, { currentOrder: order._id });

    console.log('Created', order);

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Add order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add items to order',
    });
  }
});

// Update order payment
const updateOrderPayment = async (req, res) => {
  try {
    if (
      req.user?.role !== 'Super_Admin' &&
      req.user?.role !== 'Restaurant_Admin'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { restaurantId, orderId } = req.params;
    const { payment, paymentMode } = req.body;

    if (!restaurantId || !orderId || (!payment && !paymentMode)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const order = await Order.findOne({ _id: orderId, restaurantId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.status === 'Completed' && payment) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify payment for completed order',
      });
    }

    if (payment) {
      await order.updatePaymentStatus(payment === 'Paid');

      if (payment === 'Paid') {
        // update table occupancy to available
        const table = await Table.findById(order.tableId);

        if (table) {
          table.isOccupied = false;
          await table.save();
        }
      }

      if (payment === 'Paid') {
        await order.updateOrderStatus('Completed');
        await Table.findByIdAndUpdate(order.tableId, {
          currentOrder: null,
        });
      }
    }

    if (paymentMode) {
      await order.updatePaymentMode(paymentMode);
    }

    const io = req.app.get('io');
    io.to(restaurantId.toString()).emit('paymentUpdate', {
      orderId: order._id,
      payment: payment,
      paymentMode: paymentMode,
      order: order,
    });

    res.status(200).json({
      success: true,
      message: 'Payment updated successfully',
      data: order,
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment',
    });
  }
};

// Get admin order list
const adminOrderList = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID is required',
      });
    }

    const orders = await Order.find({ restaurantId })
      .populate('customerId', '-password -__v')
      .populate('tableId', '-__v')
      .populate('foodItems.foodId', '-__v')
      .select('-__v')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('Admin order list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin orders',
    });
  }
};

// Get yesterday's orders
const yesterdayOrder = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID is required',
      });
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await Order.find({
      restaurantId,
      createdAt: {
        $gte: yesterday,
        $lt: today,
      },
    })
      .populate('customerId', '-password -__v')
      .populate('tableId', '-__v')
      .populate('foodItems.foodId', '-__v')
      .select('-__v')
      .lean();

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('Yesterday orders error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch yesterday's orders",
    });
  }
};

// Get customer list orders
const customerlistOrder = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { customerId } = req.body;

    if (!restaurantId || !customerId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const orders = await Order.find({
      restaurantId,
      customerId,
      status: { $ne: 'Completed' },
    })
      .populate('foodItems.foodId', '-__v')
      .populate('tableId', '-__v')
      .select('-__v')
      .lean();

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('Customer list orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer orders',
    });
  }
};

// Get today's orders
const dailyOrder = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID is required',
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const orders = await Order.find({
      restaurantId,
      createdAt: {
        $gte: today,
        $lt: tomorrow,
      },
    })
      .populate('customerId', '-password -__v')
      .populate('tableId', '-__v')
      .populate('foodItems.foodId', '-__v')
      .select('-__v')
      .lean();

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('Daily orders error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch today's orders",
    });
  }
};

module.exports = {
  createOrder,
  listOrders,
  tableOrder,
  deleteFood,
  updateFoodItemStatus,
  customerOrderlist,
  addOrder,
  updateOrderPayment,
  adminOrderList,
  yesterdayOrder,
  customerlistOrder,
  dailyOrder,
  deleteAllOrder,
};
