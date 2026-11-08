const express = require("express");
const router = express.Router();
const roomController = require("../controllers/room.controller");

// 1. Featured rooms
router.get("/featured", roomController.getFeaturedRooms);

// 2. Public room search with filtering and availability
router.get("/", roomController.getPublicRooms);

// 3. Single room details by slug
router.get("/:slug", roomController.getRoomBySlug);

module.exports = router;

