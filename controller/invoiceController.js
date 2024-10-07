const Invoice = require("../models/invoicemodel");

const fetchInvoice = async (req, res) => {
  const { invoiceId } = req.body;
  if (!invoiceId) {
    return res
      .status(400)
      .json({ success: false, message: "please provide the invoiceId" });
  }
  try {
    const findInvoice = await Invoice.findById(invoiceId).populate("orderId");
    if (!findInvoice) {
      return res
        .status(400)
        .json({ success: false, message: "There is no invoice" });
    }
    return res.status(200).json({
      success: true,
      message: "Invoice for Order",
      invoice: findInvoice,
    });
  } catch (error) {
    console.error("Error in fetching the invoice", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

module.exports = fetchInvoice;
