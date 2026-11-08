const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    roomType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true
    },
    assignedRooms: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RoomInventory"
      }
    ],
    numberOfRooms: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    checkInDate: {
      type: Date,
      required: true
    },
    checkOutDate: {
      type: Date,
      required: true
    },
    numberOfNights: {
      type: Number,
      required: true,
      min: 1
    },
    guests: {
      adults: {
        type: Number,
        required: true,
        min: 1
      },
      children: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    guestDetails: {
      fullName: {
        type: String,
        required: true,
        trim: true
      },
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
      },
      phone: {
        type: String,
        trim: true
      }
    },
    pricing: {
      pricePerNight: {
        type: Number,
        required: true,
        min: 0
      },
      numberOfRooms: {
        type: Number,
        required: true,
        min: 1
      },
      numberOfNights: {
        type: Number,
        required: true,
        min: 1
      },
      totalAmount: {
        type: Number,
        required: true,
        min: 0
      }
    },
    specialRequests: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed", "no_show"],
      default: "pending"
    },
    cancelledAt: {
      type: Date
    },
    cancellationReason: {
      type: String,
      trim: true
    },
    confirmedAt: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    expiresAt: {
      type: Date
    },
    adminNotes: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ roomType: 1, checkInDate: 1, checkOutDate: 1 });
bookingSchema.index({ status: 1, expiresAt: 1 });
bookingSchema.index({ checkInDate: 1, checkOutDate: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
