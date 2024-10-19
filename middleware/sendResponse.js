function sendResponse(res, success, statusCode, message, data = {}) {
  if (typeof statusCode !== "number" || statusCode < 100 || statusCode > 599) {
    throw new Error("Invalid Status code: " + statusCode);
  }
  return res.status(statusCode).json({
    success: success || false,
    message: message || "",
    data,
  });
}
module.exports = sendResponse;
