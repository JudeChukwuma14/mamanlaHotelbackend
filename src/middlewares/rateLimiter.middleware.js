const rateLimit = require("express-rate-limit");

const isTest = () => process.env.NODE_ENV === "test";

// General auth endpoint rate limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTest,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes."
  }
});

// Strict limiter for login attempts to prevent brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTest,
  message: {
    success: false,
    message: "Too many login attempts. For security reasons, please try again later."
  }
});

// Limiter for OTP resend requests
const otpResendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTest,
  message: {
    success: false,
    message: "Too many OTP requests. Please wait before requesting another code."
  }
});

// Limiter for registration requests
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTest,
  message: {
    success: false,
    message: "Too many accounts created from this IP, please try again later."
  }
});

module.exports = {
  authLimiter,
  loginLimiter,
  otpResendLimiter,
  registerLimiter
};
