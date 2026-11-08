const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/booking.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");
const { validateBody } = require("../middlewares/validation.middleware");

// All booking operations require an authenticated user
router.use(authenticateToken);

// 1. Create a new reservation
router.post("/", validateBody("createBooking"), bookingController.createBooking);

// 2. Customer: Get my reservations
router.get("/my-bookings", bookingController.getMyBookings);

// 3. Customer or Admin: Get reservation by booking reference
router.get("/:bookingReference", bookingController.getBookingByReference);

// 4. Customer: Cancel reservation
router.post("/:bookingReference/cancel", bookingController.cancelBooking);

module.exports = router;

