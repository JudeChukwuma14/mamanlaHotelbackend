const cron = require("node-cron");
const Booking = require("../models/booking.model");

const runExpirePendingBookings = async () => {
  try {
    const now = new Date();
    const expiredBookings = await Booking.find({
      status: "pending",
      expiresAt: { $lte: now }
    });

    if (expiredBookings.length > 0) {
      console.log(`[Expiry Job] Found ${expiredBookings.length} expired pending reservation(s).`);

      for (const booking of expiredBookings) {
        booking.status = "cancelled";
        booking.cancelledAt = now;
        booking.cancellationReason = "Reservation automatically expired: time limit exceeded without confirmation.";
        booking.assignedRooms = [];
        await booking.save();
        console.log(`[Expiry Job] Expired booking reference: ${booking.bookingReference}`);
      }
    }
  } catch (error) {
    console.error("[Expiry Job Error]:", error.message);
  }
};

const startExpiryCronJob = () => {
  // Run every 5 minutes
  cron.schedule("*/5 * * * *", () => {
    runExpirePendingBookings();
  });
  console.log("[Expiry Job] Cron job registered: checking expired pending bookings every 5 minutes.");
};

module.exports = {
  runExpirePendingBookings,
  startExpiryCronJob
};

