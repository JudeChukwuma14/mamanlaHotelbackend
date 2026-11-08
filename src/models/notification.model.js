const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "booking_confirmation",
        "admin_booking_alert",
        "booking_status_update",
        "booking_cancellation",
        "booking_reminder"
      ]
    },
    recipient: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    htmlContent: {
      type: String,
      required: true
    },
    bookingReference: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending"
    },
    retries: {
      type: Number,
      default: 0
    },
    maxRetries: {
      type: Number,
      default: 3
    },
    lastError: {
      type: String
    },
    sentAt: {
      type: Date
    }
  },
  { timestamps: true }
);

notificationSchema.index({ status: 1, retries: 1 });
notificationSchema.index({ bookingReference: 1 });

module.exports = mongoose.model("Notification", notificationSchema);

