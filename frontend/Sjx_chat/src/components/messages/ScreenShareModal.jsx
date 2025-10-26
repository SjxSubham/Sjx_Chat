import { useEffect, useRef, useState } from "react";
import { useSocketContext } from "../../context/SocketContext";
import { useScreenShare } from "../../hooks/useScreenShare";
import { useAuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";

// Decrypt received encrypted frames using Web Crypto API
async function decryptFrame(encryptedPayload, keyBase64) {
  try {
    const keyBuffer = await crypto.subtle.importKey(
      "raw",
      Uint8Array.from(atob(keyBase64), (c) => c.charCodeAt(0)),
      { name: "AES-GCM" },
      false,
      ["decrypt"],
    );

    const iv = Uint8Array.from(atob(encryptedPayload.iv), (c) =>
      c.charCodeAt(0),
    );
    const authTag = Uint8Array.from(atob(encryptedPayload.authTag), (c) =>
      c.charCodeAt(0),
    );

    // Convert hex string to Uint8Array
    const encryptedDataArray = new Uint8Array(
      encryptedPayload.encryptedData.match(/../g).map((x) => parseInt(x, 16)),
    );

    // Combine encrypted data + auth tag for GCM
    const combined = new Uint8Array([...encryptedDataArray, ...authTag]);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      keyBuffer,
      combined,
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("Frame decryption error:", error);
    return null;
  }
}

const ScreenShareModal = ({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  conversationId,
}) => {
  const { socket } = useSocketContext();
  const { authUser } = useAuthContext();
  const [isReceiving, setIsReceiving] = useState(false);
  const [canvasData, setCanvasData] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [isAwaitingAcceptance, setIsAwaitingAcceptance] = useState(false);
  const remoteCanvasRef = useRef(null);
  const timerRef = useRef(null);
  const { startScreenShare, stopScreenShare, isSharing, canvasRef } =
    useScreenShare();

  // Format elapsed time
  const formatElapsedTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // Handle elapsed time timer
  useEffect(() => {
    if (!isSharing || !sessionStartTime) return;

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isSharing, sessionStartTime]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isOpen) return;

    const handleScreenStreamData = async ({ encryptedData, iv, authTag }) => {
      try {
        if (!encryptionKey) return;

        // Decrypt the received frame
        const decryptedData = await decryptFrame(
          { encryptedData, iv, authTag },
          encryptionKey,
        );

        if (decryptedData) {
          setCanvasData(decryptedData);
        }
      } catch (error) {
        console.error("Error processing received frame:", error);
      }
    };

    const handleScreenShareStopped = ({ duration, shareReport, reason }) => {
      setIsReceiving(false);

      if (shareReport) {
        const durationStr = shareReport.durationFormatted;

        if (
          reason === "initiator_disconnected" ||
          reason === "receiver_disconnected"
        ) {
          toast.error(`Screen share interrupted after ${durationStr}`);
        } else {
          toast.success(`Screen share ended (Duration: ${durationStr})`);
        }
      }
    };

    const handleScreenShareAccepted = ({
      roomId: acceptedRoomId,
      encryptionKey: key,
    }) => {
      setIsAwaitingAcceptance(false);
      setIsReceiving(true);
      if (key) {
        setEncryptionKey(key);
      }
      setSessionStartTime(Date.now());
      toast.success("Screen share accepted");
    };

    const handleScreenShareRejected = () => {
      setIsAwaitingAcceptance(false);
      setIsReceiving(false);
      setSessionStartTime(null);
      setElapsedTime(0);
      toast.error("Screen share rejected");
      onClose();
    };

    const handleScreenShareError = ({ error }) => {
      setIsAwaitingAcceptance(false);
      toast.error(error || "Screen share error occurred");
    };

    socket.on("screen-stream-data", handleScreenStreamData);
    socket.on("screen-share-stopped", handleScreenShareStopped);
    socket.on("screen-share-accepted", handleScreenShareAccepted);
    socket.on("screen-share-rejected", handleScreenShareRejected);
    socket.on("screen-share-error", handleScreenShareError);

    return () => {
      socket.off("screen-stream-data", handleScreenStreamData);
      socket.off("screen-share-stopped", handleScreenShareStopped);
      socket.off("screen-share-accepted", handleScreenShareAccepted);
      socket.off("screen-share-rejected", handleScreenShareRejected);
      socket.off("screen-share-error", handleScreenShareError);
    };
  }, [socket, isOpen, onClose, encryptionKey]);

  // Display received canvas data
  useEffect(() => {
    if (canvasData && remoteCanvasRef.current) {
      const canvas = remoteCanvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.onerror = () => {
        console.error("Failed to load image data");
      };
      img.src = canvasData;
    }
  }, [canvasData]);

  const handleStartShare = async () => {
    try {
      setIsAwaitingAcceptance(true);

      // Emit request with conversation ID
      socket?.emit("initiate-screen-share", {
        receiverId: recipientId,
        initiatorId: authUser?._id,
        conversationId: conversationId,
      });
      toast.success("Screen share request sent");
    } catch (error) {
      setIsAwaitingAcceptance(false);
      toast.error("Failed to start screen share");
      console.error(error);
    }
  };

  const handleStopShare = () => {
    stopScreenShare(recipientId, conversationId);
    setCanvasData(null);
    setSessionStartTime(null);
    setElapsedTime(0);
    setEncryptionKey(null);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleClose = () => {
    if (isSharing) {
      handleStopShare();
    }
    setEncryptionKey(null);
    setIsAwaitingAcceptance(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Screen Share (E2E Encrypted)</h2>
            <p className="text-sm text-gray-600 mt-1">
              Sharing with {recipientName || "user"} - End-to-end encrypted
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        {/* Encryption Status */}
        {encryptionKey && (
          <div className="mb-4 px-4 py-3 bg-green-50 rounded-lg border border-green-200 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-700 font-medium">
              🔒 End-to-end encrypted - Only you and{" "}
              {recipientName || "recipient"} can see this
            </span>
          </div>
        )}

        {/* Duration Display */}
        {isSharing && (
          <div className="mb-4 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Session Duration
                </p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {formatElapsedTime(elapsedTime)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-600">Live</span>
              </div>
            </div>
          </div>
        )}

        {/* Awaiting Acceptance Status */}
        {isAwaitingAcceptance && !isSharing && (
          <div className="mb-4 px-4 py-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
              <p className="text-sm text-yellow-700 font-medium">
                Waiting for {recipientName || "recipient"} to accept the screen
                share...
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Local Screen */}
          <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold mb-3 text-center text-gray-700">
              Your Screen
            </h3>
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="w-full border-2 border-gray-200 rounded bg-black shadow-md"
            />
            {isSharing && (
              <div className="mt-2 flex items-center justify-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">
                  🔒 Broadcasting (Encrypted)
                </span>
              </div>
            )}
          </div>

          {/* Remote Screen */}
          <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold mb-3 text-center text-gray-700">
              {isReceiving
                ? `${recipientName || "Recipient"}'s Screen`
                : "Waiting for share..."}
            </h3>
            <canvas
              ref={remoteCanvasRef}
              width={640}
              height={480}
              className="w-full border-2 border-gray-200 rounded bg-black shadow-md"
            />
            {!isReceiving && (
              <div className="mt-2 flex items-center justify-center gap-2 text-gray-500">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-sm font-medium">Standby</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          {!isSharing ? (
            <button
              onClick={handleStartShare}
              disabled={isAwaitingAcceptance}
              className="flex-1 min-w-[150px] bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md"
            >
              {isAwaitingAcceptance
                ? "Awaiting Response..."
                : "Start Sharing Screen"}
            </button>
          ) : (
            <button
              onClick={handleStopShare}
              className="flex-1 min-w-[150px] bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md animate-pulse"
            >
              Stop Sharing
            </button>
          )}
          <button
            onClick={handleClose}
            className="flex-1 min-w-[150px] bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md"
          >
            Close
          </button>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800 mb-2">
            <strong>🔒 How it works:</strong>
          </p>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>
              Click "Start Sharing Screen" to initiate a screen share request
            </li>
            <li>Recipient accepts, and both users join the secure session</li>
            <li>
              Screen frames are end-to-end encrypted using AES-256-GCM - not
              visible to server
            </li>
            <li>
              Only the two users in this conversation can view the shared screen
            </li>
            <li>Click "Stop Sharing" to end the session</li>
            <li>
              A report with duration is automatically saved to the conversation
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ScreenShareModal;
