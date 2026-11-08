const Notification = require("../models/notification.model");
const { sendEmail } = require("./email.service");

const createNotification = async ({
  type,
  recipient,
  subject,
  htmlContent,
  bookingReference
}) => {
  return Notification.create({
    type,
    recipient,
    subject,
    htmlContent,
    bookingReference,
    status: "pending"
  });
};

const processNotifications = async () => {
  const pendingNotifications = await Notification.find({
    status: "pending",
    retries: { $lt: 3 }
  }).limit(20);

  for (const item of pendingNotifications) {
    try {
      await sendEmail(item.recipient, item.subject, item.htmlContent);
      item.status = "sent";
      item.sentAt = new Date();
      await item.save();
    } catch (error) {
      item.retries += 1;
      item.lastError = error.message;
      if (item.retries >= item.maxRetries) {
        item.status = "failed";
      }
      await item.save();
    }
  }
};

const getNotificationsByBooking = async (bookingReference) => {
  return Notification.find({ bookingReference }).sort({ createdAt: -1 });
};

module.exports = {
  createNotification,
  processNotifications,
  getNotificationsByBooking
};

