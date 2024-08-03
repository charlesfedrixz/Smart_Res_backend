const express = require("express");
const app = express();
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

app.use(express.json());
app.use(cors());
app.use(express.static("uploads"));
// app.use(express.static("public"));
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(errorHandle);
// app.use(
//   cors({
//     origin: "https://xzdzwm7n-5173.inc1.devtunnels.ms/",
//     methods: ["GET", "POST"],
//     allowedHeaders: ["my-custom-header"],
//     credentials: true,
//   })
// );
connectDB();

app.use("/api/admin", adminRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/food", foodRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/order", orderRoutes.order);
app.use("/api/pay", payments);

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
    success: true,
    message: "Server of your Smart Restaurant is running...",
  });
});

const port = 1000;
app.listen(port, () => {
  console.log(
    `Server of your Smart Restaurant is running on http://localhost:${port}`
  );
});
