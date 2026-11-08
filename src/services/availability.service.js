const Room = require("../models/room.model");
const RoomInventory = require("../models/roomInventory.model");
const Booking = require("../models/booking.model");

const getAvailableRoomCount = async (roomTypeId, checkInDate, checkOutDate) => {
  const room = await Room.findById(roomTypeId);
  if (!room || room.status !== "active") {
    return {
      totalCapacity: 0,
      bookedCount: 0,
      availableCount: 0
    };
  }

  // Find physical rooms in inventory
  const physicalRooms = await RoomInventory.find({
    roomType: roomTypeId,
    status: "available"
  });

  // If admin has registered physical room inventories, use that count; otherwise use room.totalRooms
  const totalCapacity = physicalRooms.length > 0 ? physicalRooms.length : room.totalRooms;

  // Find active overlapping reservations
  const overlappingBookings = await Booking.find({
    roomType: roomTypeId,
    status: { $in: ["pending", "confirmed"] },
    checkInDate: { $lt: checkOutDate },
    checkOutDate: { $gt: checkInDate }
  });

  // Calculate total booked rooms across overlapping reservations
  const bookedCount = overlappingBookings.reduce((sum, b) => sum + (b.numberOfRooms || 1), 0);

  const availableCount = Math.max(0, totalCapacity - bookedCount);

  return {
    totalCapacity,
    bookedCount,
    availableCount
  };
};

const getAvailablePhysicalRooms = async (roomTypeId, checkInDate, checkOutDate, count = 1) => {
  // Find all active physical rooms of this type
  const allPhysicalRooms = await RoomInventory.find({
    roomType: roomTypeId,
    status: "available"
  });

  if (allPhysicalRooms.length === 0) {
    return [];
  }

  // Find overlapping bookings that have assigned rooms
  const overlappingBookings = await Booking.find({
    roomType: roomTypeId,
    status: { $in: ["pending", "confirmed"] },
    checkInDate: { $lt: checkOutDate },
    checkOutDate: { $gt: checkInDate }
  }).select("assignedRooms");

  const bookedRoomIds = new Set();
  for (const b of overlappingBookings) {
    if (Array.isArray(b.assignedRooms)) {
      b.assignedRooms.forEach((id) => bookedRoomIds.add(id.toString()));
    }
  }

  // Filter out already booked rooms
  const freeRooms = allPhysicalRooms.filter(
    (room) => !bookedRoomIds.has(room._id.toString())
  );

  return freeRooms.slice(0, count);
};

module.exports = {
  getAvailableRoomCount,
  getAvailablePhysicalRooms
};

