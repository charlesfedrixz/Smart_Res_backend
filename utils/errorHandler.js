class throwError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode || 500; // Default to Internal Server Error if status code is not provided
  }
}
module.exports = throwError;
