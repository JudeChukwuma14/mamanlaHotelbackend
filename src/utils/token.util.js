const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const ENV = require("../config/env");

// Generate a short-lived JWT access token
const generateAccessToken = (payload) => {
  return jwt.sign(payload, ENV.jwt_access_secret, {
    expiresIn: ENV.jwt_access_expires_in
  });
};

// Verify a JWT access token
const verifyAccessToken = (token) => {
  return jwt.verify(token, ENV.jwt_access_secret);
};

// Generate a cryptographically secure random refresh token string
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString("hex");
};

// Hash a token using SHA-256 for secure storage
const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

module.exports = {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashToken
};
