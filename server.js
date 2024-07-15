const express = require("express");
const app = express();
const cors = require("cors");
app.use(express.json());
app.use(cors());

//create a server

const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "https://xzdzwm7n-5173.inc1.devtunnels.ms/", //client side server
    methods: ["GET", "POST"],
  },
});
console.log("object");
// Handle socket connections
io.on("connection", (socket) => {
  socket.emit("hello", "world");
  console.log("what is connection", socket);
  console.log("customer connected");

  socket.on("chat", (playload) => {
    console.log("what is playload", playload);
    io.emit("chat", playload);
  });
  // Handle client disconnection
  socket.on("disconnect", () => {
    console.log("customer disconnected");
  });
});
