const Invoice = require("../models/invoicemodel");
const sendResponse = require("../middleware/sendResponse");
const AppError = require("../middleware/errorHandler");
const fetchInvoice = async (req, res, next) => {
  const { invoiceId } = req.body;
  if (!invoiceId) {
    return next(new AppError("please provide the invoiceId", 400));
  }
  try {
    const findInvoice = await Invoice.findById(invoiceId).populate("orderId");
    if (!findInvoice) {
      return next(new AppError("There is no invoice", 400));
    }
    return sendResponse(res, true, 200, "Invoice for Order", {
      invoice: findInvoice,
    });
  } catch (error) {
    console.error("Error in fetching the invoice", error);
    return next(new AppError("Server Error", 500));
  }
};

module.exports = fetchInvoice;
