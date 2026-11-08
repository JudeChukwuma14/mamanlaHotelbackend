const Booking = require("../models/booking.model");
const RoomInventory = require("../models/roomInventory.model");
const { sendBookingStatusUpdateEmail } = require("../services/email.service");
const { createNotification } = require("../services/notification.service");

// 1. Admin: Get All Bookings with Comprehensive Filters & Pagination
const getAllBookings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      roomTypeId,
      search,
      checkInDate,
      checkOutDate,
      sortBy = "createdAt",
      order = "desc"
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (roomTypeId) query.roomType = roomTypeId;

    if (search) {
      const regex = { $regex: search, $options: "i" };
      query.$or = [
        { bookingReference: regex },
        { "guestDetails.fullName": regex },
        { "guestDetails.email": regex },
        { "guestDetails.phone": regex }
      ];
    }

    if (checkInDate && checkOutDate) {
      query.checkInDate = { $gte: new Date(checkInDate) };
      query.checkOutDate = { $lte: new Date(checkOutDate) };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const sortDirection = order === "asc" ? 1 : -1;

    const [bookings, totalCount] = await Promise.all([
      Booking.find(query)
        .populate("user", "userName email phoneNumber")
        .populate("roomType", "name category pricePerNight")
        .populate("assignedRooms", "roomNumber floor status")
        .sort({ [sortBy]: sortDirection })
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
    console.error("[GetAllBookings Error]:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve bookings."
    });
  }
};

// 2. Admin: Get Booking by ID
const getBookingDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id)
      .populate("user", "userName email phoneNumber")
      .populate("roomType")
      .populate("assignedRooms", "roomNumber floor status notes");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking record not found."
      });
    }

    return res.status(200).json({
      success: true,
      booking
    });
  } catch (error) {
    console.error("[GetBookingDetails Error]:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve booking details."
    });
  }
};

// 3. Admin: Update Booking Status
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, reason } = req.body;

    const booking = await Booking.findById(id).populate("roomType", "name");
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking record not found."
      });
    }

    const previousStatus = booking.status;
    booking.status = status;

    if (adminNotes) {
      booking.adminNotes = adminNotes;
    }

    const now = new Date();
    if (status === "confirmed") {
      booking.confirmedAt = now;
      booking.expiresAt = undefined; // clear expiry once confirmed
    } else if (status === "cancelled") {
      booking.cancelledAt = now;
      booking.cancellationReason = reason || "Cancelled by administrator.";
      booking.assignedRooms = []; // release physical rooms
    } else if (status === "completed") {
      booking.completedAt = now;
    }

    await booking.save();

    // Send status update email if status actually changed
    if (previousStatus !== status) {
      (async () => {
        try {
          await sendBookingStatusUpdateEmail({
            to: booking.guestDetails.email,
            guestName: booking.guestDetails.fullName,
            bookingReference: booking.bookingReference,
            roomName: booking.roomType?.name || "Hotel Room",
            status,
            reason: reason || adminNotes
          });

          await createNotification({
            type: "booking_status_update",
            recipient: booking.guestDetails.email,
            subject: `Reservation ${booking.bookingReference} status updated to ${status}`,
            htmlContent: `Status updated to ${status}`,
            bookingReference: booking.bookingReference
          });
        } catch (err) {
          console.error("[Admin Status Email Error]:", err.message);
        }
      })();
    }

    return res.status(200).json({
      success: true,
      message: `Booking status updated to ${status}.`,
      booking
    });
  } catch (error) {
    console.error("[UpdateBookingStatus Error]:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update booking status."
    });
  }
};

// 4. Admin: Assign Physical Rooms to Booking
const assignPhysicalRooms = async (req, res) => {
  try {
    const { id } = req.params;
    const { roomInventoryIds } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking record not found."
      });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot assign rooms to a cancelled booking."
      });
    }

    // Verify each inventory item exists and belongs to the booking's room category
    const inventories = await RoomInventory.find({
      _id: { $in: roomInventoryIds }
    });

    if (inventories.length !== roomInventoryIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more room inventory IDs are invalid."
      });
    }

    for (const inv of inventories) {
      if (inv.roomType.toString() !== booking.roomType.toString()) {
        return res.status(400).json({
          success: false,
          message: `Room ${inv.roomNumber} does not belong to the booked room category.`
        });
      }
      if (inv.status !== "available") {
        return res.status(400).json({
          success: false,
          message: `Room ${inv.roomNumber} is currently under '${inv.status}' and cannot be assigned.`
        });
      }
    }

    // Check if any of these rooms are occupied in an overlapping reservation
    const overlappingConflict = await Booking.findOne({
      _id: { $ne: booking._id },
      status: { $in: ["pending", "confirmed"] },
      assignedRooms: { $in: roomInventoryIds },
      checkInDate: { $lt: booking.checkOutDate },
      checkOutDate: { $gt: booking.checkInDate }
    }).select("bookingReference");

    if (overlappingConflict) {
      return res.status(409).json({
        success: false,
        message: `One or more selected rooms are already assigned to booking ${overlappingConflict.bookingReference} during this date window.`
      });
    }

    booking.assignedRooms = roomInventoryIds;
    await booking.save();

    const populated = await Booking.findById(booking._id)
      .populate("roomType", "name category")
      .populate("assignedRooms", "roomNumber floor status");

    return res.status(200).json({
      success: true,
      message: "Physical rooms assigned successfully.",
      booking: populated
    });
  } catch (error) {
    console.error("[AssignPhysicalRooms Error]:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to assign physical rooms."
    });
  }
};

module.exports = {
  getAllBookings,
  getBookingDetails,
  updateBookingStatus,
  assignPhysicalRooms
};

