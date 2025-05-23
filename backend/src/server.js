import http from "http";
import app from "./app.js";
import { connectDB } from "./config/database.config.js";
import logger from "./utils/logging/logger.js";
import { initializeSocketIO } from "./socket/socket.js";

const PORT = process.env.PORT || 5004;

const startServer = async () => {
  try {
    await connectDB();

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize Socket.io
    initializeSocketIO(server);

    // Start server
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(
        `CORS allowed origins: ${JSON.stringify(
          app.get("corsAllowedOrigins") || "All origins"
        )}`
      );
    });

    // Global error handler
    process.on("unhandledRejection", (err) => {
      logger.error("UNHANDLED REJECTION! Shutting down...", err);
      console.error(err);

      // Give the server time to send any pending responses before shutting down
      server.close(() => {
        process.exit(1);
      });
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
