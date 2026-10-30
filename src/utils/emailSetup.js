const path = require("path");
const ejs = require("ejs");
const ENV = require("../config/env");

const sendOtpEmail = async ({ to, otp, purpose }) => {
  const isReset = purpose === "password_reset";
  const subject = isReset ? "Password Reset Code" : "Verify Your Email";
  const message = isReset
    ? "Please use the code below to reset your password:"
    : "Thank you for creating an account with Mama La Hotel and Co. Please use the verification code below:";

  const html = await ejs.renderFile(
    path.join(__dirname, "../views/emails/otpMessage.ejs"),
    {
      title: subject,
      message,
      otp,
      expiresMinutes: ENV.otp_expires_minutes || 10
    }
  );

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": ENV.brevo_api_key,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      sender: {
        name: ENV.brevo_sender_name || "Mama La Hotel and Co",
        email: ENV.brevo_email
      },
      to: [{ email: to }],
      subject,
      htmlContent: html
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Email delivery failed");
  }

  return response.json();
};

module.exports = {
  sendOtpEmail
};
