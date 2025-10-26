import { useState } from "react";
import { useSocketContext } from "../../context/SocketContext";
import { useAuthContext } from "../../context/AuthContext";
import ScreenShareModal from "./ScreenShareModal";
import ScreenShareReportMessage from "./ScreenShareReportMessage";
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

  return (
    <>
      {/* Screen Share Report Display */}
      {screenShareReport && (
        <ScreenShareReportMessage
          message={{ content: screenShareReport }}
          onDismiss={dismissReport}
        />
      )}

      {/* Screen Share Button */}
      <button
        onClick={handleScreenShareClick}
        title="Share Your Screen (E2E Encrypted)"
        className="btn btn-sm btn-ghost hover:bg-blue-100 transition-colors"
        disabled={!socket}
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
      />
    </>
  );
};

export default ScreenShareButton;
