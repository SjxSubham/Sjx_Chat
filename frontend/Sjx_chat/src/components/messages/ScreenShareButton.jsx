import { useState, useEffect } from "react";
import { useSocketContext } from "../../context/SocketContext";
import { useAuthContext } from "../../context/AuthContext";
import ScreenShareModal from "./ScreenShareModal";
import ScreenShareReportMessage from "./ScreenShareReportMessage";
import ScreenShareNotification from "./ScreenShareNotification";
import { MdOutlineScreenShare } from "react-icons/md";
import toast from "react-hot-toast";

const ScreenShareButton = ({
  recipientId,
  recipientName,
  conversationId,
  onScreenShareReport,
}) => {
  const { socket } = useSocketContext();
  const { authUser } = useAuthContext();
  const [showModal, setShowModal] = useState(false);
  const [screenShareReport, setScreenShareReport] = useState(null);
  const [outgoingRequestRoomId, setOutgoingRequestRoomId] = useState(null);

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    const handleScreenShareRequest = () => {
      // Auto-open modal when receiving a screen share request
      setShowModal(true);
      console.log("[Screen Share Button] Received request, opening modal");
    };

    const handleScreenShareAccepted = ({ roomId }) => {
      setOutgoingRequestRoomId(null);
      setShowModal(true);
      toast.success("Screen share request accepted!");
    };

    const handleScreenShareRejected = () => {
      setOutgoingRequestRoomId(null);
      toast.error("Screen share request was rejected");
    };

    const handleScreenShareCancelled = () => {
      setOutgoingRequestRoomId(null);
      toast.info("Screen share request was cancelled");
    };

    socket.on("screen-share-request", handleScreenShareRequest);
    socket.on("screen-share-accepted", handleScreenShareAccepted);
    socket.on("screen-share-rejected", handleScreenShareRejected);
    socket.on("screen-share-cancelled", handleScreenShareCancelled);

    return () => {
      socket.off("screen-share-request", handleScreenShareRequest);
      socket.off("screen-share-accepted", handleScreenShareAccepted);
      socket.off("screen-share-rejected", handleScreenShareRejected);
      socket.off("screen-share-cancelled", handleScreenShareCancelled);
    };
  }, [socket]);

  const handleScreenShareClick = () => {
    if (!socket) {
      toast.error("Connection not established");
      return;
    }

    if (!authUser || !recipientId) {
      toast.error("Invalid user information");
      return;
    }

    if (!conversationId) {
      toast.error("Conversation information missing");
      return;
    }

    if (outgoingRequestRoomId) {
      toast.error("You already have a pending screen share request");
      return;
    }

    setShowModal(true);
  };

  const handleScreenShareReport = (report) => {
    setScreenShareReport(report);

    // Call parent callback if provided
    if (onScreenShareReport) {
      onScreenShareReport(report);
    }

    // Auto-clear report after 8 seconds
    setTimeout(() => {
      setScreenShareReport(null);
    }, 8000);
  };

  const dismissReport = () => {
    setScreenShareReport(null);
  };

  const handleRequestSent = (roomId) => {
    setOutgoingRequestRoomId(roomId);
  };

  const handleCancelRequest = () => {
    if (!outgoingRequestRoomId) return;

    socket?.emit("cancel-screen-share-request", {
      receiverId: recipientId,
      roomId: outgoingRequestRoomId,
      conversationId: conversationId,
    });

    setOutgoingRequestRoomId(null);
    toast.info("Screen share request cancelled");
  };

  return (
    <>
      {/* Screen Share Report Display */}
      {screenShareReport && (
        <ScreenShareReportMessage
          message={{ content: screenShareReport }}
          onDismiss={dismissReport}
        />
      )}

      {/* Screen Share Notification Banner */}
      <ScreenShareNotification
        recipientId={recipientId}
        recipientName={recipientName}
        conversationId={conversationId}
        outgoingRequestActive={!!outgoingRequestRoomId}
        onCancelRequest={handleCancelRequest}
        onRequestSent={handleRequestSent}
      />

      {/* Screen Share Button */}
      <button
        onClick={handleScreenShareClick}
        title={
          outgoingRequestRoomId
            ? "Screen share request pending..."
            : "Share Your Screen (E2E Encrypted)"
        }
        className="btn btn-sm btn-ghost hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!socket || !!outgoingRequestRoomId}
      >
        <MdOutlineScreenShare size={20} className="text-black font-bold" />
      </button>

      {/* Screen Share Modal */}
      <ScreenShareModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        recipientId={recipientId}
        recipientName={recipientName}
        conversationId={conversationId}
        onScreenShareReport={handleScreenShareReport}
        onRequestSent={handleRequestSent}
      />
    </>
  );
};

export default ScreenShareButton;
