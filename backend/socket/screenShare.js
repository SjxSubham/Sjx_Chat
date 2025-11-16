import { getReceiverSocketId, io } from "./socket.js";
import crypto from "crypto";

const screenShareSessions = {}; // {roomId: {initiatorId, receiverId, initiatorSocketId, receiverSocketId, isActive, startTime, encryptionKey, ...}}
const activeSharesByConversation = {}; // {conversationId: roomId} - Track one active share per conversation

/**
 * Generate a random encryption key for this session
 * @returns {string} Base64 encoded 32-byte key
 */
function generateEncryptionKey() {
  return crypto.randomBytes(32).toString("base64");
}

/**
 * Encrypt data using AES-256-GCM
 * @param {string} data - Data to encrypt (base64 image data)
 * @param {string} keyBase64 - Base64 encoded encryption key
 * @returns {object} {iv, encryptedData, authTag} all base64 encoded
 */
function encryptData(data, keyBase64) {
  try {
    const key = Buffer.from(keyBase64, "base64");
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return {
      iv: iv.toString("base64"),
      encryptedData: encrypted,
      authTag: authTag.toString("base64"),
    };
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt screen data");
  }
}

/**
 * Decrypt data using AES-256-GCM
 * @param {object} encryptedPayload - {iv, encryptedData, authTag} all base64 encoded
 * @param {string} keyBase64 - Base64 encoded encryption key
 * @returns {string} Decrypted base64 image data
 */
function decryptData(encryptedPayload, keyBase64) {
  try {
    const key = Buffer.from(keyBase64, "base64");
    const iv = Buffer.from(encryptedPayload.iv, "base64");
    const authTag = Buffer.from(encryptedPayload.authTag, "base64");
    const encryptedData = encryptedPayload.encryptedData;

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt screen data");
  }
}

/**
 * Format duration in seconds to human-readable format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration (e.g., "1h 23m 45s")
 */
function formatDuration(seconds) {
  if (seconds < 0) return "0s";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(" ");
}

export const initializeScreenShareHandlers = (socket) => {
  /**
   * Initiate screen share request
   * Checks if there's already an active share in this conversation
   */
  socket.on(
    "initiate-screen-share",
    ({ receiverId, initiatorId, conversationId, roomId }) => {
      try {
        const receiverSocketId = getReceiverSocketId(receiverId);

        if (!receiverSocketId) {
          socket.emit("screen-share-error", {
            error: "Recipient is not available",
          });
          return;
        }

        // Check if there's already an active screen share in this conversation
        if (activeSharesByConversation[conversationId]) {
          socket.emit("screen-share-error", {
            error:
              "Screen sharing is already active in this conversation. Wait for it to finish.",
          });
          return;
        }

        const generatedRoomId =
          roomId ||
          `screen-share-${conversationId}-${initiatorId}-${Date.now()}`;
        const encryptionKey = generateEncryptionKey();

        screenShareSessions[generatedRoomId] = {
          initiatorId,
          receiverId,
          conversationId,
          isActive: false,
          startTime: null,
          duration: 0,
          initiatorSocketId: socket.id,
          receiverSocketId: receiverSocketId,
          encryptionKey: encryptionKey,
          frameCount: 0,
        };

        // Mark this conversation as having an active share
        activeSharesByConversation[conversationId] = generatedRoomId;

        // Send request to receiver with encryption key
        io.to(receiverSocketId).emit("screen-share-request", {
          initiatorId,
          roomId: generatedRoomId,
          encryptionKey: encryptionKey, // Both users get the same key
        });

        console.log(
          `[Screen Share] Request initiated: ${initiatorId} -> ${receiverId} (Room: ${generatedRoomId})`,
        );
      } catch (error) {
        console.error("Error initiating screen share:", error);
        socket.emit("screen-share-error", {
          error: "Failed to initiate screen share",
        });
      }
    },
  );

  /**
   * Accept screen share request
   */
  socket.on(
    "accept-screen-share",
    ({ initiatorId, receiverId, roomId, conversationId }) => {
      try {
        const initiatorSocketId = getReceiverSocketId(initiatorId);

        if (!screenShareSessions[roomId]) {
          socket.emit("screen-share-error", {
            error: "Screen share session not found",
          });
          return;
        }

        const session = screenShareSessions[roomId];
        session.isActive = true;
        session.startTime = Date.now();

        // Join both users to a room for efficient streaming
        socket.join(roomId);

        if (initiatorSocketId) {
          // Notify initiator to join room
          io.to(initiatorSocketId).emit("screen-share-accepted", {
            roomId,
            encryptionKey: session.encryptionKey,
          });

          // Get initiator socket and make them join room too
          const initiatorSocket = io.sockets.sockets.get(initiatorSocketId);
          if (initiatorSocket) {
            initiatorSocket.join(roomId);
            console.log(
              `[Screen Share] Accepted: Both users joined room ${roomId}`,
            );
          }
        }
      } catch (error) {
        console.error("Error accepting screen share:", error);
        socket.emit("screen-share-error", {
          error: "Failed to accept screen share",
        });
      }
    },
  );

  /**
   * Reject screen share request
   */
  socket.on(
    "reject-screen-share",
    ({ initiatorId, roomId, conversationId }) => {
      try {
        const initiatorSocketId = getReceiverSocketId(initiatorId);

        if (screenShareSessions[roomId]) {
          const session = screenShareSessions[roomId];
          delete activeSharesByConversation[session.conversationId];
          delete screenShareSessions[roomId];
        }

        if (initiatorSocketId) {
          io.to(initiatorSocketId).emit("screen-share-rejected", { roomId });
          console.log(`[Screen Share] Rejected: ${roomId}`);
        }
      } catch (error) {
        console.error("Error rejecting screen share:", error);
      }
    },
  );

  /**
   * Cancel screen share request (initiated by the sender)
   */
  socket.on(
    "cancel-screen-share-request",
    ({ receiverId, roomId, conversationId }) => {
      try {
        const receiverSocketId = getReceiverSocketId(receiverId);

        if (screenShareSessions[roomId]) {
          const session = screenShareSessions[roomId];
          delete activeSharesByConversation[session.conversationId];
          delete screenShareSessions[roomId];
        }

        if (receiverSocketId) {
          io.to(receiverSocketId).emit("screen-share-cancelled", { roomId });
          console.log(`[Screen Share] Cancelled: ${roomId}`);
        }
      } catch (error) {
        console.error("Error cancelling screen share request:", error);
      }
    },
  );

  /**
   * Send encrypted screen stream data
   * Data arrives as plain base64, gets encrypted, then sent to recipient
   */
  socket.on("screen-stream-data", ({ roomId, data }) => {
    try {
      if (!screenShareSessions[roomId]) {
        return; // Session no longer exists
      }

      const session = screenShareSessions[roomId];

      // Encrypt the frame data
      const encryptedFrame = encryptData(data, session.encryptionKey);

      // Send only to the other user in the room (not to all room members)
      socket.to(roomId).emit("screen-stream-data", {
        encryptedData: encryptedFrame.encryptedData,
        iv: encryptedFrame.iv,
        authTag: encryptedFrame.authTag,
      });

      session.frameCount++;
    } catch (error) {
      console.error("Error sending screen stream data:", error);
    }
  });

  /**
   * Stop screen sharing
   */
  socket.on(
    "stop-screen-share",
    ({ roomId, initiatorId, receiverId, conversationId }) => {
      try {
        const receiverSocketId = getReceiverSocketId(receiverId);
        const initiatorSocketId = getReceiverSocketId(initiatorId);

        // Calculate duration and create report
        let duration = 0;
        let shareReport = null;
        let frameCount = 0;

        if (screenShareSessions[roomId]) {
          const session = screenShareSessions[roomId];
          frameCount = session.frameCount;

          if (session.startTime) {
            duration = Math.floor((Date.now() - session.startTime) / 1000);

            // Create share report
            shareReport = {
              initiatorId: session.initiatorId,
              receiverId: session.receiverId,
              duration: duration,
              durationFormatted: formatDuration(duration),
              timestamp: new Date().toISOString(),
              roomId: roomId,
              conversationId: conversationId,
              frameCount: frameCount,
              status: "completed",
            };
          }

          // Remove from active shares
          delete activeSharesByConversation[session.conversationId];
          delete screenShareSessions[roomId];
        }

        // Leave the room
        socket.leave(roomId);

        // Notify both participants
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("screen-share-stopped", {
            roomId,
            duration,
            shareReport,
          });

          // Ensure receiver also leaves room
          const receiverSocket = io.sockets.sockets.get(receiverSocketId);
          if (receiverSocket) {
            receiverSocket.leave(roomId);
          }
        }

        if (initiatorSocketId && initiatorSocketId !== socket.id) {
          const initiatorSocket = io.sockets.sockets.get(initiatorSocketId);
          if (initiatorSocket) {
            initiatorSocket.leave(roomId);
            initiatorSocket.emit("screen-share-stopped", {
              roomId,
              duration,
              shareReport,
            });
          }
        }

        console.log(
          `[Screen Share] Stopped: ${roomId} (Duration: ${formatDuration(duration)}, Frames: ${frameCount})`,
        );
      } catch (error) {
        console.error("Error stopping screen share:", error);
      }
    },
  );

  /**
   * Handle user disconnection - clean up sessions
   */
  socket.on("disconnect", () => {
    try {
      console.log("User disconnected, cleaning up screen share sessions");

      // Find and clean up screen share sessions involving this user
      const roomsToClean = [];
      Object.keys(screenShareSessions).forEach((roomId) => {
        const session = screenShareSessions[roomId];
        if (
          session &&
          (session.initiatorSocketId === socket.id ||
            session.receiverSocketId === socket.id)
        ) {
          roomsToClean.push({ roomId, session });
        }
      });

      roomsToClean.forEach(({ roomId, session }) => {
        // Calculate duration for abrupt disconnection
        let duration = 0;
        let shareReport = null;

        if (session.startTime && session.isActive) {
          duration = Math.floor((Date.now() - session.startTime) / 1000);
          shareReport = {
            initiatorId: session.initiatorId,
            receiverId: session.receiverId,
            duration: duration,
            durationFormatted: formatDuration(duration),
            timestamp: new Date().toISOString(),
            roomId: roomId,
            conversationId: session.conversationId,
            status: "interrupted",
            reason: "user_disconnected",
          };
        }

        // Notify the other user
        if (
          session.initiatorSocketId === socket.id &&
          session.receiverSocketId
        ) {
          // Initiator disconnected, notify receiver
          io.to(session.receiverSocketId).emit("screen-share-stopped", {
            roomId,
            duration,
            shareReport,
            reason: "initiator_disconnected",
          });
          const receiverSocket = io.sockets.sockets.get(
            session.receiverSocketId,
          );
          if (receiverSocket) {
            receiverSocket.leave(roomId);
          }
        } else if (
          session.receiverSocketId === socket.id &&
          session.initiatorSocketId
        ) {
          // Receiver disconnected, notify initiator
          io.to(session.initiatorSocketId).emit("screen-share-stopped", {
            roomId,
            duration,
            shareReport,
            reason: "receiver_disconnected",
          });
          const initiatorSocket = io.sockets.sockets.get(
            session.initiatorSocketId,
          );
          if (initiatorSocket) {
            initiatorSocket.leave(roomId);
          }
        }

        // Remove from active shares
        delete activeSharesByConversation[session.conversationId];
        // Clean up the session
        delete screenShareSessions[roomId];

        console.log(
          `[Screen Share] Cleanup after disconnect: ${roomId} (Duration: ${formatDuration(duration)})`,
        );
      });
    } catch (error) {
      console.error("Error during disconnect cleanup:", error);
    }
  });
};

export { encryptData, decryptData };
