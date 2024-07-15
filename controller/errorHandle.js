module.exports = (error, req, res, next) => {
  error.status = error.status || "error";
  if (!error.statusCode) {
    error.statusCode = 500;
  }
  res.status(error.statusCode).json({
    status: error.statusCode,
    message: error.message,
  });
};
