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
