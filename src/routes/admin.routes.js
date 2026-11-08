const express = require("express");
const router = express.Router();
const roomController = require("../controllers/room.controller");
const adminBookingController = require("../controllers/adminBooking.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");
const { authorizeAdmin } = require("../middlewares/admin.middleware");
const { uploadRoomImages } = require("../middlewares/upload.middleware");
const { validateBody } = require("../middlewares/validation.middleware");

// Require authentication and administrator privileges for all admin endpoints
router.use(authenticateToken);
router.use(authorizeAdmin);

// ==========================================
// ROOM CATEGORY MANAGEMENT
// ==========================================
router.post(
  "/rooms",
  uploadRoomImages,
  validateBody("createRoom"),
  roomController.createRoom
);

router.get("/rooms", roomController.getAdminRooms);
router.get("/rooms/:id", roomController.getAdminRoomById);

router.put(
  "/rooms/:id",
  uploadRoomImages,
  validateBody("updateRoom"),
  roomController.updateRoom
);

router.delete("/rooms/:id", roomController.deleteRoom);

// ==========================================
// PHYSICAL ROOM INVENTORY
// ==========================================
router.post(
  "/rooms/:id/inventory",
  validateBody("createInventory"),
  roomController.addRoomInventory
);

router.get("/inventory", roomController.getRoomInventories);
router.put("/inventory/:inventoryId", roomController.updateRoomInventory);
router.delete("/inventory/:inventoryId", roomController.deleteRoomInventory);

// ==========================================
// RESERVATION / BOOKING MANAGEMENT
// ==========================================
router.get("/bookings", adminBookingController.getAllBookings);
router.get("/bookings/:id", adminBookingController.getBookingDetails);

router.patch(
  "/bookings/:id/status",
  validateBody("updateBookingStatus"),
  adminBookingController.updateBookingStatus
);

router.post(
  "/bookings/:id/assign-rooms",
  validateBody("assignRooms"),
  adminBookingController.assignPhysicalRooms
);

module.exports = router;

