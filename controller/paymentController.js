require("dotenv").config();
const Razorpay = require("razorpay");
const Order = require("../models/orderModels");
const crypto = require("crypto");
const { Invoice } = require("../models/invoicemodel");
const sendResponse = require("../middleware/sendResponse");
const AppError = require("../middleware/sendResponse");

const payment = async (req, res, next) => {
  try {
    // Initialize Razorpay instance with your credentials
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });

    // const options = req.body;
    const { orderId } = req.body;
    if (!orderId) return next(new AppError("Please provide orderId", 400));

    const currentOrder = await Order.findById(orderId);
    if (!currentOrder) return next(new AppError("Order Not Found", 400));

    // Create Invoice
    const invoice = await Invoice.create({
      amount: currentOrder.totalAmount,
      currency: "INR",
      orderId,
    });
    const options = {
      amount: currentOrder.totalAmount * 100,
      currency: "INR",
      receipt: invoice.id,
    };

    console.log("Payment options:", options);

    const order = await razorpay.orders.create(options);
    console.log("abc", order);

    if (!order) {
      if (!order)
        return next(new AppError("Error: Order creation failed", 500));
    }
    return sendResponse(res, true, 200, "payment created successfully", {
      order,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return next(
      new AppError("An error occurred while creating the order", 500)
    );
  }
};

const paymentVerify = async (req, res, next) => {
  try {
    const {
      razorpayOrder,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return next(new AppError("Missing required fields", 400));
    }
    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(sign.toString())
      .digest("hex");
    if (razorpay_signature === expectedSign) {
      // find the invoice
      const currentInvoice = await Invoice.findById(razorpayOrder.receipt);

      if (!currentInvoice) return next(new AppError("Invoice not found", 400));
      await currentInvoice.updateStatus("Paid");
      const currentOrder = await Order.findById(currentInvoice.orderId);
      if (!currentOrder) return next(new AppError("order not found", 400));
      await currentOrder.updateStatusPayment(true);
      await currentOrder.updatePaymentMode("Online");
      return sendResponse(res, true, 200, "payment verified successfully");
    } else {
      await Invoice.updateStatus("Processing");
      await Order.updatePaymentStatus(false);
      return next(new AppError("Invalid signature sent", 400));
    }
  } catch (error) {
    return next(new AppError("Server Error", 500));
  }
};

const paymentNew = async (req, res, next) => {
  try {
    // Initialize Razorpay instance with your credentials
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });

    // const options = req.body;
    const { orderId } = req.body;

    const currentOrder = await Order.findById(orderId);
    if (!currentOrder) return next(new AppError("Order Not Found", 400));
    if (
      currentOrder.payment_mode === "offline" ||
      currentOrder.payment_mode === "Cash"
    ) {
      // Create Invoice
      const invoice = await Invoice.create({
        amount: currentOrder.totalAmount,
        currency: "INR",
        orderId,
      });
      await invoice.updateStatus("Pending");
      return sendResponse(
        res,
        true,
        200,
        "Offline Payment created with invoice successfull  ",
        { Data: invoice }
      );
    } else {
      return next(new AppError("Invalid payment mode ", 400));
    }
  } catch (error) {
    console.error("Error creating order:", error);
    return next(
      new AppError("An error occurred while creating the order", 500)
    );
  }
};

const cashPayment = async (req, res, next) => {
  const { orderId } = req.body;
  if (!orderId) {
    return next(new AppError("Please provide orderId field", 400));
  }
  try {
    const findOrder = await Order.findById(orderId);
    if (!findOrder) {
      return next(new AppError("Order is not found", 400));
    }
    const invoice = await Invoice.create({
      amount: findOrder.totalAmount,
      currency: "INR",
      orderId,
    });
    await invoice.updateStatus("Pending");
    return sendResponse(
      res,
      true,
      200,
      "Offline Payment created with invoice successfull  ",
      { Data: invoice }
    );
  } catch (error) {
    console.error("Error creating order:", error);
    return next(
      new AppError("An error occurred while creating invoice  order", 500)
    );
  }
};
module.exports = {
  paymentVerify: paymentVerify,
  payment: payment,
  paymentNew: paymentNew,
  cashPayment: cashPayment,
};
