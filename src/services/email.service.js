const path = require("path");
const ejs = require("ejs");
const ENV = require("../config/env");

const sendEmail = async (to, subject, html) => {
  if (process.env.NODE_ENV === "test" || process.env.MOCK_EMAIL === "true") {
    console.log(`[EmailService MOCK] To: ${to} | Subject: ${subject}`);
    return { messageId: `mock-${Date.now()}` };
  }

  if (!ENV.brevo_api_key) {
    console.warn("[EmailService] BREVO_API_KEY is missing. Email skipped.");
    return { skipped: true };
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": ENV.brevo_api_key,
      "Content-Type": "application/json",
      Accept: "application/json"
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
    const message = errorData.message || response.statusText || "Failed to send email via Brevo";
    console.error(`[EmailService Error]: ${message}`);
    throw new Error(message);
  }

  return response.json();
};

const sendBookingConfirmationEmail = async ({
  to,
  guestName,
  bookingReference,
  roomName,
  checkIn,
  checkOut,
  numberOfRooms,
  numberOfNights,
  totalAmount
}) => {
  const subject = `Booking Confirmation - ${bookingReference} | Mama La Hotel & Co`;
  const templatePath = path.join(__dirname, "../views/emails/bookingConfirmation.ejs");

  const formattedCheckIn = new Date(checkIn).toDateString();
  const formattedCheckOut = new Date(checkOut).toDateString();

  const html = await ejs.renderFile(templatePath, {
    guestName,
    bookingReference,
    roomName,
    checkIn: formattedCheckIn,
    checkOut: formattedCheckOut,
    numberOfRooms,
    numberOfNights,
    totalAmount
  });

  return sendEmail(to, subject, html);
};

const sendAdminBookingNotificationEmail = async ({
  bookingReference,
  guestName,
  guestEmail,
  roomName,
  checkIn,
  checkOut,
  numberOfRooms,
  totalAmount
}) => {
  const adminEmail = ENV.admin_notification_email || ENV.brevo_email;
  const subject = `[New Booking] ${bookingReference} - ${guestName} (${roomName})`;
  const templatePath = path.join(__dirname, "../views/emails/adminBookingNotification.ejs");

  const formattedCheckIn = new Date(checkIn).toDateString();
  const formattedCheckOut = new Date(checkOut).toDateString();

  const html = await ejs.renderFile(templatePath, {
    bookingReference,
    guestName,
    guestEmail,
    roomName,
    checkIn: formattedCheckIn,
    checkOut: formattedCheckOut,
    numberOfRooms,
    totalAmount
  });

  return sendEmail(adminEmail, subject, html);
};

const sendBookingStatusUpdateEmail = async ({
  to,
  guestName,
  bookingReference,
  roomName,
  status,
  reason = null
}) => {
  const subject = `Reservation Update: ${bookingReference} is now ${status.toUpperCase()}`;
  const templatePath = path.join(__dirname, "../views/emails/bookingStatusUpdate.ejs");

  const html = await ejs.renderFile(templatePath, {
    guestName,
    bookingReference,
    roomName,
    status,
    reason
  });

  return sendEmail(to, subject, html);
};

module.exports = {
  sendEmail,
  sendBookingConfirmationEmail,
  sendAdminBookingNotificationEmail,
  sendBookingStatusUpdateEmail
};

