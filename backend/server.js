import http from "http";
import app from "./app.js";
import { connectDB } from "./config/database.config.js";
import logger from "./utils/logging/logger.js";
import { initializeSocketIO } from "./socket/socket.js";

const PORT = process.env.PORT || 5004;

const startServer = async () => {
  try {
    console.log("Starting server...");
    await connectDB();
    console.log("Database connected successfully");

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize Socket.io
    initializeSocketIO(server);
    console.log("Socket.IO initialized successfully");

    // Start server
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      console.log(`Server is listening on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(
        `CORS allowed origins: ${JSON.stringify(
          app.get("corsAllowedOrigins") || "All origins"
        )}`
      );
    });

    // Handle server errors
    server.on("error", (error) => {
      logger.error("Server error:", error);
      console.error("Server error:", error.message, error.stack);
      process.exit(1);
    });

    // Global error handler
    process.on("unhandledRejection", (err) => {
      logger.error("UNHANDLED REJECTION! Shutting down...", err);
      console.error("Unhandled Rejection:", err.message, err.stack);
      server.close(() => {
        process.exit(1);
      });
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    console.error("Failed to start server:", error.message, error.stack);
    process.exit(1);
  }
};

startServer();