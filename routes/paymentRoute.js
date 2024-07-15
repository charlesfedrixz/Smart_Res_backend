const express = require("express");
const { payment, paymentVerify } = require("../controller/paymentController");

const payments = express.Router();
payments.post("/newPayment", payment);
payments.post("/verify", paymentVerify);
module.exports = payments;
