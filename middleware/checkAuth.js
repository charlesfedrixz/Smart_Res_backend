const jwt = require("jsonwebtoken");
const User = require("../models/adminModel");
const tokenBlacklist = new Set();

const addToBlacklist = (token) => {
  tokenBlacklist.add(token);
};

const isBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

const checkBlacklist = (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];
  if (isBlacklisted(token)) {
    return res
      .status(401)
      .json({ success: false, message: "Token is blacklisted" });
  }
  next();
};

const checkAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (isBlacklisted(token)) {
      return res.status(401).json({ message: "Token is blacklisted" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

const auth = async (req, res) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide token" });
    }
    const decoded = jwt.verify(token, "your_jwt_secret");
    const user = await User.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });

    if (!user) {
      return res
        .status(400)
        .send({ success: false, message: "Please login again" });
    }

    req.token = token;
    req.user = user;
    return res
      .status(200)
      .JSON({ success: true, message: "token verified successfull..." });
  } catch (error) {
    return res.status(401).send({ error: "Please authenticate." });
  }
};

module.exports = { checkAuth, addToBlacklist, checkBlacklist, auth };
