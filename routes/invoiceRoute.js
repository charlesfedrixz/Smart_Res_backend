const express = require("express");
const {
  fetchInvoice,
  todayInvoice,
} = require("../controller/invoiceController");

const invoiceRoute = express.Router();
invoiceRoute.get("/get/:orderId", fetchInvoice);
invoiceRoute.get("/todayInvoice", todayInvoice);

module.exports = invoiceRoute;
