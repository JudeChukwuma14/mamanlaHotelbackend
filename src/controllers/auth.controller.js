const bcrypt = require("bcrypt");
const User = require("../models/user.model");
const { generateOtp } = require("../utils/otp.util");
const {
  generateAccessToken,
  generateRefreshToken,
  hashToken
} = require("../utils/token.util");
const { sendOtpEmail } = require("../utils/emailSetup");
const ENV = require("../config/env");

const getRefreshTokenCookieOptions = () => ({
  httpOnly: true,
  secure: ENV.cookie_secure,
  sameSite: ENV.cookie_same_site,
  maxAge: ENV.refresh_token_expires_days * 24 * 60 * 60 * 1000,
  path: "/auth"
});

// 1. User Registration
const register = async (req, res) => {
  try {
    const { email, password, userName, phoneNumber } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(409).json({
          success: false,
          message: "An account with this email address is already registered."
        });
      }

      // Hash password directly
      const hashPassword = await bcrypt.hash(password, 10);
      existingUser.password = hashPassword;
      if (userName) existingUser.userName = userName;
      if (phoneNumber) existingUser.phoneNumber = phoneNumber;

      const plainOtp = generateOtp();
      existingUser.otp = plainOtp;
      existingUser.otpExpiresAt = new Date(Date.now() + ENV.otp_expires_minutes * 60 * 1000);
      await existingUser.save();

      await sendOtpEmail({
        to: existingUser.email,
        otp: plainOtp,
        purpose: "email_verification"
      });

      return res.status(200).json({
        success: true,
        message: "An unverified account already exists. A new verification code has been sent to your email.",
        email: existingUser.email
      });
    }

    // Hash password directly
    const hashPassword = await bcrypt.hash(password, 10);
    const plainOtp = generateOtp();

    const user = await User.create({
      userName: userName || email.split("@")[0],
      email,
      phoneNumber,
      password: hashPassword,
      otp: plainOtp,
      otpExpiresAt: new Date(Date.now() + ENV.otp_expires_minutes * 60 * 1000),
      isVerified: false
    });

    await sendOtpEmail({
      to: user.email,
      otp: plainOtp,
      purpose: "email_verification"
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email with the OTP sent to your inbox.",
      email: user.email
    });
  } catch (error) {
    console.error("[Register Error]:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Registration failed."
    });
  }
};

// 2. Email Verification Using OTP
const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification request."
      });
    }

    if (user.isVerified) {
      return res.status(200).json({
        success: true,
        message: "Email is already verified. You can now log in."
      });
    }

    if (!user.otp || !user.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: "No active verification code found. Please request a new code."
      });
    }

    if (new Date() > user.otpExpiresAt) {
      user.otp = undefined;
      user.otpExpiresAt = undefined;
      await user.save();
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new code."
      });
    }

    if (user.otp.toUpperCase() !== String(otp).trim().toUpperCase()) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code."
      });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now log in."
    });
  } catch (error) {
    console.error("[VerifyEmail Error]:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Email verification failed."
    });
  }
};

// 3. Resend OTP
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account exists, a new verification code has been sent."
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email address is already verified."
      });
    }

    if (user.otpExpiresAt) {
      const cooldownSeconds = parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS, 10) || ENV.otp_resend_cooldown_seconds;
      const totalLifetimeSeconds = ENV.otp_expires_minutes * 60;
      const elapsedSeconds = totalLifetimeSeconds - ((new Date(user.otpExpiresAt).getTime() - Date.now()) / 1000);

      if (elapsedSeconds < cooldownSeconds && elapsedSeconds >= 0) {
        const remainingSeconds = Math.ceil(cooldownSeconds - elapsedSeconds);
        return res.status(429).json({
          success: false,
          message: `Please wait ${remainingSeconds} seconds before requesting a new code.`
        });
      }
    }

    const plainOtp = generateOtp();
    user.otp = plainOtp;
    user.otpExpiresAt = new Date(Date.now() + ENV.otp_expires_minutes * 60 * 1000);
    await user.save();

    await sendOtpEmail({
      to: user.email,
      otp: plainOtp,
      purpose: "email_verification"
    });

    return res.status(200).json({
      success: true,
      message: "A new verification code has been sent to your email."
    });
  } catch (error) {
    console.error("[ResendOtp Error]:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to resend code."
    });
  }
};

// 4. User Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    // Compare password directly with bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        code: "EMAIL_NOT_VERIFIED",
        message: "Please verify your email address before logging in.",
        isVerified: false,
        email: user.email
      });
    }

    const rawRefreshToken = generateRefreshToken();
    const refreshTokenHash = hashToken(rawRefreshToken);

    user.refreshToken = refreshTokenHash;
    await user.save();

    const accessToken = generateAccessToken({
      sub: user._id.toString(),
      email: user.email,
      role: user.role
    });

    res.cookie("refreshToken", rawRefreshToken, getRefreshTokenCookieOptions());

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        userName: user.userName,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error("[Login Error]:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Login failed."
    });
  }
};

// 5. Refresh Token & Rotation
const refresh = async (req, res) => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!rawRefreshToken) {
      return res.status(401).json({
        success: false,
        code: "NO_REFRESH_TOKEN",
        message: "Refresh token is missing. Please sign in."
      });
    }

    const hashedToken = hashToken(rawRefreshToken);
    const user = await User.findOne({ refreshToken: hashedToken });

    if (!user) {
      res.clearCookie("refreshToken", getRefreshTokenCookieOptions());
      return res.status(401).json({
        success: false,
        code: "INVALID_REFRESH_TOKEN",
        message: "Invalid or expired refresh token. Please sign in."
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: "User account is unverified."
      });
    }

    const newRawRefreshToken = generateRefreshToken();
    const newRefreshTokenHash = hashToken(newRawRefreshToken);

    user.refreshToken = newRefreshTokenHash;
    await user.save();

    const accessToken = generateAccessToken({
      sub: user._id.toString(),
      email: user.email,
      role: user.role
    });

    res.cookie("refreshToken", newRawRefreshToken, getRefreshTokenCookieOptions());

    return res.status(200).json({
      success: true,
      accessToken
    });
  } catch (error) {
    console.error("[Refresh Error]:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Token refresh failed."
    });
  }
};

// 6. Logout Current Session
const logout = async (req, res) => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (rawRefreshToken) {
      const hashedToken = hashToken(rawRefreshToken);
      await User.findOneAndUpdate({ refreshToken: hashedToken }, { refreshToken: null });
    }

    res.clearCookie("refreshToken", getRefreshTokenCookieOptions());

    return res.status(200).json({
      success: true,
      message: "Logged out successfully."
    });
  } catch (error) {
    console.error("[Logout Error]:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Logout failed."
    });
  }
};

// 7. Logout All Devices / Sessions
const logoutAll = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    res.clearCookie("refreshToken", getRefreshTokenCookieOptions());

    return res.status(200).json({
      success: true,
      message: "All sessions have been revoked successfully."
    });
  } catch (error) {
    console.error("[LogoutAll Error]:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to revoke sessions."
    });
  }
};

// 8. Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (user) {
      const plainOtp = generateOtp();
      user.otp = plainOtp;
      user.otpExpiresAt = new Date(Date.now() + ENV.otp_expires_minutes * 60 * 1000);
      await user.save();

      await sendOtpEmail({
        to: user.email,
        otp: plainOtp,
        purpose: "password_reset"
      });
    }

    return res.status(200).json({
      success: true,
      message: "If an account with that email exists, a password reset code has been sent."
    });
  } catch (error) {
    console.error("[ForgotPassword Error]:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process password recovery request."
    });
  }
};

// 9. Reset Password
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid password reset request."
      });
    }

    if (!user.otp || !user.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: "No active password reset request found. Please request a new code."
      });
    }

    if (new Date() > user.otpExpiresAt) {
      user.otp = undefined;
      user.otpExpiresAt = undefined;
      await user.save();
      return res.status(400).json({
        success: false,
        message: "Password reset code has expired. Please request a new code."
      });
    }

    if (user.otp.toUpperCase() !== String(otp).trim().toUpperCase()) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code."
      });
    }

    // Hash new password directly
    const hashPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashPassword;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    user.refreshToken = undefined;
    user.isVerified = true;
    await user.save();

    res.clearCookie("refreshToken", getRefreshTokenCookieOptions());

    return res.status(200).json({
      success: true,
      message: "Password reset successful. Please sign in with your new password."
    });
  } catch (error) {
    console.error("[ResetPassword Error]:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Password reset failed."
    });
  }
};

// 10. Get Current Authenticated User Profile
const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      email: req.user.email,
      userName: req.user.userName,
      phoneNumber: req.user.phoneNumber,
      role: req.user.role,
      isVerified: req.user.isVerified,
      createdAt: req.user.createdAt
    }
  });
};

module.exports = {
  register,
  verifyEmail,
  resendOtp,
  login,
  refresh,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  getMe
};
