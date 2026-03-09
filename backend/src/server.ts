import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { createServer } from "http";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import skillsRoutes from "./routes/skills";
import matchesRoutes, { messagesRouter } from "./routes/matches";
import requestsRoutes from "./routes/requests";
import messagesRoutes from "./routes/messages";
import gamificationRoutes from "./routes/gamification";
import ratingsRoutes from "./routes/ratings";
import notificationsRoutes from "./routes/notifications";

import { initializeSocket } from "./socket";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// Security: Helmet middleware for security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: [
          "'self'",
          "http://localhost:4173",
          "http://localhost:5173",
        ],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding for development
  }),
);

// Security: Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use(limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "test" ? 1000 : 5, // Higher limit for tests
  message: {
    error: "Too many authentication attempts, please try again later.",
  },
  skipSuccessfulRequests: true, // Don't count successful requests
});

// CORS middleware - Allow all localhost ports for development
const defaultOrigins = [
  "http://localhost:4173",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:5177",
];

// Only use CORS_ORIGIN if it's properly defined and not a wildcard or invalid
const corsOrigins: string[] =
  process.env.CORS_ORIGIN &&
  process.env.CORS_ORIGIN !== "http://localhost:*" &&
  !process.env.CORS_ORIGIN.includes("*")
    ? process.env.CORS_ORIGIN.split(",")
    : defaultOrigins;

// Default CORS origin to use when no origin header is provided
const defaultCorsOrigin = corsOrigins[0] || "http://localhost:5173";

// Add explicit CORS headers for ALL requests (before cors middleware)
app.use((req, res, next) => {
  // Set CORS headers for all responses
  const origin = req.headers.origin || defaultCorsOrigin;
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH");
  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      // In production, you would want to be more restrictive
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, origin || true);
      } else {
        // Check if origin matches any pattern (for dynamic origins)
        const isAllowed = corsOrigins.some(
          (o) => origin?.startsWith(o.replace(/\/$/, "")) || o === "*",
        );
        if (isAllowed) {
          callback(null, origin);
        } else {
          callback(null, corsOrigins[0]); // Fallback to first origin
        }
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Security: Input sanitization middleware
app.use((req, res, next) => {
  // Sanitize request body to prevent XSS
  if (req.body && typeof req.body === "object") {
    sanitizeObject(req.body);
  }
  next();
});

// Helper function to sanitize strings in an object
function sanitizeObject(obj: any): void {
  for (const key in obj) {
    if (typeof obj[key] === "string") {
      // Basic XSS prevention - remove script tags and dangerous content
      obj[key] = obj[key]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/javascript:/gi, "")
        .replace(/on\w+\s*=/gi, ""); // Remove event handlers
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}

// Health check endpoint - must be before authenticated routes
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Apply stricter rate limiting to auth routes
app.use("/auth", authLimiter, authRoutes);

// Routes - Order matters! More specific routes first
app.use(skillsRoutes);
app.use("/users", userRoutes);
app.use("/matches", matchesRoutes);

app.use("/requests", requestsRoutes);
app.use("/messages", messagesRouter);
app.use("/gamification", gamificationRoutes);
app.use("/ratings", ratingsRoutes);
app.use("/notifications", notificationsRoutes);

// Security: HTTPS enforcement for production
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.header("x-forwarded-proto") !== "https") {
      res.redirect(`https://${req.header("host")}${req.url}`);
    } else {
      next();
    }
  });
}

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("Error:", err);

    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === "development";

    res.status(err.status || 500).json({
      error: err.message || "Internal Server Error",
      ...(isDevelopment && { stack: err.stack }),
      // Add security headers to error responses
      ...(isDevelopment && { details: err.details }),
    });
  },
);

// Initialize WebSocket server
const io = initializeSocket(httpServer);

// Start server only if not in test mode or if explicitly requested
// This prevents port conflicts during testing
const isTestEnvironment = process.env.NODE_ENV === "test";
const shouldStartServer =
  !isTestEnvironment || process.env.FORCE_START_SERVER === "true";

if (shouldStartServer) {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(
      `🔒 Security: Helmet, Rate Limiting, Input Sanitization enabled`,
    );
    console.log(`🔌 WebSocket: Socket.io initialized`);
  });
}

export default app;
export { httpServer, io };
