const errorHandler = (err, req, res, next) => {
  // Log error details for debugging
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  // Determine error status code
  const statusCode = res.statusCode || 500;

  // Prepare error response
  const errorResponse = {
    success: false,
    status: statusCode,
    message: err?.message || 'An unexpected error occurred',
  };

  // Add error stack in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = err.details || {};
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    errorResponse.status = 400;
    errorResponse.message = 'Invalid input data';
    errorResponse.errors = Object.values(err.errors).map(
      (error) => error.message
    );
  } else if (err.name === 'JsonWebTokenError') {
    errorResponse.status = 401;
    errorResponse.message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    errorResponse.status = 401;
    errorResponse.message = 'Authentication token expired';
  } else if (err.code === 11000) {
    errorResponse.status = 400;
    errorResponse.message = 'Duplicate field value entered';
  }

  res.status(errorResponse.status).json(errorResponse);
};

module.exports = { errorHandler };
