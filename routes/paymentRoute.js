const express = require("express");
const {
  payment,
  paymentVerify,
  paymentNew,
} = require("../controller/paymentController");

const payments = express.Router();
payments.post("/newPayment", payment);
// payments.post("/newPayment", paymentNew);
payments.post("/verify", paymentVerify);
payments.post("/new", paymentNew);
module.exports = payments;
