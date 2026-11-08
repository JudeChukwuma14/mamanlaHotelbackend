const Room = require("../models/room.model");
const Booking = require("../models/booking.model");
const { getAvailableRoomCount, getAvailablePhysicalRooms } = require("../services/availability.service");
const { generateBookingReference } = require("../utils/generateBookingReference");
const { calculateBookingPrice } = require("../utils/calculateBookingPrice");
const { parseDate, calculateNights, isDateInPast, isValidDateRange } = require("../utils/dateValidation");
const {
  sendBookingConfirmationEmail,
  sendAdminBookingNotificationEmail,
  sendBookingStatusUpdateEmail
} = require("../services/email.service");
const { createNotification } = require("../services/notification.service");
const ENV = require("../config/env");

// 1. Create a New Booking
const createBooking = async (req, res) => {
  try {
    const {
      roomTypeId,
      checkInDate,
      checkOutDate,
      numberOfRooms = 1,
      adults,
      children = 0,
      fullName,
      email,
      phone,
      specialRequests
    } = req.body;

    // Date validations
    const parsedCheckIn = parseDate(checkInDate);
    const parsedCheckOut = parseDate(checkOutDate);

    if (!parsedCheckIn || !parsedCheckOut) {
      return res.status(400).json({
        success: false,
        message: "Invalid check-in or check-out date format."
      });
    }

    if (isDateInPast(parsedCheckIn)) {
      return res.status(400).json({
        success: false,
        message: "Check-in date cannot be in the past."
      });
    }

    if (!isValidDateRange(parsedCheckIn, parsedCheckOut)) {
      return res.status(400).json({
        success: false,
        message: "Check-out date must be strictly after the check-in date."
      });
    }

    const numberOfNights = calculateNights(parsedCheckIn, parsedCheckOut);
    if (numberOfNights < 1) {
      return res.status(400).json({
        success: false,
        message: "A reservation must be for at least 1 night."
      });
    }

    // Verify room category exists
    const room = await Room.findById(roomTypeId);
    if (!room || room.status !== "active") {
      return res.status(404).json({
        success: false,
        message: "The requested room category does not exist or is currently inactive."
      });
    }

    // Capacity validation per room
    const requestedRoomsCount = Number(numberOfRooms) || 1;
    const maxAllowedAdults = room.maximumAdults * requestedRoomsCount;
    const maxAllowedChildren = room.maximumChildren * requestedRoomsCount;

    if (Number(adults) > maxAllowedAdults) {
      return res.status(400).json({
        success: false,
        message: `Capacity exceeded: ${requestedRoomsCount} ${room.name} room(s) can accommodate at most ${maxAllowedAdults} adults.`
      });
    }

    if (Number(children) > maxAllowedChildren) {
      return res.status(400).json({
        success: false,
        message: `Capacity exceeded: ${requestedRoomsCount} ${room.name} room(s) can accommodate at most ${maxAllowedChildren} children.`
      });
    }

    // Check date-based availability
    const { availableCount } = await getAvailableRoomCount(
      room._id,
      parsedCheckIn,
      parsedCheckOut
    );

    if (availableCount < requestedRoomsCount) {
      return res.status(409).json({
        success: false,
        message: `Insufficient availability for the selected dates. Only ${availableCount} room(s) remaining for this category.`
      });
    }

    // Calculate official pricing on backend
    const pricing = calculateBookingPrice({
      pricePerNight: room.pricePerNight,
      numberOfRooms: requestedRoomsCount,
      numberOfNights
    });

    // Auto-allocate physical rooms if physical inventory exists
    const physicalRooms = await getAvailablePhysicalRooms(
      room._id,
      parsedCheckIn,
      parsedCheckOut,
      requestedRoomsCount
    );
    const assignedRooms = physicalRooms.map((r) => r._id);

    // Generate unique reference & expiry
    const bookingReference = generateBookingReference();
    const expiryMinutes = ENV.booking_expiry_minutes || 30;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    const booking = await Booking.create({
      bookingReference,
      user: req.user._id,
      roomType: room._id,
      assignedRooms,
      numberOfRooms: requestedRoomsCount,
      checkInDate: parsedCheckIn,
      checkOutDate: parsedCheckOut,
      numberOfNights,
      guests: {
        adults: Number(adults),
        children: Number(children)
      },
      guestDetails: {
        fullName,
        email: email.toLowerCase(),
        phone
      },
      pricing,
      specialRequests,
      status: "pending",
      expiresAt
    });

    // Send notifications in background (do not block client response)
    (async () => {
      try {
        await sendBookingConfirmationEmail({
          to: email,
          guestName: fullName,
          bookingReference,
          roomName: room.name,
          checkIn: parsedCheckIn,
          checkOut: parsedCheckOut,
          numberOfRooms: requestedRoomsCount,
          numberOfNights,
          totalAmount: pricing.totalAmount
        });

        await sendAdminBookingNotificationEmail({
          bookingReference,
          guestName: fullName,
          guestEmail: email,
          roomName: room.name,
          checkIn: parsedCheckIn,
          checkOut: parsedCheckOut,
          numberOfRooms: requestedRoomsCount,
          totalAmount: pricing.totalAmount
        });

        // Record in notification outbox
        await createNotification({
          type: "booking_confirmation",
          recipient: email,
          subject: `Booking Confirmation - ${bookingReference}`,
          htmlContent: `Booking confirmed for ${room.name}`,
          bookingReference
        });
      } catch (emailErr) {
        console.error("[Booking Email Delivery Error]:", emailErr.message);
      }
    })();

    return res.status(201).json({
      success: true,
      message: "Reservation successfully created.",
      booking: {
        id: booking._id,
        bookingReference: booking.bookingReference,
        roomType: {
          id: room._id,
          name: room.name,
          category: room.category
        },
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        numberOfRooms: booking.numberOfRooms,
        numberOfNights: booking.numberOfNights,
        pricing: booking.pricing,
        guests: booking.guests,
        guestDetails: booking.guestDetails,
        status: booking.status,
        expiresAt: booking.expiresAt,
        createdAt: booking.createdAt
      }
    });
  } catch (error) {
    console.error("[CreateBooking Error]:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create reservation."
    });
  }
};

// 2. Customer: Get My Bookings
const getMyBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { user: req.user._id };
    if (status) query.status = status;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [bookings, totalCount] = await Promise.all([
      Booking.find(query)
        .populate("roomType", "name category pricePerNight images")
        .populate("assignedRooms", "roomNumber floor")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Booking.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum),
      totalCount,
      bookings
    });
  } catch (error) {
    console.error("[GetMyBookings Error]:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve your reservations."
    });
  }
};

// 3. Customer or Admin: Get Booking Details by Reference
const getBookingByReference = async (req, res) => {
  try {
    const { bookingReference } = req.params;

    const booking = await Booking.findOne({
      bookingReference: String(bookingReference).trim().toUpperCase()
    })
      .populate("roomType", "name category pricePerNight images cancellationPolicy checkInTime checkOutTime")
      .populate("assignedRooms", "roomNumber floor");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No reservation found with reference '${bookingReference}'.`
      });
    }

    // Restrict access: must be booking owner or admin
    const isOwner = booking.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this reservation."
      });
    }

    return res.status(200).json({
      success: true,
      booking
    });
  } catch (error) {
    console.error("[GetBookingByReference Error]:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve reservation details."
    });
  }
};

// 4. Customer: Cancel Booking
const cancelBooking = async (req, res) => {
  try {
    const { bookingReference } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findOne({
      bookingReference: String(bookingReference).trim().toUpperCase()
    }).populate("roomType", "name");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found."
      });
    }

    const isOwner = booking.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to cancel this reservation."
      });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "This reservation is already cancelled."
      });
    }

    if (booking.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Completed reservations cannot be cancelled."
      });
    }

    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason || "Cancelled by customer request.";
    booking.assignedRooms = []; // release physical rooms
    await booking.save();

    // Send status update email asynchronously
    (async () => {
      try {
        await sendBookingStatusUpdateEmail({
          to: booking.guestDetails.email,
          guestName: booking.guestDetails.fullName,
          bookingReference: booking.bookingReference,
          roomName: booking.roomType?.name || "Hotel Room",
          status: "cancelled",
          reason: booking.cancellationReason
        });
      } catch (err) {
        console.error("[Cancellation Email Error]:", err.message);
      }
    })();

    return res.status(200).json({
      success: true,
      message: "Reservation has been successfully cancelled.",
      bookingReference: booking.bookingReference,
      status: booking.status
    });
  } catch (error) {
    console.error("[CancelBooking Error]:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel reservation."
    });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingByReference,
  cancelBooking
};
