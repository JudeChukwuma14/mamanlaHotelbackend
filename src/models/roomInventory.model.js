const mongoose = require("mongoose");

const roomInventorySchema = new mongoose.Schema(
  {
    roomType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true
    },
    roomNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    floor: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ["available", "maintenance", "inactive"],
      default: "available"
    },
    notes: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

roomInventorySchema.index({ roomType: 1, status: 1 });

module.exports = mongoose.model("RoomInventory", roomInventorySchema);
