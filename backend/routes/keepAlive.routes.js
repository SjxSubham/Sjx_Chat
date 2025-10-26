import express from "express";
import { getKeepAliveStatus } from "../cron/keepAlive.js";

const router = express.Router();

/**
 * GET /api/keepalive/status
 * Get the current status of the keep-alive cron job
 */
router.get("/status", (req, res) => {
  try {
    const status = getKeepAliveStatus();
    res.json({
      success: true,
      message: "Keep-alive status retrieved successfully",
      data: status,
    });
  } catch (error) {
    console.error("Error getting keep-alive status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get keep-alive status",
      error: error.message,
    });
  }
});

/**
 * GET /api/keepalive/health
 * Health check endpoint for keep-alive pings
 * Returns 200 OK to confirm the server is running
 */
router.get("/health", (req, res) => {
  try {
    const timestamp = new Date().toISOString();
    res.json({
      success: true,
      message: "Server is healthy and responsive",
      timestamp: timestamp,
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      port: process.env.PORT || 5000,
    });
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({
      success: false,
      message: "Health check failed",
      error: error.message,
    });
  }
});

/**
 * GET /api/keepalive/info
 * Get detailed information about the keep-alive system
 */
router.get("/info", (req, res) => {
  try {
    const status = getKeepAliveStatus();
    const siteUrl = process.env.SITE_URL || `http://localhost:${process.env.PORT || 5000}`;

    res.json({
      success: true,
      message: "Keep-alive system information",
      data: {
        isActive: status.isRunning,
        schedule: "Every 15 minutes",
        cronPattern: "*/15 * * * *",
        targetUrl: siteUrl,
        description: "Pings the site every 15 minutes to prevent it from going to sleep due to inactivity",
        startedAt: new Date(process.uptime() * 1000),
        serverUptime: `${Math.floor(process.uptime())} seconds`,
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || "development",
      },
    });
  } catch (error) {
    console.error("Error getting keep-alive info:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get keep-alive info",
      error: error.message,
    });
  }
});

export default router;
