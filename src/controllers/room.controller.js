const slugify = require("slugify");
const Room = require("../models/room.model");
const RoomInventory = require("../models/roomInventory.model");
const Booking = require("../models/booking.model");
const { uploadImage, deleteMultipleImages } = require("../services/cloudinary.service");
const { getAvailableRoomCount } = require("../services/availability.service");
const { parseDate, isValidDateRange } = require("../utils/dateValidation");

// Helper to normalize amenities from request body
const parseAmenities = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((a) => String(a).trim()).filter(Boolean);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map((a) => String(a).trim()).filter(Boolean);
    } catch {
      return raw.split(",").map((a) => a.trim()).filter(Boolean);
    }
  }
  return [];
};

// 1. Admin: Create New Room Category
const createRoom = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      pricePerNight,
      roomSize,
      bedType,
      numberOfBeds,
      maximumAdults,
      maximumChildren,
      totalRooms,
      amenities,
      smokingAllowed,
      petsAllowed,
      cancellationPolicy,
      checkInTime,
      checkOutTime,
      status,
      featured
    } = req.body;

    // Generate unique slug
    let baseSlug = slugify(name, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;
    while (await Room.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Process uploaded images via Cloudinary
    const images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploaded = await uploadImage(file.buffer, "mamala-hotel/rooms");
        images.push({
          url: uploaded.url,
          publicId: uploaded.publicId,
          alt: name
        });
      }
    }

    const room = await Room.create({
      name,
      slug,
      description,
      category,
      pricePerNight: Number(pricePerNight),
      roomSize: roomSize ? Number(roomSize) : undefined,
      bedType: bedType || "queen",
      numberOfBeds: numberOfBeds ? Number(numberOfBeds) : 1,
      maximumAdults: maximumAdults ? Number(maximumAdults) : 2,
      maximumChildren: maximumChildren ? Number(maximumChildren) : 0,
      totalRooms: Number(totalRooms),
      amenities: parseAmenities(amenities),
      images,
      smokingAllowed: smokingAllowed === true || smokingAllowed === "true",
      petsAllowed: petsAllowed === true || petsAllowed === "true",
      cancellationPolicy: cancellationPolicy || "Free cancellation up to 24 hours before check-in",
      checkInTime: checkInTime || "14:00",
      checkOutTime: checkOutTime || "12:00",
      status: status || "active",
      featured: featured === true || featured === "true",
      createdBy: req.user._id
    });

    return res.status(201).json({
      success: true,
      message: "Room category created successfully.",
      room
    });
  } catch (error) {
    console.error("[CreateRoom Error]:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create room category."
    });
  }
};

// 2. Admin: Update Room Category
const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room category not found."
      });
    }

    const updates = { ...req.body };

    // Update slug if name changes
    if (updates.name && updates.name !== room.name) {
      let baseSlug = slugify(updates.name, { lower: true, strict: true });
      let slug = baseSlug;
      let counter = 1;
      while (await Room.findOne({ slug, _id: { $ne: room._id } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      updates.slug = slug;
    }

    // Parse numeric fields
    if (updates.pricePerNight !== undefined) updates.pricePerNight = Number(updates.pricePerNight);
    if (updates.roomSize !== undefined) updates.roomSize = Number(updates.roomSize);
    if (updates.numberOfBeds !== undefined) updates.numberOfBeds = Number(updates.numberOfBeds);
    if (updates.maximumAdults !== undefined) updates.maximumAdults = Number(updates.maximumAdults);
    if (updates.maximumChildren !== undefined) updates.maximumChildren = Number(updates.maximumChildren);
    if (updates.totalRooms !== undefined) updates.totalRooms = Number(updates.totalRooms);

    // Booleans
    if (updates.smokingAllowed !== undefined) {
      updates.smokingAllowed = updates.smokingAllowed === true || updates.smokingAllowed === "true";
    }
    if (updates.petsAllowed !== undefined) {
      updates.petsAllowed = updates.petsAllowed === true || updates.petsAllowed === "true";
    }
    if (updates.featured !== undefined) {
      updates.featured = updates.featured === true || updates.featured === "true";
    }

    if (updates.amenities !== undefined) {
      updates.amenities = parseAmenities(updates.amenities);
    }

    // Process new uploaded images
    if (req.files && req.files.length > 0) {
      const newImages = [];
      for (const file of req.files) {
        const uploaded = await uploadImage(file.buffer, "mamala-hotel/rooms");
        newImages.push({
          url: uploaded.url,
          publicId: uploaded.publicId,
          alt: updates.name || room.name
        });
      }
      updates.images = [...room.images, ...newImages];
    }

    Object.assign(room, updates);
    await room.save();

    return res.status(200).json({
      success: true,
      message: "Room category updated successfully.",
      room
    });
  } catch (error) {
    console.error("[UpdateRoom Error]:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update room category."
    });
  }
};

// 3. Admin: Delete Room Category
const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room category not found."
      });
    }

    // Check for active bookings
    const activeBookingsCount = await Booking.countDocuments({
      roomType: room._id,
      status: { $in: ["pending", "confirmed"] },
      checkOutDate: { $gte: new Date() }
    });

    if (activeBookingsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete room category. There are ${activeBookingsCount} active reservation(s) associated with it. Consider setting status to 'inactive' instead.`
      });
    }

    // Clean up Cloudinary images
    if (room.images && room.images.length > 0) {
      const publicIds = room.images.map((img) => img.publicId).filter(Boolean);
      await deleteMultipleImages(publicIds);
    }

    // Clean up physical room inventories
    await RoomInventory.deleteMany({ roomType: room._id });

    // Delete room document
    await Room.findByIdAndDelete(room._id);

    return res.status(200).json({
      success: true,
      message: "Room category and associated inventory deleted successfully."
    });
  } catch (error) {
    console.error("[DeleteRoom Error]:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete room category."
    });
  }
};

// 4. Admin: List All Rooms
const getAdminRooms = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      status,
      search,
      sortBy = "createdAt",
      order = "desc"
    } = req.query;

    const query = {};
    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const sortDirection = order === "asc" ? 1 : -1;

    const [rooms, totalCount] = await Promise.all([
      Room.find(query)
        .populate("createdBy", "userName email")
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(limitNum),
      Room.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum),
      totalCount,
      rooms
    });
  } catch (error) {
    console.error("[GetAdminRooms Error]:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve room categories."
    });
  }
};

// 5. Admin: Get Single Room with Inventory
const getAdminRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findById(id).populate("createdBy", "userName email");

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room category not found."
      });
    }

    const inventory = await RoomInventory.find({ roomType: room._id }).sort({ roomNumber: 1 });

    return res.status(200).json({
      success: true,
      room,
      inventory
    });
  } catch (error) {
    console.error("[GetAdminRoomById Error]:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve room details."
    });
  }
};

// 6. Admin: Add Physical Room Inventory
const addRoomInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { roomNumber, floor, status, notes } = req.body;

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room category not found."
      });
    }

    const existingNumber = await RoomInventory.findOne({ roomNumber: String(roomNumber).toUpperCase() });
    if (existingNumber) {
      return res.status(409).json({
        success: false,
        message: `Room number ${roomNumber} already exists in the system.`
      });
    }

    const inventoryItem = await RoomInventory.create({
      roomType: room._id,
      roomNumber: String(roomNumber).toUpperCase(),
      floor: Number(floor),
      status: status || "available",
      notes
    });

    return res.status(201).json({
      success: true,
      message: "Physical room added to inventory successfully.",
      inventoryItem
    });
  } catch (error) {
    console.error("[AddRoomInventory Error]:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add room inventory."
    });
  }
};

// 7. Admin: Get Room Inventory List
const getRoomInventories = async (req, res) => {
  try {
    const { roomTypeId, status, floor } = req.query;
    const query = {};
    if (roomTypeId) query.roomType = roomTypeId;
    if (status) query.status = status;
    if (floor) query.floor = Number(floor);

    const inventory = await RoomInventory.find(query)
      .populate("roomType", "name category pricePerNight")
      .sort({ roomNumber: 1 });

    return res.status(200).json({
      success: true,
      totalCount: inventory.length,
      inventory
    });
  } catch (error) {
    console.error("[GetRoomInventories Error]:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve room inventory."
    });
  }
};

// 8. Admin: Update Physical Room Inventory Item
const updateRoomInventory = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const { roomNumber, floor, status, notes } = req.body;

    const inventory = await RoomInventory.findById(inventoryId);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Room inventory item not found."
      });
    }

    if (roomNumber && roomNumber.toUpperCase() !== inventory.roomNumber) {
      const exists = await RoomInventory.findOne({
        roomNumber: roomNumber.toUpperCase(),
        _id: { $ne: inventory._id }
      });
      if (exists) {
        return res.status(409).json({
          success: false,
          message: `Room number ${roomNumber} is already in use.`
        });
      }
      inventory.roomNumber = roomNumber.toUpperCase();
    }

    if (floor !== undefined) inventory.floor = Number(floor);
    if (status !== undefined) inventory.status = status;
    if (notes !== undefined) inventory.notes = notes;

    await inventory.save();

    return res.status(200).json({
      success: true,
      message: "Room inventory item updated successfully.",
      inventory
    });
  } catch (error) {
    console.error("[UpdateRoomInventory Error]:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update room inventory."
    });
  }
};

// 9. Admin: Delete Room Inventory Item
const deleteRoomInventory = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const inventory = await RoomInventory.findById(inventoryId);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Room inventory item not found."
      });
    }

    await RoomInventory.findByIdAndDelete(inventoryId);

    return res.status(200).json({
      success: true,
      message: "Room inventory item removed successfully."
    });
  } catch (error) {
    console.error("[DeleteRoomInventory Error]:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete room inventory."
    });
  }
};

// ==========================================
// PUBLIC ROOM DISCOVERY CONTROLLER METHODS
// ==========================================

// 10. Public: List Available Rooms with Filter & Availability Calculation
const getPublicRooms = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      minPrice,
      maxPrice,
      adults,
      children,
      amenities,
      checkInDate,
      checkOutDate,
      sortBy = "pricePerNight",
      order = "asc"
    } = req.query;

    const query = { status: "active" };

    if (category) query.category = category;

    if (minPrice || maxPrice) {
      query.pricePerNight = {};
      if (minPrice) query.pricePerNight.$gte = Number(minPrice);
      if (maxPrice) query.pricePerNight.$lte = Number(maxPrice);
    }

    if (adults) {
      query.maximumAdults = { $gte: Number(adults) };
    }
    if (children) {
      query.maximumChildren = { $gte: Number(children) };
    }

    if (amenities) {
      const amenitiesList = Array.isArray(amenities)
        ? amenities
        : amenities.split(",").map((a) => a.trim());
      query.amenities = { $all: amenitiesList };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const sortDirection = order === "desc" ? -1 : 1;

    let parsedCheckIn = null;
    let parsedCheckOut = null;
    const hasDateRange = checkInDate && checkOutDate;

    if (hasDateRange) {
      parsedCheckIn = parseDate(checkInDate);
      parsedCheckOut = parseDate(checkOutDate);

      if (!parsedCheckIn || !parsedCheckOut || !isValidDateRange(parsedCheckIn, parsedCheckOut)) {
        return res.status(400).json({
          success: false,
          message: "Invalid check-in or check-out date range."
        });
      }
    }

    const rooms = await Room.find(query)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(limitNum);

    const totalCount = await Room.countDocuments(query);

    // If dates are provided, calculate real-time availability for each room
    let results = rooms;
    if (hasDateRange) {
      const enrichedRooms = await Promise.all(
        rooms.map(async (r) => {
          const availability = await getAvailableRoomCount(r._id, parsedCheckIn, parsedCheckOut);
          const roomObj = r.toObject();
          roomObj.availability = availability;
          return roomObj;
        })
      );
      results = enrichedRooms;
    }

    return res.status(200).json({
      success: true,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum),
      totalCount,
      rooms: results
    });
  } catch (error) {
    console.error("[GetPublicRooms Error]:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to search rooms."
    });
  }
};

// 11. Public: Get Single Room Details by Slug
const getRoomBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const { checkInDate, checkOutDate } = req.query;

    const room = await Room.findOne({ slug, status: "active" });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found."
      });
    }

    const roomObj = room.toObject();

    if (checkInDate && checkOutDate) {
      const parsedCheckIn = parseDate(checkInDate);
      const parsedCheckOut = parseDate(checkOutDate);

      if (parsedCheckIn && parsedCheckOut && isValidDateRange(parsedCheckIn, parsedCheckOut)) {
        roomObj.availability = await getAvailableRoomCount(
          room._id,
          parsedCheckIn,
          parsedCheckOut
        );
      }
    }

    return res.status(200).json({
      success: true,
      room: roomObj
    });
  } catch (error) {
    console.error("[GetRoomBySlug Error]:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve room details."
    });
  }
};

// 12. Public: Get Featured Rooms
const getFeaturedRooms = async (req, res) => {
  try {
    const featuredRooms = await Room.find({ status: "active", featured: true })
      .limit(6)
      .sort({ pricePerNight: 1 });

    return res.status(200).json({
      success: true,
      rooms: featuredRooms
    });
  } catch (error) {
    console.error("[GetFeaturedRooms Error]:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve featured rooms."
    });
  }
};

module.exports = {
  createRoom,
  updateRoom,
  deleteRoom,
  getAdminRooms,
  getAdminRoomById,
  addRoomInventory,
  getRoomInventories,
  updateRoomInventory,
  deleteRoomInventory,
  getPublicRooms,
  getRoomBySlug,
  getFeaturedRooms
};

