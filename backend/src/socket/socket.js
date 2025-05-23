import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import logger from "../utils/logging/logger.js";
import { verifyAccessToken } from "../utils/auth/jwt.utils.js";

// Redis client for Socket.io pub/sub
const pubClient = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
});

const subClient = pubClient.duplicate();

let io;

export const initializeSocketIO = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? process.env.CLIENT_URL
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
  });

  // Set up Redis adapter for horizontal scaling
  io.adapter(createAdapter(pubClient, subClient));

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      // No token, proceed as anonymous user
      if (!token) {
        socket.isAnonymous = true;
        return next();
      }

      try {
        const decoded = await verifyAccessToken(token);
        if (decoded) {
          socket.userId = decoded.id;
          socket.user = { _id: decoded.id };
          socket.isAnonymous = false;
        }
      } catch (error) {
        // Handle token verification errors gracefully
        socket.isAnonymous = true;

        // Only log non-expiration errors as warnings
        if (error.name !== 'TokenExpiredError') {
          logger.warn(`Socket optional authentication failed: ${error.message}`);
        }
        // Don't log expired tokens at all to reduce noise
      }

      // Always proceed to next middleware - either authenticated or anonymous
      next();
    } catch (error) {
      // This catch block handles unexpected errors in the middleware itself
      logger.error(`Socket middleware error: ${error.message}`);
      socket.isAnonymous = true; // Fall back to anonymous access
      next(); // Continue rather than failing the connection
    }
  });

  // Connection handler
  io.on("connection", (socket) => {
    // Only log authenticated user connections to reduce noise
    if (socket.userId) {
      logger.info(`User connected: ${socket.userId}`);
      // Join user-specific room
      socket.join(`user:${socket.userId}`);
    }

    // Listen for client events
    socket.on("subscribe:product", (productId) => {
      socket.join(`product:${productId}`);
      // Only log authenticated user subscriptions
      if (socket.userId) {
        logger.info(`User ${socket.userId} subscribed to product ${productId}`);
      }
    });

    socket.on("unsubscribe:product", (productId) => {
      socket.leave(`product:${productId}`);
      // Only log authenticated user unsubscriptions
      if (socket.userId) {
        logger.info(`User ${socket.userId} unsubscribed from product ${productId}`);
      }
    });

    // Subscribe to view analytics for a product (for product owners)
    socket.on("subscribe:product:views", async (productId) => {
      try {
        // Skip permission check for anonymous users
        if (socket.isAnonymous) {
          logger.warn(`Anonymous user attempted to subscribe to product views for ${productId}`);
          return;
        }

        // Verify that the user is the product owner or admin
        const Product = (await import('../models/product/product.model.js')).default;
        const product = await Product.findById(productId).select('maker').lean();

        if (product && (product.maker?.toString() === socket.userId || socket.user.role === 'admin')) {
          socket.join(`product:${productId}:views`);
          logger.info(`User ${socket.userId} subscribed to view analytics for product ${productId}`);
        } else {
          logger.warn(`User ${socket.userId} attempted to subscribe to view analytics for product ${productId} without permission`);
        }
      } catch (error) {
        logger.error(`Error in subscribe:product:views: ${error.message}`);
      }
    });

    socket.on("unsubscribe:product:views", (productId) => {
      socket.leave(`product:${productId}:views`);
      // Only log authenticated user unsubscriptions
      if (socket.userId) {
        logger.info(`User ${socket.userId} unsubscribed from view analytics for product ${productId}`);
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      // Only log authenticated user disconnections to reduce noise
      if (socket.userId) {
        logger.info(`User disconnected: ${socket.userId}`);
      }
    });
  });

  logger.info("Socket.io initialized successfully");
  return io;
};

export const checkSocketConnection = () => {
  if (!io) {
    throw new Error("Socket.io is not initialized");
  }
  return io;
};

export { io };
