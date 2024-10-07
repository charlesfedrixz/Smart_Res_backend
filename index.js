<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> a66210d9847ab045370c8d6b6cfd4ef9f93d57a3
//create a server
const http = require("http");
const { Server } = require("socket.io");

const express = require("express");
const app = express();
// socket
<<<<<<< HEAD
=======
=======
const express = require("express");
const app = express();
>>>>>>> 18d00605b33224bc145136653b11b4c19b569080
>>>>>>> a66210d9847ab045370c8d6b6cfd4ef9f93d57a3
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const bodyParser = require("body-parser");
require("dotenv").config();

const { adminRoutes } = require("./routes/adminRoute");
const { foodRoutes } = require("./routes/foodRoute");
const { customerRoutes } = require("./routes/customerRoute");
const orderRoutes = require("./routes/orderRoutes");
const payments = require("./routes/paymentRoute");
const errorHandle = require("./controller/errorHandle");
const { categoryRoutes } = require("./routes/categoryRoute");
<<<<<<< HEAD
const {
  updateOrderBySocket,
  updateOrderPaymentBySocket,
} = require("./controller/orderController");
const invoiceRoute = require("./routes/invoiceRoute");

app.use(express.json());
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
=======

app.use(express.json());
app.use(cors());
>>>>>>> 18d00605b33224bc145136653b11b4c19b569080
app.use(express.static("uploads"));
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(errorHandle);
<<<<<<< HEAD
=======
// app.use(
//   cors({
<<<<<<< HEAD
//     origin: "*",
=======
//     origin: "https://xzdzwm7n-5173.inc1.devtunnels.ms/",
//     methods: ["GET", "POST"],
>>>>>>> 18d00605b33224bc145136653b11b4c19b569080
//     allowedHeaders: ["my-custom-header"],
//     credentials: true,
//   })
// );
>>>>>>> a66210d9847ab045370c8d6b6cfd4ef9f93d57a3
connectDB();

app.use("/api/admin", adminRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/food", foodRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/order", orderRoutes.order);
app.use("/api/pay", payments);
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> a66210d9847ab045370c8d6b6cfd4ef9f93d57a3
app.use("/api/invoice", invoiceRoute);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", //Admin side server
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});
//Handle socket connections
io.on("connection", (socket) => {
  socket.on("joinRoom", (customerId) => {
    socket.join(customerId);
    console.log(`Customer ${socket.id} joined room ${customerId}`);
    io.to(customerId).emit("test", "world");
    // console.log(" connected", socket.id);

    // socket.broadcast.emit(customerId);
  });
  //leave channel
  socket.on("leave room", (customerId) => {
    socket.leave(customerId);
    console.log(`Customer ${customerId} left the room`);
  });

  // listening from the admin if the order status like preparing, ready has been updated
  socket.on("updateOrderStatus", (payload) => {
    console.log(
      `Payload from admin ${payload.customerId}:${payload.newStatus}:${payload.orderId}`
    );
    updateOrderBySocket(payload?.orderId, payload?.newStatus, io);

    // alerting the client
    io.to(payload?.customerId).emit("test", "orderUpdated");

    console.log('Updated the client at "orderStatusUpdated"');
  });
  // listening from the admin if the payment order status like preparing, ready has been updated
  socket.on("updatePaymentStatus", (payload) => {
    console.log(
      `Payload from admin ${payload.customerId}:${payload.paid}:${payload.orderId}`
    );
    updateOrderPaymentBySocket(payload?.orderId, payload?.paid, io);

    // alerting the client
    io.to(payload?.customerId).emit("testStatus", "orderUpdated for paid");

    console.log('Updated the client at " payment orderStatusUpdated"');
  });

  socket.on("newOrder", () => {
    console.log("neworder");
    io.emit("send", "newOrder");
  });

  // socket.on("updateOrderStatus", (payload) => {
  //   console.log("🚀 ~ socket.on ~ payload:", payload);
  //   updateOrderBySocket(payload?.orderId, payload?.newStatus, io);
  // });
  // socket.on("updatePaymentStatus", (payload) => {
  //   console.log("🚀 ~ socket.on ~ payload:", payload);
  //   updateOrderPaymentBySocket(payload?.orderId, payload.paid, io);
  // });

  // Handle client disconnection
  socket.on("disconnect", () => {
    console.log("Admin disconnected");
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
<<<<<<< HEAD
=======
=======

//create a server
// const http = require("http");
// const server = http.createServer(app);
// const { Server } = require("socket.io");

// const io = new Server(server, {
//   cors: {
//     origin: "https://xzdzwm7n-5173.inc1.devtunnels.ms/", //client side server
//     methods: ["GET", "POST"],
//     allowedHeaders: ["my-custom-header"],
//     credentials: true,
//   },
// });
// //Handle socket connections
// io.on("connection", (socket) => {
//   socket.emit("hello", "world");
//   console.log("what is connection", socket);
//   console.log("customer connected");

//   socket.on("chat", (playload) => {
//     console.log("what is playload", playload);
//     io.emit("chat", playload);
//   });
//   // Handle client disconnection
//   socket.on("disconnect", () => {
//     console.log("customer disconnected");
//   });
// });

app.get("/", (req, res) => {
  return res.status(200).json({
>>>>>>> 18d00605b33224bc145136653b11b4c19b569080
>>>>>>> a66210d9847ab045370c8d6b6cfd4ef9f93d57a3
    success: true,
    message: "Server of your Smart Restaurant is running...",
  });
});

const port = 1000;
<<<<<<< HEAD
server.listen(port, () => {
=======
app.listen(port, () => {
>>>>>>> 18d00605b33224bc145136653b11b4c19b569080
  console.log(
    `Server of your Smart Restaurant is running on http://localhost:${port}`
  );
});
