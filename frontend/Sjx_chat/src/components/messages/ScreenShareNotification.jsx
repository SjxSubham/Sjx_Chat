import { useState, useEffect } from "react";
import { useSocketContext } from "../../context/SocketContext";
import { useAuthContext } from "../../context/AuthContext";
import { MdOutlineScreenShare, MdClose } from "react-icons/md";
import { IoCheckmarkDone, IoClose } from "react-icons/io5";
import toast from "react-hot-toast";

const ScreenShareNotification = ({
  recipientId,
  recipientName,
  conversationId,
  onAccept,
  onReject,
  outgoingRequestActive,
  onCancelRequest,
  onRequestSent,
}) => {
  const { socket } = useSocketContext();
  const { authUser } = useAuthContext();
  const [incomingRequest, setIncomingRequest] = useState(null);

  useEffect(() => {
    if (!socket) return;

    // Handle incoming screen share request
    const handleScreenShareRequest = ({
      initiatorId,
      roomId,
      encryptionKey,
    }) => {
      setIncomingRequest({
        initiatorId,
        roomId,
        encryptionKey,
        initiatorName: recipientName,
      });
      console.log(
        "[Notification] Received screen share request from:",
        initiatorId,
      );
    };

    // Handle request acceptance
    const handleScreenShareAccepted = ({ roomId, encryptionKey }) => {
      console.log("[Notification] Request accepted");
    };

    // Handle request rejection
    const handleScreenShareRejected = () => {
      toast.info("Screen share request was rejected");
      console.log("[Notification] Request rejected");
    };

    // Handle request timeout or cancellation
    const handleScreenShareCancelled = () => {
      setIncomingRequest(null);
      toast.info("Screen share request was cancelled");
      console.log("[Notification] Request cancelled");
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
  }, [socket, recipientName]);

  const handleAccept = () => {
    if (!incomingRequest) return;

    socket?.emit("accept-screen-share", {
      initiatorId: incomingRequest.initiatorId,
      receiverId: authUser?._id,
      roomId: incomingRequest.roomId,
      conversationId: conversationId,
    });

    if (onAccept) {
      onAccept(incomingRequest);
    }

    setIncomingRequest(null);
    toast.success("Screen share accepted");
  };

  const handleReject = () => {
    if (!incomingRequest) return;

    socket?.emit("reject-screen-share", {
      initiatorId: incomingRequest.initiatorId,
      roomId: incomingRequest.roomId,
      conversationId: conversationId,
    });

    if (onReject) {
      onReject();
    }

    setIncomingRequest(null);
    toast.info("Screen share request rejected");
  };

  const handleCancelRequest = () => {
    if (onCancelRequest) {
      onCancelRequest();
    }
  };

  // Incoming request notification
  if (incomingRequest) {
    return (
      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500 shadow-md animate-in fade-in slide-in-from-top">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100">
                <MdOutlineScreenShare className="text-blue-600 text-lg" />
              </div>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-blue-900">
                {incomingRequest.initiatorName || "User"} wants to share their
                screen
              </p>
              <p className="text-sm text-blue-700">
                🔒 End-to-end encrypted screen sharing
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={handleAccept}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <IoCheckmarkDone size={18} />
              Accept
            </button>
            <button
              onClick={handleReject}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <IoClose size={18} />
              Reject
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Outgoing request notification
  if (outgoingRequestActive) {
    return (
      <div className="mb-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border-l-4 border-orange-500 shadow-md animate-in fade-in slide-in-from-top">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-orange-100">
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-900">
                Waiting for {recipientName || "recipient"} to respond...
              </p>
              <p className="text-sm text-amber-700">
                Screen share request pending
              </p>
            </div>
          </div>
          <button
            onClick={handleCancelRequest}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors flex-shrink-0"
          >
            <MdClose size={18} />
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default ScreenShareNotification;
