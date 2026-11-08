const Joi = require("joi");

const schemas = {
  register: Joi.object({
    email: Joi.string().trim().lowercase().required().messages({
      "string.empty": "Email address is required.",
      "any.required": "Email address is required."
    }),
    password: Joi.string().required().messages({
      "string.empty": "Password is required.",
      "any.required": "Password is required."
    }),
    userName: Joi.string().trim().allow("", null),
    phoneNumber: Joi.string().trim().allow("", null)
  }),

  login: Joi.object({
    email: Joi.string().trim().lowercase().required().messages({
      "string.empty": "Email address is required.",
      "any.required": "Email address is required."
    }),
    password: Joi.string().required().messages({
      "string.empty": "Password is required.",
      "any.required": "Password is required."
    })
  }),

  verifyEmail: Joi.object({
    email: Joi.string().trim().lowercase().required().messages({
      "string.empty": "Email address is required.",
      "any.required": "Email address is required."
    }),
    otp: Joi.string().trim().uppercase().required().messages({
      "string.empty": "Verification code is required.",
      "any.required": "Verification code is required."
    })
  }),

  resendOtp: Joi.object({
    email: Joi.string().trim().lowercase().required().messages({
      "string.empty": "Email address is required.",
      "any.required": "Email address is required."
    }),
    purpose: Joi.string().valid("email_verification", "password_reset").default("email_verification")
  }),

  forgotPassword: Joi.object({
    email: Joi.string().trim().lowercase().required().messages({
      "string.empty": "Email address is required.",
      "any.required": "Email address is required."
    })
  }),

  resetPassword: Joi.object({
    email: Joi.string().trim().lowercase().required().messages({
      "string.empty": "Email address is required.",
      "any.required": "Email address is required."
    }),
    otp: Joi.string().trim().uppercase().required().messages({
      "string.empty": "Verification code is required.",
      "any.required": "Verification code is required."
    }),
    newPassword: Joi.string().required().messages({
      "string.empty": "New password is required.",
      "any.required": "New password is required."
    })
  }),

  createRoom: Joi.object({
    name: Joi.string().trim().required().messages({
      "any.required": "Room name is required."
    }),
    description: Joi.string().trim().required().messages({
      "any.required": "Room description is required."
    }),
    category: Joi.string()
      .valid("standard", "deluxe", "executive", "presidential_suite", "luxury_suite")
      .required()
      .messages({
        "any.required": "Room category is required.",
        "any.only": "Category must be one of: standard, deluxe, executive, presidential_suite, luxury_suite."
      }),
    pricePerNight: Joi.number().min(0).required().messages({
      "any.required": "Price per night is required.",
      "number.min": "Price per night cannot be negative."
    }),
    roomSize: Joi.number().min(0).allow(null, ""),
    bedType: Joi.string().valid("single", "double", "queen", "king", "twin").default("queen"),
    numberOfBeds: Joi.number().min(1).default(1),
    maximumAdults: Joi.number().min(1).default(2),
    maximumChildren: Joi.number().min(0).default(0),
    totalRooms: Joi.number().min(1).required().messages({
      "any.required": "Total number of rooms is required.",
      "number.min": "Total rooms must be at least 1."
    }),
    amenities: Joi.alternatives().try(
      Joi.array().items(Joi.string()),
      Joi.string()
    ).default([]),
    smokingAllowed: Joi.boolean().default(false),
    petsAllowed: Joi.boolean().default(false),
    cancellationPolicy: Joi.string().default("Free cancellation up to 24 hours before check-in"),
    checkInTime: Joi.string().default("14:00"),
    checkOutTime: Joi.string().default("12:00"),
    status: Joi.string().valid("active", "inactive").default("active"),
    featured: Joi.boolean().default(false)
  }),

  updateRoom: Joi.object({
    name: Joi.string().trim(),
    description: Joi.string().trim(),
    category: Joi.string().valid("standard", "deluxe", "executive", "presidential_suite", "luxury_suite"),
    pricePerNight: Joi.number().min(0),
    roomSize: Joi.number().min(0).allow(null, ""),
    bedType: Joi.string().valid("single", "double", "queen", "king", "twin"),
    numberOfBeds: Joi.number().min(1),
    maximumAdults: Joi.number().min(1),
    maximumChildren: Joi.number().min(0),
    totalRooms: Joi.number().min(1),
    amenities: Joi.alternatives().try(
      Joi.array().items(Joi.string()),
      Joi.string()
    ),
    smokingAllowed: Joi.boolean(),
    petsAllowed: Joi.boolean(),
    cancellationPolicy: Joi.string(),
    checkInTime: Joi.string(),
    checkOutTime: Joi.string(),
    status: Joi.string().valid("active", "inactive"),
    featured: Joi.boolean()
  }),

  createInventory: Joi.object({
    roomNumber: Joi.string().trim().uppercase().required().messages({
      "any.required": "Room number is required."
    }),
    floor: Joi.number().required().messages({
      "any.required": "Floor number is required."
    }),
    status: Joi.string().valid("available", "maintenance", "inactive").default("available"),
    notes: Joi.string().trim().allow("", null)
  }),

  createBooking: Joi.object({
    roomTypeId: Joi.string().required().messages({
      "any.required": "Room type ID is required."
    }),
    checkInDate: Joi.date().iso().required().messages({
      "any.required": "Check-in date is required.",
      "date.format": "Check-in date must be in ISO format (YYYY-MM-DD)."
    }),
    checkOutDate: Joi.date().iso().required().messages({
      "any.required": "Check-out date is required.",
      "date.format": "Check-out date must be in ISO format (YYYY-MM-DD)."
    }),
    numberOfRooms: Joi.number().min(1).default(1),
    adults: Joi.number().min(1).required().messages({
      "any.required": "Number of adults is required."
    }),
    children: Joi.number().min(0).default(0),
    fullName: Joi.string().trim().required().messages({
      "any.required": "Guest full name is required."
    }),
    email: Joi.string().trim().lowercase().required().messages({
      "any.required": "Guest email address is required."
    }),
    phone: Joi.string().trim().allow("", null),
    specialRequests: Joi.string().trim().allow("", null)
  }),

  updateBookingStatus: Joi.object({
    status: Joi.string()
      .valid("pending", "confirmed", "cancelled", "completed", "no_show")
      .required()
      .messages({
        "any.required": "Updated booking status is required.",
        "any.only": "Status must be pending, confirmed, cancelled, completed, or no_show."
      }),
    adminNotes: Joi.string().trim().allow("", null),
    reason: Joi.string().trim().allow("", null)
  }),

  assignRooms: Joi.object({
    roomInventoryIds: Joi.array().items(Joi.string()).min(1).required().messages({
      "any.required": "At least one room inventory ID must be assigned."
    })
  })
};

const validateBody = (schemaName) => {
  const schema = schemas[schemaName];
  if (!schema) {
    throw new Error(`Validation schema '${schemaName}' not found.`);
  }

  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map((d) => d.message);
      return res.status(400).json({
        success: false,
        message: details[0],
        errors: details
      });
    }

    req.body = value;
    next();
  };
};

module.exports = {
  validateBody
};
