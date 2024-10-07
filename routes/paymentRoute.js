const express = require("express");
<<<<<<< HEAD
const {
  payment,
  paymentVerify,
  paymentNew,
  cashPayment,
} = require("../controller/paymentController");

const payments = express.Router();
payments.post("/newPayment", payment);
// payments.post("/newPayment", paymentNew);
payments.post("/verify", paymentVerify);
payments.post("/new", paymentNew);
payments.post("/cash", cashPayment);
=======
const { payment, paymentVerify } = require("../controller/paymentController");

const payments = express.Router();
payments.post("/newPayment", payment);
payments.post("/verify", paymentVerify);
>>>>>>> 18d00605b33224bc145136653b11b4c19b569080
module.exports = payments;
