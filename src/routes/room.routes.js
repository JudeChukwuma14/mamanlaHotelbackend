const express = require("express");
const router = express.Router();
const roomController = require("../controllers/room.controller");

// 1. Featured rooms list
router.get("/featured", roomController.getFeaturedRooms);

// 2. Featured room by ID
router.get("/featured/:id", roomController.getFeaturedRoomById);

// 3. Single room details by ID (explicit)
router.get("/id/:id", roomController.getRoomById);

// 4. Public room search with filtering and availability
router.get("/", roomController.getPublicRooms);

// 5. Single room details by slug or ID
router.get("/:slug", roomController.getRoomBySlug);

module.exports = router;
