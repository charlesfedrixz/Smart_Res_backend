const express = require("express");
const fetchInvoice = require("../controller/invoiceController");

const invoiceRoute = express.Router();
invoiceRoute.post("/get", fetchInvoice);

module.exports = invoiceRoute;
