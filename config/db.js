const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const encodedUrl = encodeURI(process.env.MONGODB_URL);
    const conn = await mongoose.connect(encodedUrl, {
      // Modern options for Node.js 18+
      serverSelectionTimeoutMS: 30000, // Increased timeout
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, skip trying IPv6
      ssl: true,
      tls: true,
      tlsAllowInvalidCertificates: true,
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      w: 'majority',
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Listen for connection errors
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      // Log more details about SSL/TLS errors
      if (err.code === 'ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR') {
        console.error('TLS Error Details:', {
          library: err.library,
          reason: err.reason,
          code: err.code,
        });
      }
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      // Attempt to reconnect with same SSL/TLS options
      mongoose
        .connect(process.env.MONGODB_URL, {
          ssl: true,
          tls: true,
          tlsAllowInvalidCertificates: false,
          tlsInsecure: false,
        })
        .catch((err) => {
          console.error('Failed to reconnect:', err);
        });
    });
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    console.log('Error details:', {
      message: error.message,
      code: error.code,
      reason: error.reason,
    });
    // Log connection URL for debugging (remove sensitive info)
    const sanitizedUrl = process.env.MONGODB_URL.replace(/:([^@]+)@/, ':****@');
    console.log('Connection URL:', sanitizedUrl);
    throw error;
  }
};

module.exports = connectDB;
