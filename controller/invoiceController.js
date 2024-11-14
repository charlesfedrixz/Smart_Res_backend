const Invoice = require("../models/invoicemodel");
const mongoose = require("mongoose");
const fetchInvoice = async (req, res) => {
  const { orderId } = req.params;
  if (!orderId) {
    return res
      .status(400)
      .json({ success: false, message: "please provide the invoiceId" });
  }
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid orderId format",
    });
  }

  try {
    const findInvoice = await Invoice.findOne({ orderId }).populate({
      path: "orderId",
      populate: [{ path: "customerId" }, { path: "foodItems.foodId" }],
    });
    if (!findInvoice) {
      return res
        .status(400)
        .json({ success: false, message: "There is no invoice" });
    }
    return res.status(200).json({
      success: true,
      invoice: findInvoice,
      message: "Invoice for Order",
    });
  } catch (error) {
    console.error("Error in fetching the invoice", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

const todayInvoice = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const invoices = await Invoice.find({
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    }).populate({
      path: "orderId",
      populate: [{ path: "customerId" }, { path: "foodItems.foodId" }],
      options: { strictPopulate: false },
    });

    if (invoices.length === 0) {
      console.log("No invoices found for today.");
    } else {
      console.log("Found invoices:", invoices);
    }
    const totalAmount = invoices.reduce(
      (total, invoice) => total + invoice.amount,
      0
    );
    return res.status(200).json({
      success: true,
      totalAmount,
      invoices, // Include full invoice details with populated order, customer, and food item details
      message: "Today's invoices with full details",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error in fetching the today invoice.",
      error: error.message,
    });
  }
};
module.exports = { fetchInvoice, todayInvoice };
