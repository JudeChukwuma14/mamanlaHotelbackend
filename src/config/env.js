require("dotenv").config();

const ENV = {
  node_env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT, 10) || 2025,
  mongodb_url:
    process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/mamala_hotel",

  // Brevo (Email Delivery)
  brevo_api_key: process.env.BREVO_API_KEY,
  brevo_email:
    process.env.BREVO_EMAIL ||
    process.env.BREVO_SENDER_EMAIL ||
    "codarinstructor@gmail.com",
  brevo_sender_name: process.env.BREVO_SENDER_NAME || "Mama La Hotel and Co",
  admin_notification_email:
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    process.env.BREVO_EMAIL ||
    "codarinstructor@gmail.com",

  // Cloudinary
  cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY || "",
  cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET || "",

  // Booking Configuration
  booking_expiry_minutes: parseInt(process.env.BOOKING_EXPIRY_MINUTES, 10) || 30,

  // JWT configuration
  jwt_access_secret:
    process.env.JWT_ACCESS_SECRET ||
    "mamala_fallback_access_secret_do_not_use_in_prod",
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  jwt_refresh_secret:
    process.env.JWT_REFRESH_SECRET ||
    "mamala_fallback_refresh_secret_do_not_use_in_prod",
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  refresh_token_expires_days:
    parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS, 10) || 30,

  // OTP configuration
  otp_expires_minutes: parseInt(process.env.OTP_EXPIRES_MINUTES, 10) || 10,
  otp_resend_cooldown_seconds:
    parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS, 10) || 60,
  otp_max_attempts: parseInt(process.env.OTP_MAX_ATTEMPTS, 10) || 5,

  // Frontend & Cookies
  frontend_url: process.env.FRONTEND_URL || "http://localhost:3000",
  cookie_secure:
    process.env.COOKIE_SECURE === "true" ||
    process.env.NODE_ENV === "production",
  cookie_same_site: process.env.COOKIE_SAME_SITE || "lax"
};

module.exports = ENV;
