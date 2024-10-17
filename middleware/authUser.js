const jwt = require("jsonwebtoken");

// const getUserData = (headers) => {
//   // Extract the token from the Authorization header
//   const token = headers?.authorization?.split(" ")[1];
//   console.log("Received token:", token);
//   if (!token) {
//     return {
//       success: false,
//       message: "No token provided",
//       userId: null,
//       token: null,
//     };
//   }

//   try {
//     console.log("Verifying token...");

//     // Verify the token and get the payload
//     const verifiedToken = jwt.verify(token, process.env.JWT_SECRET);
//     console.log("Token verified:", verifiedToken);

//     // Return success with the user's ID
//     return {
//       success: true,
//       message: "Token verified successfully",
//       userId: verifiedToken.id, // Assuming the user ID is stored as 'id'
//     };
//   } catch (error) {
//     console.error("Error verifying token:", error); // Log the full error object

//     if (error.name === "TokenExpiredError") {
//       return {
//         success: false,
//         message: "Token expired",
//         userId: null,
//       };
//     }

//     if (error.name === "JsonWebTokenError") {
//       return {
//         success: false,
//         message: "Invalid token",
//         userId: null,
//       };
//     }

//     // For other unexpected errors
//     return {
//       success: false,
//       message: "Server error during token processing",
//       userId: null,
//       error: error.message,
//     };
//   }
// };

// module.exports = getUserData;

const getUserData = (headers) => {
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

// const authMiddleware = async (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader) {
//     return res.status(401).json({
//       success: false,
//       message: "Unauthorized: Token not provided",
//     });
//   }
//   const token = authHeader.split(" ")[1];
//   if (!token) {
//     return res.status(401).json({
//       success: false,
//       message: "Unauthorized: Token format invalid",
//     });
//   }
//   try {
//     const verifiedToken = jwt.verify(token, process.env.JWT_SECRET);
//     if (!verifiedToken)
//       return {
//         userId: null,
//       };
//     req.body.userId = verifiedToken.id;
//     next();
//   } catch (error) {
//     if (error.name === "TokenExpiredError") {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized: Token expired",
//       });
//     }
//     if (error.name === "JsonWebTokenError") {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized: Invalid token",
//       });
//     }
//     // For other errors, log the error and return a generic error message
//     console.error(error);
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };

// module.exports = authMiddleware;
