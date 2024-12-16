require('dotenv').config();

const http = require('http');
const express = require('express');
const app = express();
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
// const bodyParser = require('body-parser');

const connectDB = require('./config/db');
const { adminRoutes } = require('./routes/adminRoute');
const { foodRoutes } = require('./routes/foodRoute');
const { customerRoutes } = require('./routes/customerRoute');
const orderRoutes = require('./routes/orderRoutes');
const payments = require('./routes/paymentRoute');
const { categoryRoutes } = require('./routes/categoryRoute');
const invoiceRoute = require('./routes/invoiceRoute');
const {
  updateOrderBySocket,
  updateOrderPaymentBySocket,
} = require('./controller/orderController');
const restaurantRoute = require('./routes/restaurantRoute');
const { checkIfAuthorizedByJWT } = require('./middleware/authenticateJWTToken');
const { errorHandler } = require('./utils/errorHandler');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static('uploads'));

// CORS configuration
app.use(
  cors({
    origin: ['https://localhost:5173'], // Specify allowed origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    // allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

connectDB();

// protected routes with jwt
app.use('/api/admin', adminRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/order', orderRoutes.order);
app.use('/api/pay', payments);
app.use('/api/invoice', invoiceRoute);
app.use('/api/restaurant', restaurantRoute);

// To handle all the errors
app.use(errorHandler);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    secure: true,
  },
  transports: ['websocket', 'polling'],
  secure: true,
});

// Socket.IO event handlers
io.on('connection', (socket) => {
  socket.on('joinRoom', (customerId) => {
    socket.join(customerId);
    console.log(`Customer ${socket.id} joined room ${customerId}`);
    io.to(customerId).emit('test', 'world');
  });

  socket.on('leave room', (customerId) => {
    socket.leave(customerId);
    console.log(`Customer ${customerId} left the room`);
  });

  socket.on('updateOrderStatus', (payload) => {
    const { customerId, newStatus, orderId } = payload;
    console.log(`Payload from admin ${customerId}:${newStatus}:${orderId}`);

    updateOrderBySocket(orderId, newStatus, io);
    io.to(customerId).emit('test', 'orderUpdated');

    console.log('Updated the client at "orderStatusUpdated"');
  });

  socket.on('updatePaymentStatus', (payload) => {
    const { customerId, paid, orderId } = payload;
    console.log(`Payload from admin ${customerId}:${paid}:${orderId}`);

    updateOrderPaymentBySocket(orderId, paid, io);
    io.to(customerId).emit('testStatus', 'orderUpdated for paid');

    console.log('Updated the client at "payment orderStatusUpdated"');
  });

  socket.on('newOrder', () => {
    console.log('neworder');
    io.emit('send', 'newOrder');
  });

  // Handle client disconnection
  socket.on('disconnect', () => {
    console.log('Admin disconnected');
  });
});

// Base route
app.get('/', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Server of your Smart Restaurant is running...',
  });
});

// Port configuration
const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(
    `Server of your Smart Restaurant is running on http://localhost:${PORT}`
  );
});
