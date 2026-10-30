const { verifyAccessToken } = require("../utils/token.util");
const User = require("../models/user.model");

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access token is missing or malformed."
      });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          code: "TOKEN_EXPIRED",
          message: "Access token has expired. Please refresh your session."
        });
      }
      return res.status(401).json({
        success: false,
        code: "INVALID_TOKEN",
        message: "Invalid access token."
      });
    }

    const user = await User.findById(decoded.sub).select("-password -refreshToken");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account no longer exists."
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        code: "EMAIL_NOT_VERIFIED",
        message: "Please verify your email address to access this resource."
      });
    }

    req.user = user;
    req.auth = decoded;
    next();
  } catch (error) {
    console.error("[AuthMiddleware Error]:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred while authenticating."
    });
  }
};

module.exports = {
  authenticateToken
};
