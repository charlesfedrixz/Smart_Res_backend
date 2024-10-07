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
payments.post("/verify", paymentVerify);
payments.post("/new", paymentNew);
payments.post("/cash", cashPayment);
<<<<<<< HEAD
=======
=======
const { payment, paymentVerify } = require("../controller/paymentController");

const payments = express.Router();
payments.post("/newPayment", payment);
payments.post("/verify", paymentVerify);
>>>>>>> 18d00605b33224bc145136653b11b4c19b569080
>>>>>>> a66210d9847ab045370c8d6b6cfd4ef9f93d57a3
module.exports = payments;
