import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.routes.js";
import userRoutes from "./routes/user.routes.js";
import keepAliveRoutes from "./routes/keepAlive.routes.js";
import { app, server } from "./socket/socket.js";
import connectToMongoDB from "./db/connectToMongoDB.js";
import { initializeKeepAlive, stopKeepAlive } from "./cron/keepAlive.js";

dotenv.config();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

// Security middleware
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// Body parsing middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/keepalive", keepAliveRoutes);

// Serve static files
app.use(express.static(path.join(__dirname, "/frontend/Sjx_chat/dist")));

// Handle all other routes
app.get("*", (req, res) => {
  res.sendFile(
    path.join(__dirname, "frontend", "Sjx_chat", "dist", "index.html"),
  );
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start server
server.listen(PORT, async () => {
  try {
    await connectToMongoDB();
    console.log(`Server running on port ${PORT}`);

    // Initialize keep-alive cron job to prevent site from sleeping
    const SITE_URL = process.env.SITE_URL || `http://localhost:${PORT}`;
    initializeKeepAlive(SITE_URL);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("\n📛 SIGTERM signal received: closing HTTP server");
  stopKeepAlive();
  server.close(() => {
    console.log("🛑 HTTP server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("\n📛 SIGINT signal received: closing HTTP server");
  stopKeepAlive();
  server.close(() => {
    console.log("🛑 HTTP server closed");
    process.exit(0);
  });
});
