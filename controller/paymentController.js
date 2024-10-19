require("dotenv").config();
const Razorpay = require("razorpay");
const Order = require("../models/orderModels");
const crypto = require("crypto");
const { Invoice } = require("../models/invoicemodel");

const payment = async (req, res) => {
  try {
    // Initialize Razorpay instance with your credentials
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });

    // const options = req.body;
    const { orderId } = req.body;
    if (!orderId)
      return res
        .status(400)
        .json({ success: false, message: "Please provide orderId" });
    const currentOrder = await Order.findById(orderId);
    if (!currentOrder)
      return res
        .status(400)
        .json({ success: false, message: "Order Not Found" });

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
        return res
          .status(500)
          .json({ success: false, message: "Error: Order creation failed" });
    }
    return res
      .status(200)
      .json({ success: true, order, message: "payment created successfully" });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while creating the order",
    });
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
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }
    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(sign.toString())
      .digest("hex");
    if (razorpay_signature === expectedSign) {
      // find the invoice
      const currentInvoice = await Invoice.findById(razorpayOrder.receipt);

      if (!currentInvoice)
        return res
          .status(400)
          .json({ success: false, message: "Invoice not found" });
      await currentInvoice.updateStatus("Paid");
      const currentOrder = await Order.findById(currentInvoice.orderId);
      if (!currentOrder)
        return res
          .status(400)
          .json({ success: false, message: "order not found" });
      await currentOrder.updateStatusPayment(true);
      await currentOrder.updatePaymentMode("Online");
      return res
        .status(200)
        .json({ success: true, message: "payment verified successfully" });
    } else {
      await Invoice.updateStatus("Processing");
      await Order.updatePaymentStatus(false);
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature sent" });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
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
    if (!currentOrder)
      return res
        .status(400)
        .json({ success: false, message: "Order Not Found" });
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
      return res.status(200).json({
        success: true,
        Data: invoice,
        message: "Offline Payment created with invoice successfull  ",
      });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment mode " });
    }
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while creating the order",
    });
  }
};

const cashPayment = async (req, res, next) => {
  const { orderId } = req.body;
  if (!orderId) {
    return res
      .status(400)
      .json({ success: false, message: "Please provide orderId field" });
  }
  try {
    const findOrder = await Order.findById(orderId);
    if (!findOrder) {
      return res
        .status(400)
        .json({ success: false, message: "Order is not found" });
    }
    const invoice = await Invoice.create({
      amount: findOrder.totalAmount,
      currency: "INR",
      orderId,
    });
    await invoice.updateStatus("Pending");
    return res
      .status(200)
      .json({ success: true, Data: invoice, message: "Server Error" });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while creating invoice  order",
    });
  }
};
module.exports = {
  paymentVerify: paymentVerify,
  payment: payment,
  paymentNew: paymentNew,
  cashPayment: cashPayment,
};
