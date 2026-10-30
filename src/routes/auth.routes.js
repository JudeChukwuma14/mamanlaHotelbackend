const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");
const { validateBody } = require("../middlewares/validation.middleware");
const {
  authLimiter,
  loginLimiter,
  otpResendLimiter,
  registerLimiter,
} = require("../middlewares/rateLimiter.middleware");

// 1. User Registration
router.post(
  "/register",
  registerLimiter,
  validateBody("register"),
  authController.register,
);

// 2. Email Verification via OTP
router.post(
  "/verify-email",
  authLimiter,
  validateBody("verifyEmail"),
  authController.verifyEmail,
);

// 3. Resend OTP
router.post(
  "/resend-otp",
  otpResendLimiter,
  validateBody("resendOtp"),
  authController.resendOtp,
);

// 4. User Login
router.post(
  "/login",
  loginLimiter,
  validateBody("login"),
  authController.login,
);

// 5. Access Token Refresh (via HttpOnly Cookie with rotation)
router.post("/refresh", authController.refresh);

// 6. Logout (Current Session)
router.post("/logout", authController.logout);

// 7. Logout All Devices / Sessions
router.post("/logout-all", authenticateToken, authController.logoutAll);

// 8. Forgot Password
router.post(
  "/forgot-password",
  authLimiter,
  validateBody("forgotPassword"),
  authController.forgotPassword,
);

// 9. Reset Password
router.post(
  "/reset-password",
  authLimiter,
  validateBody("resetPassword"),
  authController.resetPassword,
);

// 10. Get Current Authenticated User
router.get("/me", authenticateToken, authController.getMe);

module.exports = router;
