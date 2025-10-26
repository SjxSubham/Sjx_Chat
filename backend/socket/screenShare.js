import { getReceiverSocketId, io } from "./socket.js";

const screenShareSessions = {}; // {roomId: {initiatorId, receiverId, isActive, startTime, duration}}

export const initializeScreenShareHandlers = (socket) => {
  // Request screen sharing
  socket.on("initiate-screen-share", ({ receiverId, initiatorId }) => {
    const receiverSocketId = getReceiverSocketId(receiverId);

    if (receiverSocketId) {
      const roomId = `${initiatorId}-${receiverId}`;
      screenShareSessions[roomId] = {
        initiatorId,
        receiverId,
        isActive: false,
        startTime: null,
        duration: 0,
        initiatorSocketId: socket.id,
        receiverSocketId: receiverSocketId,
      };

      io.to(receiverSocketId).emit("screen-share-request", {
        initiatorId,
        roomId,
      });
    }
  });

  // Accept screen sharing
  socket.on("accept-screen-share", ({ initiatorId, receiverId, roomId }) => {
    const initiatorSocketId = getReceiverSocketId(initiatorId);

    if (screenShareSessions[roomId]) {
      screenShareSessions[roomId].isActive = true;
      screenShareSessions[roomId].startTime = Date.now();
    }

    // Join both users to a room for efficient streaming
    socket.join(roomId);

    if (initiatorSocketId) {
      // Notify initiator to join room
      io.to(initiatorSocketId).emit("screen-share-accepted", { roomId });

      // Get initiator socket and make them join room too
      const initiatorSocket = io.sockets.sockets.get(initiatorSocketId);
      if (initiatorSocket) {
        initiatorSocket.join(roomId);
      }
    }
  });

  // Reject screen sharing
  socket.on("reject-screen-share", ({ initiatorId, roomId }) => {
    const initiatorSocketId = getReceiverSocketId(initiatorId);

    if (screenShareSessions[roomId]) {
      delete screenShareSessions[roomId];
    }

    if (initiatorSocketId) {
      io.to(initiatorSocketId).emit("screen-share-rejected", { roomId });
    }
  });

  // Send screen stream data
  socket.on("screen-stream-data", ({ roomId, data }) => {
    socket.to(roomId).emit("screen-stream-data", { data });
  });

  // Stop screen sharing
  socket.on("stop-screen-share", ({ roomId, initiatorId, receiverId }) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    const initiatorSocketId = getReceiverSocketId(initiatorId);

    // Calculate duration before deleting session
    let duration = 0;
    let shareReport = null;

    if (screenShareSessions[roomId]) {
      const session = screenShareSessions[roomId];
      if (session.startTime) {
        duration = Math.floor((Date.now() - session.startTime) / 1000); // Convert to seconds

        // Create share report
        shareReport = {
          initiatorId: session.initiatorId,
          receiverId: session.receiverId,
          duration: duration,
          durationFormatted: formatDuration(duration),
          timestamp: new Date().toISOString(),
          roomId: roomId,
        };
      }
      delete screenShareSessions[roomId];
    }

    // Leave the room
    socket.leave(roomId);

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
        // Notify initiator about the stop with duration
        initiatorSocket.emit("screen-share-stopped", {
          roomId,
          duration,
          shareReport,
        });
      }
    }
  });

  // Handle disconnection - clean up sessions
  socket.on("disconnect", () => {
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
          reason: "user_disconnected",
        };
      }

      // Notify the other user
      if (session.initiatorSocketId === socket.id && session.receiverSocketId) {
        // Initiator disconnected, notify receiver
        io.to(session.receiverSocketId).emit("screen-share-stopped", {
          roomId,
          duration,
          shareReport,
          reason: "initiator_disconnected",
        });
        const receiverSocket = io.sockets.sockets.get(session.receiverSocketId);
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

      // Clean up the session
      delete screenShareSessions[roomId];
    });
  });
};

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
