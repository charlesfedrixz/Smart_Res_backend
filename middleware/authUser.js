const jwt = require("jsonwebtoken");

const getUserData = (headers) => {
  // Check if the authorization header exists
  if (!headers || !headers.authorization) {
    return {
      success: false,
      message: "Authorization header missing",
      userId: null,
      token: null,
    };
  }
  const token = headers?.authorization?.split(" ")[1];

  if (!token) {
    return {
      success: false,
      message: "Invalid token in split",
      userId: null,
      token: null,
    };
  }
  try {
    const decodedToken = jwt.decode(token, { complete: true });
    if (!decodedToken) {
      return {
        success: false,
        message: "Invalid Token in decode",
        userId: null,
      };
    }
    const currentTime = Math.floor(Date.now() / 1000);
    if (decodedToken.payload.exp && currentTime > decodedToken.payload.exp) {
      return {
        success: false,
        message: "Token Expired",
        userId: null,
      };
    }
    const verifiedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!verifiedToken) {
      return {
        success: false,
        message: "Invalid Token in verify",
        userId: null,
      };
    }
    return {
      success: true,
      message: "Token verified successfully",
      userId: verifiedToken.id,
    };
  } catch (error) {
    return {
      success: false,
      message: "Server Error",
      userId: null,
      error,
    };
  }
};
module.exports = getUserData;
