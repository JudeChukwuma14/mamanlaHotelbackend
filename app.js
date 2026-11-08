const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const ENV = require("./src/config/env");
const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/auth.routes");

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration supporting credentials (cookies)
const allowedOrigins = [ENV.frontend_url, "http://localhost:3000", "http://localhost:5173", "http://localhost:5174"];
app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps, curl, Postman)
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error("CORS policy violation: origin not allowed"));
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);

// Cookie parser for HttpOnly refresh tokens
app.use(cookieParser());

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Authentication routes
app.use("/auth", authRoutes);

// 404 Route Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Endpoint ${req.method} ${req.originalUrl} not found.`
    });
});

// Centralized error handler
app.use((err, req, res, next) => {
    if (err.name === "UnauthorizedError") {
        return res.status(401).json({ success: false, message: "Unauthorized request." });
    }
    console.error("[Unhandled Error]:", err.message);
    return res.status(500).json({
        success: false,
        message: err.message || "An internal server error occurred."
    });
});

const startServer = async () => {
    await connectDB();
    app.listen(ENV.port, () => {
        console.log(`Server is active on port ${ENV.port}`);
    });
};

// Only automatically start the server if executed directly (not imported during tests)
if (require.main === module) {
    startServer();
}

module.exports = app;
