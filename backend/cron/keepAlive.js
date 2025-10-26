import cron from "node-cron";
import axios from "axios";

let cronJob = null;

/**
 * Initialize the keep-alive cron job
 * Pings the site every 15 minutes to prevent it from sleeping due to inactivity
 * @param {string} siteUrl - The URL of the site to ping (e.g., http://localhost:5000 or https://your-site.com)
 */
export const initializeKeepAlive = (siteUrl) => {
  if (!siteUrl) {
    console.warn(
      "⚠️  Keep-alive URL not provided. Site may go to sleep due to inactivity.",
    );
    return;
  }

  // Stop any existing cron job
  if (cronJob) {
    cronJob.stop();
    console.log("🛑 Previous keep-alive cron job stopped");
  }

  // Cron job runs every 15 minutes
  // Schedule: */15 * * * * (every 15 minutes)
  // minute: 0-59, hour: 0-23, day: 1-31, month: 1-12, weekday: 0-6
  cronJob = cron.schedule("*/15 * * * *", async () => {
    try {
      const timestamp = new Date().toISOString();
      console.log(`\n📍 [${timestamp}] Sending keep-alive ping to ${siteUrl}`);

      const response = await axios.get(siteUrl, {
        timeout: 10000, // 10 second timeout
        headers: {
          "User-Agent": "Keep-Alive-Bot/1.0",
        },
      });

      const statusCode = response.status;
      const message =
        statusCode === 200
          ? "✅ Keep-alive ping successful"
          : `⚠️  Keep-alive ping returned status ${statusCode}`;

      console.log(
        `${message} at ${timestamp} (Response time: ${response.headers["x-response-time"] || "N/A"})`,
      );
    } catch (error) {
      const timestamp = new Date().toISOString();
      console.error(`❌ [${timestamp}] Keep-alive ping failed:`, error.message);

      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Data: ${JSON.stringify(error.response.data)}`);
      } else if (error.code) {
        console.error(`   Error Code: ${error.code}`);
      }
    }
  });

  console.log(
    "✅ Keep-alive cron job initialized - will ping every 15 minutes",
  );
  console.log(`   Target URL: ${siteUrl}`);
  console.log(`   Schedule: Every 15 minutes (*/15 * * * *)`);

  // Send first ping immediately
  pingNow(siteUrl);
};

/**
 * Send an immediate ping to the site
 * @param {string} siteUrl - The URL to ping
 */
const pingNow = async (siteUrl) => {
  try {
    const response = await axios.get(siteUrl, {
      timeout: 10000,
      headers: {
        "User-Agent": "Keep-Alive-Bot/1.0",
      },
    });
    console.log(
      `✅ Initial keep-alive ping successful (Status: ${response.status})`,
    );
  } catch (error) {
    console.warn(`⚠️  Initial keep-alive ping failed: ${error.message}`);
  }
};

/**
 * Stop the keep-alive cron job
 */
export const stopKeepAlive = () => {
  if (cronJob) {
    cronJob.stop();
    console.log("🛑 Keep-alive cron job stopped");
    cronJob = null;
  }
};

/**
 * Get the status of the keep-alive cron job
 * @returns {object} Status information
 */
export const getKeepAliveStatus = () => {
  return {
    isRunning: cronJob ? !cronJob._destroyed : false,
    schedule: "Every 15 minutes",
    lastRun: cronJob ? cronJob._lastExecution : null,
    nextRun: cronJob ? cronJob._nextInvocation : null,
  };
};

export default {
  initializeKeepAlive,
  stopKeepAlive,
  getKeepAliveStatus,
};
