const ENV = require("../config/env");

const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "Mama La Hotel & Co. — API Documentation",
    version: "1.0.0",
    description: `
## Welcome to the Mama La Hotel & Co. Backend API Documentation

This API powers the luxury hospitality booking and management platform for **Mama La Hotel & Co.**

---

### Key Information for Frontend Engineers:
1. **Authentication:**
   - **Access Tokens:** Standard JWT passed in the \`Authorization\` header as \`Bearer <accessToken>\`. Access tokens expire in **15 minutes**.
   - **Refresh Tokens:** Sent as an **HttpOnly cookie** (\`refreshToken\`) with path \`/auth\`. Automatic token refresh should be performed via \`POST /auth/refresh\` when an API returns HTTP \`401\` with code \`TOKEN_EXPIRED\`.
   - **Credentials:** Make sure your HTTP client (e.g., Axios with \`withCredentials: true\` or Fetch with \`credentials: 'include'\`) is configured to send cookies.

2. **Roles & Permissions:**
   - \`user\`: Verified customers can search rooms, create reservations, view their personal booking history, and cancel active bookings.
   - \`admin\`: Hotel staff/administrators can manage room categories, physical inventories, view all bookings, update booking statuses, and assign physical rooms.

3. **Multipart Form-Data:**
   - Endpoints creating or updating rooms with images require \`Content-Type: multipart/form-data\` with file field named \`images\`.

4. **Real-Time Date-Based Availability:**
   - Room availability is computed dynamically based on date overlap (\`checkInDate < requestedCheckOut && checkOutDate > requestedCheckIn\`). Never calculate room totals or pricing on the client side—the backend is the source of truth.
    `,
    contact: {
      name: "Mama La Hotel Tech Support",
      email: "codarinstructor@gmail.com",
    },
  },
  servers: [
    {
      url: `http://localhost:${ENV.port}`,
      description: "Local Development Server",
    },
  ],
  tags: [
    {
      name: "Authentication",
      description:
        "User registration, OTP email verification, login, session refresh, and password recovery.",
    },
    {
      name: "Public Rooms",
      description:
        "Public room category discovery, real-time availability checks, and featured rooms.",
    },
    {
      name: "Customer Bookings",
      description:
        "Reservation creation, personal booking history, and cancellation for authenticated guests.",
    },
    {
      name: "Admin - Room Management",
      description:
        "Administrator CRUD operations for room categories and Cloudinary asset management.",
    },
    {
      name: "Admin - Inventory Management",
      description:
        "Physical room allocation, maintenance states, and floor configurations.",
    },
    {
      name: "Admin - Booking Management",
      description:
        "Reservation administration, status transitions, and physical room assignments.",
    },
    {
      name: "System",
      description: "Health checks and operational endpoints.",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "Enter your JWT access token retrieved from `/auth/login` or `/auth/refresh`.",
      },
    },
    schemas: {
      StandardSuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: {
            type: "string",
            example: "Operation completed successfully.",
          },
        },
      },
      StandardErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "An error occurred." },
          code: { type: "string", example: "ERROR_CODE" },
          errors: {
            type: "array",
            items: { type: "string" },
            example: ["Validation error detail"],
          },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", example: "66f1234567890abcdef12345" },
          email: { type: "string", example: "guest@example.com" },
          userName: { type: "string", example: "JaneDoe" },
          phoneNumber: { type: "string", example: "+2348012345678" },
          role: { type: "string", enum: ["user", "admin"], example: "user" },
          isVerified: { type: "boolean", example: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Room: {
        type: "object",
        properties: {
          _id: { type: "string", example: "66f1234567890abcdef12345" },
          name: { type: "string", example: "Deluxe Ocean View Suite" },
          slug: { type: "string", example: "deluxe-ocean-view-suite" },
          description: {
            type: "string",
            example:
              "Spacious suite featuring panoramic ocean views and private balcony.",
          },
          category: {
            type: "string",
            enum: [
              "standard",
              "deluxe",
              "executive",
              "presidential_suite",
              "luxury_suite",
            ],
            example: "deluxe",
          },
          pricePerNight: { type: "number", example: 85000 },
          roomSize: { type: "number", example: 45 },
          bedType: {
            type: "string",
            enum: ["single", "double", "queen", "king", "twin"],
            example: "king",
          },
          numberOfBeds: { type: "number", example: 1 },
          maximumAdults: { type: "number", example: 2 },
          maximumChildren: { type: "number", example: 1 },
          totalRooms: { type: "number", example: 5 },
          amenities: {
            type: "array",
            items: { type: "string" },
            example: [
              "Free Wi-Fi",
              "Air Conditioning",
              "Ocean View",
              "Smart TV",
              "Mini Refrigerator",
            ],
          },
          images: {
            type: "array",
            items: {
              type: "object",
              properties: {
                url: {
                  type: "string",
                  example: "https://res.cloudinary.com/.../room.jpg",
                },
                publicId: {
                  type: "string",
                  example: "mamala-hotel/rooms/abc123",
                },
                alt: { type: "string", example: "Deluxe Ocean View Suite" },
              },
            },
          },
          smokingAllowed: { type: "boolean", example: false },
          petsAllowed: { type: "boolean", example: false },
          cancellationPolicy: {
            type: "string",
            example: "Free cancellation up to 24 hours before check-in",
          },
          checkInTime: { type: "string", example: "14:00" },
          checkOutTime: { type: "string", example: "12:00" },
          status: {
            type: "string",
            enum: ["active", "inactive"],
            example: "active",
          },
          featured: { type: "boolean", example: true },
        },
      },
      RoomInventory: {
        type: "object",
        properties: {
          _id: { type: "string", example: "66f9876543210fedcba54321" },
          roomType: { type: "string", example: "66f1234567890abcdef12345" },
          roomNumber: { type: "string", example: "301" },
          floor: { type: "number", example: 3 },
          status: {
            type: "string",
            enum: ["available", "maintenance", "inactive"],
            example: "available",
          },
          notes: { type: "string", example: "Corner room with sea breeze" },
        },
      },
      Booking: {
        type: "object",
        properties: {
          _id: { type: "string", example: "66f789abcdef123456789012" },
          bookingReference: { type: "string", example: "MLH-20261108-A9F4B2" },
          user: { type: "string", example: "66f1234567890abcdef12345" },
          roomType: { $ref: "#/components/schemas/Room" },
          assignedRooms: {
            type: "array",
            items: { $ref: "#/components/schemas/RoomInventory" },
          },
          numberOfRooms: { type: "number", example: 1 },
          checkInDate: {
            type: "string",
            format: "date",
            example: "2026-12-01T00:00:00.000Z",
          },
          checkOutDate: {
            type: "string",
            format: "date",
            example: "2026-12-04T00:00:00.000Z",
          },
          numberOfNights: { type: "number", example: 3 },
          guests: {
            type: "object",
            properties: {
              adults: { type: "number", example: 2 },
              children: { type: "number", example: 0 },
            },
          },
          guestDetails: {
            type: "object",
            properties: {
              fullName: { type: "string", example: "Jane Doe" },
              email: { type: "string", example: "jane@example.com" },
              phone: { type: "string", example: "+2348012345678" },
            },
          },
          pricing: {
            type: "object",
            properties: {
              pricePerNight: { type: "number", example: 85000 },
              numberOfRooms: { type: "number", example: 1 },
              numberOfNights: { type: "number", example: 3 },
              totalAmount: { type: "number", example: 255000 },
            },
          },
          specialRequests: {
            type: "string",
            example: "Late check-in requested around 8pm.",
          },
          status: {
            type: "string",
            enum: ["pending", "confirmed", "cancelled", "completed", "no_show"],
            example: "pending",
          },
          expiresAt: { type: "string", format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
  paths: {
    // ==========================================
    // SYSTEM / HEALTH
    // ==========================================
    "/health": {
      get: {
        tags: ["System"],
        summary: "Check backend server status",
        description: `
> 💡 **Frontend Developer Note:**  
> Use this endpoint for frontend uptime checks, initial network health verifications, or load balancer heartbeats. Returns HTTP \`200\` with server timestamp.
        `,
        responses: {
          200: {
            description: "Server is healthy",
            content: {
              "application/json": {
                example: {
                  status: "healthy",
                  timestamp: "2026-11-08T18:00:00.000Z",
                },
              },
            },
          },
        },
      },
    },

    // ==========================================
    // AUTHENTICATION
    // ==========================================
    "/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register new account",
        description: `
> 💡 **Frontend Developer Note:**  
> - Creates an unverified user account and automatically sends a 6-digit OTP to the provided email via Brevo.
> - If an **unverified** account already exists with this email, the password updates and a new OTP is sent without failing.
> - After calling this, navigate the user to the OTP verification screen and pass the \`email\` in state.
        `,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "guest@example.com",
                  },
                  password: {
                    type: "string",
                    minLength: 6,
                    example: "Secret123!",
                  },
                  userName: { type: "string", example: "JaneDoe" },
                  phoneNumber: { type: "string", example: "+2348012345678" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Registration initiated; OTP sent to email",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message:
                    "Registration successful. Please verify your email with the OTP sent to your inbox.",
                  email: "guest@example.com",
                },
              },
            },
          },
          409: {
            description: "Account with email already registered and verified",
            content: {
              "application/json": {
                example: {
                  success: false,
                  message:
                    "An account with this email address is already registered.",
                },
              },
            },
          },
        },
      },
    },

    "/auth/verify-email": {
      post: {
        tags: ["Authentication"],
        summary: "Verify account email with OTP",
        description: `
> 💡 **Frontend Developer Note:**  
> - Validates the 6-digit OTP sent to the user's email.
> - OTP is valid for 10 minutes.
> - Upon successful verification, redirect the user to the login page to authenticate.
        `,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "otp"],
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "guest@example.com",
                  },
                  otp: { type: "string", example: "582194" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Email verified successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Email verified successfully. You can now log in.",
                },
              },
            },
          },
          400: {
            description: "Invalid or expired OTP code",
            content: {
              "application/json": {
                example: {
                  success: false,
                  message: "Invalid verification code.",
                },
              },
            },
          },
        },
      },
    },

    "/auth/resend-otp": {
      post: {
        tags: ["Authentication"],
        summary: "Resend verification or reset OTP",
        description: `
> 💡 **Frontend Developer Note:**  
> - Has a **60-second cooldown period**. If called too quickly, returns HTTP \`429\` with the exact remaining seconds in \`message\`.
> - Use a countdown timer on your UI button based on the cooldown.
> - Allowed \`purpose\`: \`"email_verification"\` or \`"password_reset"\`.
        `,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "guest@example.com",
                  },
                  purpose: {
                    type: "string",
                    enum: ["email_verification", "password_reset"],
                    default: "email_verification",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "New OTP dispatched",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message:
                    "A new verification code has been sent to your email.",
                },
              },
            },
          },
          429: {
            description: "Cooldown active",
            content: {
              "application/json": {
                example: {
                  success: false,
                  message:
                    "Please wait 45 seconds before requesting a new code.",
                },
              },
            },
          },
        },
      },
    },

    "/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Authenticate user and get session",
        description: `
> 💡 **Frontend Developer Note:**  
> - Returns a short-lived **\`accessToken\`** (15 minutes) in the JSON body. Save this in memory or Redux store.
> - Automatically sets an **HttpOnly cookie** named \`refreshToken\` (valid for 30 days) on path \`/auth\`.
> - Ensure your HTTP client allows credentials (\`withCredentials: true\`).
> - If user is unverified, returns HTTP \`403\` with \`code: "EMAIL_NOT_VERIFIED"\` so frontend can redirect to OTP verification screen.
        `,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "guest@example.com",
                  },
                  password: { type: "string", example: "Secret123!" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Authentication successful",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Login successful.",
                  accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                  user: {
                    id: "66f1234567890abcdef12345",
                    email: "guest@example.com",
                    userName: "JaneDoe",
                    role: "user",
                    isVerified: true,
                  },
                },
              },
            },
          },
          401: {
            description: "Invalid credentials",
            content: {
              "application/json": {
                example: {
                  success: false,
                  message: "Invalid email or password.",
                },
              },
            },
          },
          403: {
            description: "Email not verified",
            content: {
              "application/json": {
                example: {
                  success: false,
                  code: "EMAIL_NOT_VERIFIED",
                  message:
                    "Please verify your email address before logging in.",
                  email: "guest@example.com",
                },
              },
            },
          },
        },
      },
    },

    "/auth/refresh": {
      post: {
        tags: ["Authentication"],
        summary: "Rotate refresh token & obtain new access token",
        description: `
> 💡 **Frontend Developer Note:**  
> - Call this endpoint in an Axios/Fetch response interceptor when receiving \`401\` with \`code: "TOKEN_EXPIRED"\`.
> - Sends the HttpOnly \`refreshToken\` cookie automatically (or can pass \`refreshToken\` in JSON body as a fallback).
> - Returns a fresh \`accessToken\`, rotates the refresh token cookie, and maintains seamless user session without re-prompting for password.
        `,
        responses: {
          200: {
            description: "Token refreshed successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new...",
                },
              },
            },
          },
          401: {
            description: "Refresh token missing or expired; user must re-login",
            content: {
              "application/json": {
                example: {
                  success: false,
                  code: "INVALID_REFRESH_TOKEN",
                  message: "Invalid or expired refresh token. Please sign in.",
                },
              },
            },
          },
        },
      },
    },

    "/auth/logout": {
      post: {
        tags: ["Authentication"],
        summary: "Logout current session",
        description: `
> 💡 **Frontend Developer Note:**  
> - Invalidates the current refresh token in MongoDB and clears the \`refreshToken\` cookie.
> - Clear the \`accessToken\` and user state from Redux / local memory upon completion.
        `,
        responses: {
          200: {
            description: "Successfully logged out",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Logged out successfully.",
                },
              },
            },
          },
        },
      },
    },

    "/auth/logout-all": {
      post: {
        tags: ["Authentication"],
        summary: "Revoke all active sessions across devices",
        security: [{ BearerAuth: [] }],
        description: `
> 💡 **Frontend Developer Note:**  
> - Requires \`Authorization: Bearer <accessToken>\`.
> - Revokes all active refresh tokens for this user. Useful for security actions like "Sign out of all other devices".
        `,
        responses: {
          200: {
            description: "All user sessions revoked",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "All sessions have been revoked successfully.",
                },
              },
            },
          },
        },
      },
    },

    "/auth/forgot-password": {
      post: {
        tags: ["Authentication"],
        summary: "Request password reset OTP",
        description: `
> 💡 **Frontend Developer Note:**  
> - Dispatches a 6-digit password reset OTP to the user's registered email via Brevo.
> - Always returns HTTP \`200\` (even if email doesn't exist) to prevent user enumeration attacks.
        `,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "guest@example.com",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Reset code dispatched",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message:
                    "If an account with that email exists, a password reset code has been sent.",
                },
              },
            },
          },
        },
      },
    },

    "/auth/reset-password": {
      post: {
        tags: ["Authentication"],
        summary: "Set new password using OTP",
        description: `
> 💡 **Frontend Developer Note:**  
> - Validates the password reset OTP and immediately hashes the new password with bcrypt.
> - Clears existing refresh tokens so other active sessions are revoked.
> - Redirect user to the login screen after receiving \`success: true\`.
        `,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "otp", "newPassword"],
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "guest@example.com",
                  },
                  otp: { type: "string", example: "392817" },
                  newPassword: {
                    type: "string",
                    minLength: 6,
                    example: "NewSecurePassword456!",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Password reset successful",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message:
                    "Password reset successful. Please sign in with your new password.",
                },
              },
            },
          },
          400: {
            description: "Invalid or expired OTP code",
            content: {
              "application/json": {
                example: {
                  success: false,
                  message: "Invalid verification code.",
                },
              },
            },
          },
        },
      },
    },

    "/auth/me": {
      get: {
        tags: ["Authentication"],
        summary: "Get current authenticated profile",
        security: [{ BearerAuth: [] }],
        description: `
> 💡 **Frontend Developer Note:**  
> - Requires \`Authorization: Bearer <accessToken>\`.
> - Use on application initial load (e.g. \`App.js\` or Auth Provider) to restore current user identity into Redux state.
        `,
        responses: {
          200: {
            description: "Profile retrieved",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    user: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          401: {
            description: "Invalid or expired access token",
            content: {
              "application/json": {
                example: {
                  success: false,
                  code: "TOKEN_EXPIRED",
                  message:
                    "Access token has expired. Please refresh your session.",
                },
              },
            },
          },
        },
      },
    },

    // ==========================================
    // PUBLIC ROOM DISCOVERY
    // ==========================================
    "/api/v1/rooms/featured": {
      get: {
        tags: ["Public Rooms"],
        summary: "Get featured rooms for homepage",
        description: `
> 💡 **Frontend Developer Note:**  
> - Returns up to 6 active rooms flagged with \`featured: true\`.
> - Ideal for hero banners, landing page carousels, or high-converting promotional sections.
        `,
        responses: {
          200: {
            description: "Featured rooms list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    rooms: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Room" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/api/v1/rooms": {
      get: {
        tags: ["Public Rooms"],
        summary: "Search & filter active room categories",
        description: `
> 💡 **Frontend Developer Note:**  
> - **Date Availability Check:** When \`checkInDate\` and \`checkOutDate\` are supplied, the backend calculates real-time room availability for every category. Each room object in the response will include an \`availability\` field:
>   \`{ totalCapacity: 5, bookedCount: 2, availableCount: 3 }\`.
> - Use \`availableCount > 0\` to display "Available" or "Sold Out" badges in room cards.
> - Filter by multiple amenities using comma separation: \`?amenities=Free Wi-Fi,Swimming Pool Access\`.
        `,
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
            description: "Page number",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 10 },
            description: "Items per page",
          },
          {
            name: "category",
            in: "query",
            schema: {
              type: "string",
              enum: [
                "standard",
                "deluxe",
                "executive",
                "presidential_suite",
                "luxury_suite",
              ],
            },
          },
          {
            name: "minPrice",
            in: "query",
            schema: { type: "number" },
            description: "Minimum price per night",
          },
          {
            name: "maxPrice",
            in: "query",
            schema: { type: "number" },
            description: "Maximum price per night",
          },
          {
            name: "adults",
            in: "query",
            schema: { type: "integer" },
            description: "Required adult capacity",
          },
          {
            name: "children",
            in: "query",
            schema: { type: "integer" },
            description: "Required children capacity",
          },
          {
            name: "amenities",
            in: "query",
            schema: { type: "string" },
            description: "Comma-separated amenities",
          },
          {
            name: "checkInDate",
            in: "query",
            schema: { type: "string", format: "date" },
            example: "2026-12-01",
          },
          {
            name: "checkOutDate",
            in: "query",
            schema: { type: "string", format: "date" },
            example: "2026-12-04",
          },
          {
            name: "sortBy",
            in: "query",
            schema: { type: "string", default: "pricePerNight" },
          },
          {
            name: "order",
            in: "query",
            schema: { type: "string", enum: ["asc", "desc"], default: "asc" },
          },
        ],
        responses: {
          200: {
            description: "List of rooms with pagination & availability",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    page: { type: "number", example: 1 },
                    limit: { type: "number", example: 10 },
                    totalPages: { type: "number", example: 1 },
                    totalCount: { type: "number", example: 4 },
                    rooms: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Room" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/api/v1/rooms/{slug}": {
      get: {
        tags: ["Public Rooms"],
        summary: "Get room details by slug",
        description: `
> 💡 **Frontend Developer Note:**  
> - Use this endpoint on the single room detail page (e.g. \`/rooms/:slug\`).
> - Pass \`?checkInDate=YYYY-MM-DD&checkOutDate=YYYY-MM-DD\` in query params to instantly get calculated room availability for booking calendar selectors.
        `,
        parameters: [
          {
            name: "slug",
            in: "path",
            required: true,
            schema: { type: "string" },
            example: "deluxe-ocean-view-suite",
          },
          {
            name: "checkInDate",
            in: "query",
            schema: { type: "string", format: "date" },
            example: "2026-12-01",
          },
          {
            name: "checkOutDate",
            in: "query",
            schema: { type: "string", format: "date" },
            example: "2026-12-04",
          },
        ],
        responses: {
          200: {
            description: "Room detail",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    room: { $ref: "#/components/schemas/Room" },
                  },
                },
              },
            },
          },
          404: {
            description: "Room category not found",
          },
        },
      },
    },

    // ==========================================
    // CUSTOMER BOOKINGS
    // ==========================================
    "/api/v1/bookings": {
      post: {
        tags: ["Customer Bookings"],
        summary: "Create a new reservation",
        security: [{ BearerAuth: [] }],
        description: `
> 💡 **Frontend Developer Note:**  
> - Requires \`Authorization: Bearer <accessToken>\`.
> - **DO NOT calculate totals on client!** The backend derives nights from \`checkInDate\` and \`checkOutDate\`, calculates \`totalAmount\`, and validates room capacity.
> - Automatically generates a unique \`bookingReference\` (e.g., \`MLH-20261108-A9F4B2\`).
> - New bookings are created with \`status: "pending"\` and hold inventory for **30 minutes** (\`expiresAt\`).
> - Asynchronously dispatches branded confirmation emails to guest and alerts hotel admins.
        `,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "roomTypeId",
                  "checkInDate",
                  "checkOutDate",
                  "adults",
                  "fullName",
                  "email",
                ],
                properties: {
                  roomTypeId: {
                    type: "string",
                    example: "66f1234567890abcdef12345",
                  },
                  checkInDate: {
                    type: "string",
                    format: "date",
                    example: "2026-12-01",
                  },
                  checkOutDate: {
                    type: "string",
                    format: "date",
                    example: "2026-12-04",
                  },
                  numberOfRooms: {
                    type: "integer",
                    minimum: 1,
                    default: 1,
                    example: 1,
                  },
                  adults: { type: "integer", minimum: 1, example: 2 },
                  children: {
                    type: "integer",
                    minimum: 0,
                    default: 0,
                    example: 0,
                  },
                  fullName: { type: "string", example: "Jane Doe" },
                  email: {
                    type: "string",
                    format: "email",
                    example: "jane@example.com",
                  },
                  phone: { type: "string", example: "+2348012345678" },
                  specialRequests: {
                    type: "string",
                    example: "High floor, quiet corner room if possible.",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Reservation successfully created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: {
                      type: "string",
                      example: "Reservation successfully created.",
                    },
                    booking: { $ref: "#/components/schemas/Booking" },
                  },
                },
              },
            },
          },
          409: {
            description: "Insufficient room inventory for the requested dates",
            content: {
              "application/json": {
                example: {
                  success: false,
                  message:
                    "Insufficient availability for the selected dates. Only 1 room(s) remaining for this category.",
                },
              },
            },
          },
        },
      },
    },

    "/api/v1/bookings/my-bookings": {
      get: {
        tags: ["Customer Bookings"],
        summary: "Get my reservation history",
        security: [{ BearerAuth: [] }],
        description: `
> 💡 **Frontend Developer Note:**  
> - Returns all bookings created by the logged-in user.
> - Paginated (\`page\`, \`limit\`).
> - Supports optional filter by status (\`pending\`, \`confirmed\`, \`cancelled\`, \`completed\`).
        `,
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 10 },
          },
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: [
                "pending",
                "confirmed",
                "cancelled",
                "completed",
                "no_show",
              ],
            },
          },
        ],
        responses: {
          200: {
            description: "User reservations list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    page: { type: "number", example: 1 },
                    limit: { type: "number", example: 10 },
                    totalPages: { type: "number", example: 1 },
                    totalCount: { type: "number", example: 2 },
                    bookings: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Booking" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/api/v1/bookings/{bookingReference}": {
      get: {
        tags: ["Customer Bookings"],
        summary: "Get reservation details by reference",
        security: [{ BearerAuth: [] }],
        description: `
> 💡 **Frontend Developer Note:**  
> - Accessible by the booking creator or hotel admin.
> - Use this endpoint on the booking confirmation summary page (e.g., \`/booking/confirmation/:bookingReference\`).
        `,
        parameters: [
          {
            name: "bookingReference",
            in: "path",
            required: true,
            schema: { type: "string" },
            example: "MLH-20261108-A9F4B2",
          },
        ],
        responses: {
          200: {
            description: "Reservation details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    booking: { $ref: "#/components/schemas/Booking" },
                  },
                },
              },
            },
          },
          404: {
            description: "Reservation not found",
          },
        },
      },
    },

    "/api/v1/bookings/{bookingReference}/cancel": {
      post: {
        tags: ["Customer Bookings"],
        summary: "Cancel reservation",
        security: [{ BearerAuth: [] }],
        description: `
> 💡 **Frontend Developer Note:**  
> - Cancels the reservation, releases any assigned physical rooms, records \`cancelledAt\` and \`cancellationReason\`.
> - Sends an automated cancellation confirmation email to the guest.
> - Only active reservations (\`pending\` or \`confirmed\`) can be cancelled.
        `,
        parameters: [
          {
            name: "bookingReference",
            in: "path",
            required: true,
            schema: { type: "string" },
            example: "MLH-20261108-A9F4B2",
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  reason: {
                    type: "string",
                    example: "Change in holiday travel schedule.",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Reservation successfully cancelled",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Reservation has been successfully cancelled.",
                  bookingReference: "MLH-20261108-A9F4B2",
                  status: "cancelled",
                },
              },
            },
          },
        },
      },
    },

    // ==========================================
    // ADMIN - ROOM CATEGORY MANAGEMENT
    // ==========================================
    "/api/v1/admin/rooms": {
      post: {
        tags: ["Admin - Room Management"],
        summary: "Create new room category with images",
        security: [{ BearerAuth: [] }],
        description: `
> 💡 **Frontend Developer Note:**  
> - Requires \`admin\` role and \`Content-Type: multipart/form-data\`.
> - Attach up to 10 image files under the \`images\` field.
> - Supports array or comma-separated string for \`amenities\` (e.g. \`amenities: "Free Wi-Fi, Air Conditioning, Smart TV"\`).
        `,
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: [
                  "name",
                  "description",
                  "category",
                  "pricePerNight",
                  "totalRooms",
                ],
                properties: {
                  name: { type: "string", example: "Executive Ocean Suite" },
                  description: {
                    type: "string",
                    example: "Luxury suite on the upper penthouse levels.",
                  },
                  category: {
                    type: "string",
                    enum: [
                      "standard",
                      "deluxe",
                      "executive",
                      "presidential_suite",
                      "luxury_suite",
                    ],
                    example: "executive",
                  },
                  pricePerNight: { type: "number", example: 120000 },
                  roomSize: { type: "number", example: 60 },
                  bedType: {
                    type: "string",
                    enum: ["single", "double", "queen", "king", "twin"],
                    example: "king",
                  },
                  numberOfBeds: { type: "number", example: 1 },
                  maximumAdults: { type: "number", example: 2 },
                  maximumChildren: { type: "number", example: 2 },
                  totalRooms: { type: "number", example: 4 },
                  amenities: {
                    type: "string",
                    example:
                      "Free Wi-Fi, Swimming Pool Access, Ocean View, Smart TV, Air Conditioning",
                  },
                  smokingAllowed: { type: "boolean", default: false },
                  petsAllowed: { type: "boolean", default: false },
                  cancellationPolicy: {
                    type: "string",
                    example: "Free cancellation up to 48 hours before check-in",
                  },
                  checkInTime: { type: "string", default: "14:00" },
                  checkOutTime: { type: "string", default: "12:00" },
                  featured: { type: "boolean", default: false },
                  status: {
                    type: "string",
                    enum: ["active", "inactive"],
                    default: "active",
                  },
                  images: {
                    type: "array",
                    items: { type: "string", format: "binary" },
                    description: "Up to 10 image files (JPEG, PNG, WebP)",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Room category created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: {
                      type: "string",
                      example: "Room category created successfully.",
                    },
                    room: { $ref: "#/components/schemas/Room" },
                  },
                },
              },
            },
          },
          403: {
            description: "Forbidden: Not an admin",
          },
        },
      },
      get: {
        tags: ["Admin - Room Management"],
        summary: "List all room categories (Admin view)",
        security: [{ BearerAuth: [] }],
        description: `
> 💡 **Frontend Developer Note:**  
> - Returns both active and inactive room categories.
> - Includes creator user information, image counts, and pagination controls.
        `,
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 10 },
          },
          { name: "category", in: "query", schema: { type: "string" } },
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["active", "inactive"] },
          },
          { name: "search", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Room list with pagination",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    page: { type: "number", example: 1 },
                    limit: { type: "number", example: 10 },
                    totalPages: { type: "number", example: 1 },
                    totalCount: { type: "number", example: 5 },
                    rooms: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Room" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/api/v1/admin/rooms/{id}": {
      get: {
        tags: ["Admin - Room Management"],
        summary: "Get room category by ID with its physical inventory",
        security: [{ BearerAuth: [] }],
        description: `
> 💡 **Frontend Developer Note:**  
> - Returns the room category document alongside all registered physical room instances in \`inventory\`.
        `,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Room category and inventory details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    room: { $ref: "#/components/schemas/Room" },
                    inventory: {
                      type: "array",
                      items: { $ref: "#/components/schemas/RoomInventory" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      put: {
        tags: ["Admin - Room Management"],
        summary: "Update room category",
        security: [{ BearerAuth: [] }],
        description: `
> 💡 **Frontend Developer Note:**  
> - Supports \`multipart/form-data\` if uploading new images (which get appended to existing ones) or \`application/json\` for pure field updates.
        `,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  category: {
                    type: "string",
                    enum: [
                      "standard",
                      "deluxe",
                      "executive",
                      "presidential_suite",
                      "luxury_suite",
                    ],
                  },
                  pricePerNight: { type: "number" },
                  totalRooms: { type: "number" },
                  status: { type: "string", enum: ["active", "inactive"] },
                  featured: { type: "boolean" },
                  images: {
                    type: "array",
                    items: { type: "string", format: "binary" },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Room category updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: {
                      type: "string",
                      example: "Room category updated successfully.",
                    },
                    room: { $ref: "#/components/schemas/Room" },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Admin - Room Management"],
        summary: "Delete room category",
        security: [{ BearerAuth: [] }],
        description: `
> 💡 **Frontend Developer Note:**  
> - Will **refuse deletion (HTTP \`400\`)** if active reservations (\`pending\` or \`confirmed\`) exist for this room.
> - If safe to delete, automatically removes images from Cloudinary and deletes physical room inventories.
        `,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Room category deleted",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message:
                    "Room category and associated inventory deleted successfully.",
                },
              },
            },
          },
          400: {
            description: "Cannot delete room with active reservations",
          },
        },
      },
    },

    // ==========================================
    // ADMIN - PHYSICAL INVENTORY MANAGEMENT
    // ==========================================
    "/api/v1/admin/rooms/{id}/inventory": {
      post: {
        tags: ["Admin - Inventory Management"],
        summary: "Add physical room instance to category",
        security: [{ BearerAuth: [] }],
        description: `
> 💡 **Frontend Developer Note:**  
> - Registers an individual physical room unit (e.g. Room 204 on Floor 2).
> - Room numbers must be unique across the hotel.
        `,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Room Category ID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["roomNumber", "floor"],
                properties: {
                  roomNumber: { type: "string", example: "204" },
                  floor: { type: "integer", example: 2 },
                  status: {
                    type: "string",
                    enum: ["available", "maintenance", "inactive"],
                    default: "available",
                  },
                  notes: {
                    type: "string",
                    example: "Newly painted; balcony facing garden.",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Physical room added",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: {
                      type: "string",
                      example: "Physical room added to inventory successfully.",
                    },
                    inventoryItem: {
                      $ref: "#/components/schemas/RoomInventory",
                    },
                  },
                },
              },
            },
          },
          409: {
            description: "Room number already exists",
          },
        },
      },
    },

    "/api/v1/admin/inventory": {
      get: {
        tags: ["Admin - Inventory Management"],
        summary: "List physical room inventory",
        security: [{ BearerAuth: [] }],
        description: `
> 💡 **Frontend Developer Note:**  
> - Filter physical rooms by \`roomTypeId\`, \`status\`, or \`floor\`.
        `,
        parameters: [
          { name: "roomTypeId", in: "query", schema: { type: "string" } },
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: ["available", "maintenance", "inactive"],
            },
          },
          { name: "floor", in: "query", schema: { type: "integer" } },
        ],
        responses: {
          200: {
            description: "Physical room inventories",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    totalCount: { type: "number", example: 12 },
                    inventory: {
                      type: "array",
                      items: { $ref: "#/components/schemas/RoomInventory" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/api/v1/admin/inventory/{inventoryId}": {
      put: {
        tags: ["Admin - Inventory Management"],
        summary: "Update physical room status or details",
        security: [{ BearerAuth: [] }],
        description: `
> 💡 **Frontend Developer Note:**  
> - Use this to mark rooms as \`maintenance\` during repairs or housekeeping, taking them out of the booking availability pool.
        `,
        parameters: [
          {
            name: "inventoryId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  roomNumber: { type: "string", example: "204" },
                  floor: { type: "integer", example: 2 },
                  status: {
                    type: "string",
                    enum: ["available", "maintenance", "inactive"],
                  },
                  notes: {
                    type: "string",
                    example: "AC servicing in progress",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Inventory updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: {
                      type: "string",
                      example: "Room inventory item updated successfully.",
                    },
                    inventory: { $ref: "#/components/schemas/RoomInventory" },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Admin - Inventory Management"],
        summary: "Delete physical room unit",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "inventoryId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Room inventory item deleted",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Room inventory item removed successfully.",
                },
              },
            },
          },
        },
      },
    },

    // ==========================================
    // ADMIN - BOOKING MANAGEMENT
    // ==========================================
    "/api/v1/admin/bookings": {
      get: {
        tags: ["Admin - Booking Management"],
        summary: "List all hotel bookings with filters",
        security: [{ BearerAuth: [] }],
        description: `
> 💡 **Frontend Developer Note:**  
> - Powerful search across \`bookingReference\`, guest \`fullName\`, \`email\`, or \`phone\`.
> - Filter by reservation status (\`pending\`, \`confirmed\`, \`cancelled\`, \`completed\`, \`no_show\`).
> - Filter by check-in / check-out date windows.
        `,
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 10 },
          },
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: [
                "pending",
                "confirmed",
                "cancelled",
                "completed",
                "no_show",
              ],
            },
          },
          { name: "roomTypeId", in: "query", schema: { type: "string" } },
          {
            name: "search",
            in: "query",
            schema: { type: "string" },
            description: "Reference, guest name, email, phone",
          },
          {
            name: "checkInDate",
            in: "query",
            schema: { type: "string", format: "date" },
          },
          {
            name: "checkOutDate",
            in: "query",
            schema: { type: "string", format: "date" },
          },
        ],
        responses: {
          200: {
            description: "Bookings list with pagination",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    page: { type: "number", example: 1 },
                    limit: { type: "number", example: 10 },
                    totalPages: { type: "number", example: 1 },
                    totalCount: { type: "number", example: 8 },
                    bookings: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Booking" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/api/v1/admin/bookings/{id}": {
      get: {
        tags: ["Admin - Booking Management"],
        summary: "Get full booking breakdown",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Complete reservation record",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    booking: { $ref: "#/components/schemas/Booking" },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/api/v1/admin/bookings/{id}/status": {
      patch: {
        tags: ["Admin - Booking Management"],
        summary: "Update booking status (confirmed, completed, etc.)",
        security: [{ BearerAuth: [] }],
        description: `
> 💡 **Frontend Developer Note:**  
> - Transitions booking status:
>   - \`confirmed\`: Clears pending expiry and records \`confirmedAt\`.
>   - \`cancelled\`: Releases physical room inventory and records \`cancelledAt\`.
>   - \`completed\`: Records \`completedAt\`.
> - **Sends an automatic branded email notification to the guest** updating them on the change with your custom \`reason\` or notes.
        `,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: {
                    type: "string",
                    enum: [
                      "pending",
                      "confirmed",
                      "cancelled",
                      "completed",
                      "no_show",
                    ],
                    example: "confirmed",
                  },
                  adminNotes: {
                    type: "string",
                    example: "Payment verified via bank wire transfer.",
                  },
                  reason: {
                    type: "string",
                    example: "Reservation officially confirmed by front desk.",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Booking status updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: {
                      type: "string",
                      example: "Booking status updated to confirmed.",
                    },
                    booking: { $ref: "#/components/schemas/Booking" },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/api/v1/admin/bookings/{id}/assign-rooms": {
      post: {
        tags: ["Admin - Booking Management"],
        summary: "Assign physical room numbers to reservation",
        security: [{ BearerAuth: [] }],
        description: `
> 💡 **Frontend Developer Note:**  
> - Allows admin to allocate specific physical room keys/numbers (e.g. Room 201) to a guest reservation.
> - The backend checks that each room belongs to the category and is NOT double-booked across the same dates.
        `,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["roomInventoryIds"],
                properties: {
                  roomInventoryIds: {
                    type: "array",
                    items: { type: "string" },
                    example: ["66f9876543210fedcba54321"],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Physical rooms assigned successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: {
                      type: "string",
                      example: "Physical rooms assigned successfully.",
                    },
                    booking: { $ref: "#/components/schemas/Booking" },
                  },
                },
              },
            },
          },
          409: {
            description:
              "Conflict: One or more selected rooms are already occupied for these dates",
          },
        },
      },
    },
  },
};

module.exports = swaggerSpec;
