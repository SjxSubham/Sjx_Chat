import { useEffect, useRef, useState } from "react";
import { useSocketContext } from "../../context/SocketContext";
import { useScreenShare } from "../../hooks/useScreenShare";
import { useAuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";

const ScreenShareModal = ({ isOpen, onClose, recipientId, recipientName }) => {
  const { socket } = useSocketContext();
  const { authUser } = useAuthContext();
  const [isReceiving, setIsReceiving] = useState(false);
  const [canvasData, setCanvasData] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const remoteCanvasRef = useRef(null);
  const timerRef = useRef(null);
  const { startScreenShare, stopScreenShare, isSharing, canvasRef } =
    useScreenShare();
  const roomId = `${authUser?._id}-${recipientId}`;

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

  useEffect(() => {
    if (!socket || !isOpen) return;

    const handleScreenStreamData = ({ data }) => {
      setCanvasData(data);
    };

    const handleScreenShareStopped = ({ duration, shareReport, reason }) => {
      setIsReceiving(false);

      // Create and display report message
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

    const handleScreenShareAccepted = ({ startTime }) => {
      setIsReceiving(true);
      setSessionStartTime(Date.now());
      toast.success("Screen share accepted");
    };

    const handleScreenShareRejected = () => {
      setIsReceiving(false);
      setSessionStartTime(null);
      setElapsedTime(0);
      toast.error("Screen share rejected");
      onClose();
    };

    socket.on("screen-stream-data", handleScreenStreamData);
    socket.on("screen-share-stopped", handleScreenShareStopped);
    socket.on("screen-share-accepted", handleScreenShareAccepted);
    socket.on("screen-share-rejected", handleScreenShareRejected);

    return () => {
      socket.off("screen-stream-data", handleScreenStreamData);
      socket.off("screen-share-stopped", handleScreenShareStopped);
      socket.off("screen-share-accepted", handleScreenShareAccepted);
      socket.off("screen-share-rejected", handleScreenShareRejected);
    };
  }, [socket, isOpen, onClose]);

  // Display received canvas data
  useEffect(() => {
    if (canvasData && remoteCanvasRef.current) {
      const canvas = remoteCanvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = canvasData;
    }
  }, [canvasData]);

  const handleStartShare = async () => {
    try {
      await startScreenShare(recipientId, roomId);
      setSessionStartTime(Date.now());
      setElapsedTime(0);
      socket?.emit("initiate-screen-share", {
        receiverId: recipientId,
        initiatorId: authUser?._id,
        roomId,
      });
      toast.success("Screen share request sent");
    } catch (error) {
      toast.error("Failed to start screen share");
    }
  };

  const handleStopShare = () => {
    stopScreenShare(recipientId, roomId);
    setCanvasData(null);
    setSessionStartTime(null);
    setElapsedTime(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleClose = () => {
    if (isSharing) {
      handleStopShare();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Screen Share</h2>
            <p className="text-sm text-gray-600 mt-1">
              Sharing with {recipientName || "user"}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none"
          >
            ×
          </button>
        </div>

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
                <span className="text-sm font-medium">Broadcasting</span>
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
              className="flex-1 min-w-[150px] bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md"
            >
              Start Sharing Screen
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
          <p className="text-sm text-blue-800">
            <strong>💡 Tip:</strong> Share your entire screen, a specific
            window, or browser tab. Click "Stop Sharing" or press ESC to end the
            session. A report with duration will be saved to the conversation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScreenShareModal;
