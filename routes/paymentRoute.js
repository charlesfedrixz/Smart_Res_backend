const express = require("express");
const {
  payment,
  paymentVerify,
  paymentNew,
  cashPayment,
} = require("../controller/paymentController");

const payments = express.Router();
payments.post("/newPayment", payment);
payments.post("/verify", paymentVerify);
payments.post("/new", paymentNew);
payments.post("/cash", cashPayment);
module.exports = payments;
