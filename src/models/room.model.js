const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      enum: ["standard", "deluxe", "executive", "presidential_suite", "luxury_suite"]
    },
    pricePerNight: {
      type: Number,
      required: true,
      min: 0
    },
    roomSize: {
      type: Number,
      min: 0
    },
    bedType: {
      type: String,
      enum: ["single", "double", "queen", "king", "twin"],
      default: "queen"
    },
    numberOfBeds: {
      type: Number,
      min: 1,
      default: 1
    },
    maximumAdults: {
      type: Number,
      min: 1,
      default: 2
    },
    maximumChildren: {
      type: Number,
      min: 0,
      default: 0
    },
    totalRooms: {
      type: Number,
      required: true,
      min: 1
    },
    amenities: {
      type: [String],
      default: []
    },
    images: [
      {
        url: {
          type: String,
          required: true
        },
        publicId: {
          type: String,
          required: true
        },
        alt: {
          type: String,
          default: ""
        }
      }
    ],
    smokingAllowed: {
      type: Boolean,
      default: false
    },
    petsAllowed: {
      type: Boolean,
      default: false
    },
    cancellationPolicy: {
      type: String,
      default: "Free cancellation up to 24 hours before check-in"
    },
    checkInTime: {
      type: String,
      default: "14:00"
    },
    checkOutTime: {
      type: String,
      default: "12:00"
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },
    featured: {
      type: Boolean,
      default: false
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

roomSchema.index({ category: 1, status: 1 });
roomSchema.index({ featured: 1, status: 1 });
roomSchema.index({ pricePerNight: 1 });

module.exports = mongoose.model("Room", roomSchema);
