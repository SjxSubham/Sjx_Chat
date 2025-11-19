import { useEffect, useMemo, useRef, useState } from "react";
import { useSocketContext } from "../../context/SocketContext";
import { useAuthContext } from "../../context/AuthContext";
import useScreenShare from "../../hooks/useScreenShare";
import { decryptScreenFrame } from "../../utils/screenShareCrypto";
import { formatDuration } from "../../utils/time";
import toast from "react-hot-toast";
import {
  HiOutlineDesktopComputer,
  HiOutlineShieldCheck,
  HiOutlineStop,
  HiOutlineVideoCamera,
} from "react-icons/hi";

const SESSION_STATE = {
  IDLE: "idle",
  REQUESTING: "requesting",
  PENDING: "pending",
  CONNECTING: "connecting",
  LIVE: "live",
  RECEIVING: "receiving",
};

const STATUS_COLORS = {
  idle: "badge-ghost",
  requesting: "badge-warning",
  pending: "badge-info",
  connecting: "badge-accent",
  live: "badge-success",
  receiving: "badge-primary",
};

const initialMetrics = {
  frames: 0,
  bytes: 0,
  startedAt: null,
};

const buildRoomId = ({ conversationId, initiatorId }) =>
  `screen-share-${conversationId}-${initiatorId}-${Date.now()}`;

const ScreenShareModal = ({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  conversationId,
  onScreenShareReport,
}) => {
  const { socket } = useSocketContext();
  const { authUser } = useAuthContext();
  const {
    isSharing,
    isStarting,
    roomId: activeRoomId,
    stats,
    startShare,
    stopShare,
    stopTransportOnly,
    setInitiatorOverride,
    canvasRef,
  } = useScreenShare();

  const [sessionState, setSessionState] = useState(SESSION_STATE.IDLE);
  const [inboundRequest, setInboundRequest] = useState(null);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [metrics, setMetrics] = useState(initialMetrics);
  const [localPreviewEnabled, setLocalPreviewEnabled] = useState(true);
  const [isAwaitingAcceptance, setIsAwaitingAcceptance] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const remoteCanvasRef = useRef(null);
  const timerRef = useRef(null);

  const sessionDuration = useMemo(
    () => formatDuration(elapsedSeconds || stats.durationSeconds || 0),
    [elapsedSeconds, stats.durationSeconds],
  );

  const resetSession = () => {
    setSessionState(SESSION_STATE.IDLE);
    setInboundRequest(null);
    setCurrentRoomId(null);
    setEncryptionKey(null);
    setMetrics(initialMetrics);
    setIsAwaitingAcceptance(false);
    setElapsedSeconds(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const beginTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  };

  useEffect(() => {
    if (!isOpen) {
      resetSession();
      stopTransportOnly();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!socket) return;

    const handleScreenShareRequest = ({
      initiatorId,
      roomId,
      encryptionKey,
    }) => {
      if (initiatorId === authUser?._id) return;
      setInitiatorOverride(initiatorId);
      setInboundRequest({ initiatorId, roomId, encryptionKey });
      setEncryptionKey(encryptionKey);
      setCurrentRoomId(roomId);
      setSessionState(SESSION_STATE.PENDING);
      setLocalPreviewEnabled(false);
      toast.custom(
        () => (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-lg flex items-center gap-4">
            <HiOutlineVideoCamera className="text-blue-600 text-3xl" />
            <div>
              <p className="font-semibold text-blue-900">
                {recipientName || "This user"} wants to share their screen.
              </p>
              <p className="text-sm text-blue-600">
                Accept to join a zero-knowledge encrypted session.
              </p>
            </div>
          </div>
        ),
        { duration: 4000 },
      );
    };

    const handleScreenShareAccepted = ({ roomId, encryptionKey }) => {
      if (roomId !== currentRoomId) return;
      setEncryptionKey(encryptionKey);
      setIsAwaitingAcceptance(false);
      setSessionState(SESSION_STATE.CONNECTING);
      startOutboundStream({ roomId, encryptionKey });
    };

    const handleScreenShareRejected = ({ roomId }) => {
      if (roomId !== currentRoomId) return;
      toast.error("Screen share request was declined");
      resetSession();
    };

    const handleScreenShareStopped = ({ shareReport, reason }) => {
      if (shareReport) {
        onScreenShareReport?.(shareReport);
      }
      if (reason) {
        toast(reason.includes("disconnected") ? "info" : "success", {
          description: `Screen sharing ended (${reason})`,
        });
      }
      stopTransportOnly();
      resetSession();
    };

    const handleScreenShareError = ({ error }) => {
      toast.error(error || "Screen share error");
      stopTransportOnly();
      resetSession();
    };

    const handleScreenStreamData = async ({ encryptedData, iv, authTag }) => {
      if (!encryptionKey || !remoteCanvasRef.current) return;
      const decoded = await decryptScreenFrame(
        { encryptedData, iv, authTag },
        encryptionKey,
      );
      if (!decoded) return;
      const canvas = remoteCanvasRef.current;
      const context = canvas.getContext("2d");
      const image = new Image();
      image.onload = () => {
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
      };
      image.src = decoded;
      setMetrics((prev) => ({
        ...prev,
        frames: prev.frames + 1,
        bytes: prev.bytes + decoded.length,
      }));
    };

    socket.on("screen-share-request", handleScreenShareRequest);
    socket.on("screen-share-accepted", handleScreenShareAccepted);
    socket.on("screen-share-rejected", handleScreenShareRejected);
    socket.on("screen-share-stopped", handleScreenShareStopped);
    socket.on("screen-share-error", handleScreenShareError);
    socket.on("screen-stream-data", handleScreenStreamData);

    return () => {
      socket.off("screen-share-request", handleScreenShareRequest);
      socket.off("screen-share-accepted", handleScreenShareAccepted);
      socket.off("screen-share-rejected", handleScreenShareRejected);
      socket.off("screen-share-stopped", handleScreenShareStopped);
      socket.off("screen-share-error", handleScreenShareError);
      socket.off("screen-stream-data", handleScreenStreamData);
    };
  }, [
    socket,
    authUser?._id,
    startShare,
    stopShare,
    stopTransportOnly,
    currentRoomId,
    encryptionKey,
    recipientName,
    onScreenShareReport,
  ]);

  const startOutboundStream = async ({ roomId, encryptionKey }) => {
    try {
      setMetrics((prev) => ({ ...prev, startedAt: Date.now() }));
      beginTimer();
      setSessionState(SESSION_STATE.CONNECTING);
      await startShare(
        {
          roomId,
          receiverId: recipientId,
          conversationId,
          key: encryptionKey,
        },
        { width: 1280, height: 720 },
      );
      setSessionState(SESSION_STATE.LIVE);
    } catch (error) {
      console.error("Failed to start outbound share", error);
      toast.error("Unable to start screen share");
      resetSession();
    }
  };

  const handleInitiateClick = async () => {
    if (!socket || !recipientId || !conversationId || !authUser?._id) {
      toast.error("Missing user or conversation context");
      return;
    }

    const roomId = buildRoomId({
      conversationId,
      initiatorId: authUser._id,
    });

    setCurrentRoomId(roomId);
    setSessionState(SESSION_STATE.REQUESTING);
    setIsAwaitingAcceptance(true);

    socket.emit("initiate-screen-share", {
      receiverId: recipientId,
      initiatorId: authUser._id,
      conversationId,
      roomId,
    });

    toast.success("Screen share request sent");
  };

  const handleAcceptClick = () => {
    if (!socket || !inboundRequest) return;

    socket.emit("accept-screen-share", {
      initiatorId: inboundRequest.initiatorId,
      receiverId: authUser?._id,
      roomId: inboundRequest.roomId,
      conversationId,
    });

    setSessionState(SESSION_STATE.RECEIVING);
    setEncryptionKey(inboundRequest.encryptionKey);
    beginTimer();
    setInboundRequest(null);
  };

  const handleRejectClick = () => {
    if (!socket || !inboundRequest) return;
    socket.emit("reject-screen-share", {
      initiatorId: inboundRequest.initiatorId,
      roomId: inboundRequest.roomId,
      conversationId,
    });
    toast.success("Screen share request dismissed");
    resetSession();
  };

  const handleStopClick = () => {
    if (!currentRoomId && !activeRoomId) {
      resetSession();
      return;
    }
    stopShare({
      receiverId: recipientId,
      conversationId,
      reason: "user_stopped",
    });
    stopTransportOnly();
    resetSession();
  };

  const handleClose = () => {
    if (sessionState === SESSION_STATE.REQUESTING && socket && currentRoomId) {
      socket.emit("cancel-screen-share-request", {
        receiverId: recipientId,
        roomId: currentRoomId,
        conversationId,
      });
    }
    if (
      sessionState === SESSION_STATE.LIVE ||
      sessionState === SESSION_STATE.RECEIVING
    ) {
      handleStopClick();
    } else {
      stopTransportOnly();
      resetSession();
    }
    onClose();
  };

  if (!isOpen) return null;

  const statusBadge = (
    <span className={`badge ${STATUS_COLORS[sessionState]} uppercase`}>
      {sessionState}
    </span>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl">
        <header className="border-b p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Secure Screen Sharing</p>
            <h1 className="text-2xl font-bold text-gray-900">
              {recipientName || "Selected user"}
            </h1>
            <div className="mt-2 flex items-center gap-3 text-sm text-gray-600">
              {statusBadge}
              <span>Duration: {sessionDuration}</span>
              {encryptionKey && (
                <span className="inline-flex items-center gap-1 text-green-600">
                  <HiOutlineShieldCheck />
                  End-to-end encrypted
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="btn btn-ghost text-xl"
            aria-label="Close modal"
          >
            ✕
          </button>
        </header>

        <section className="grid gap-4 p-6 md:grid-cols-2">
          <div className="rounded-2xl border bg-gray-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-gray-700">Your Screen</p>
              {isSharing && (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                  Live
                </span>
              )}
            </div>
            {localPreviewEnabled ? (
              <canvas
                ref={canvasRef}
                width={640}
                height={360}
                className="h-64 w-full rounded-xl border bg-black object-contain shadow-inner"
              />
            ) : (
              <div className="flex h-64 items-center justify-center rounded-xl border border-dashed bg-white text-gray-500">
                <HiOutlineDesktopComputer size={48} className="mb-2" />
                <p className="text-center text-sm">
                  Waiting for the other participant to share
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border bg-gray-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-gray-700">Remote Screen</p>
              <span className="text-xs uppercase text-gray-500">
                {sessionState === SESSION_STATE.RECEIVING
                  ? "Streaming"
                  : "Standby"}
              </span>
            </div>
            <canvas
              ref={remoteCanvasRef}
              width={640}
              height={360}
              className="h-64 w-full rounded-xl border bg-black object-contain shadow-inner"
            />
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div>
                <p className="font-semibold text-gray-500">Frames</p>
                <p className="text-gray-900">
                  {metrics.frames || stats.frames || 0}
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-500">Data</p>
                <p className="text-gray-900">
                  {((metrics.bytes || stats.bytesSent || 0) / 1024).toFixed(1)}{" "}
                  KB
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t bg-gray-50 p-6">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold uppercase text-gray-500">
                Controls
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleInitiateClick}
                  disabled={isStarting || sessionState !== SESSION_STATE.IDLE}
                  className="btn btn-primary flex-1 gap-2"
                >
                  <HiOutlineVideoCamera size={18} />
                  Start a session
                </button>
                <button
                  onClick={handleStopClick}
                  disabled={sessionState === SESSION_STATE.IDLE}
                  className="btn btn-error flex-1 gap-2"
                >
                  <HiOutlineStop size={18} />
                  Stop session
                </button>
                <button
                  onClick={() => setLocalPreviewEnabled((prev) => !prev)}
                  className="btn flex-1 gap-2"
                >
                  <HiOutlineDesktopComputer size={18} />
                  {localPreviewEnabled ? "Hide preview" : "Show preview"}
                </button>
              </div>
              {isAwaitingAcceptance && (
                <p className="mt-3 text-sm text-amber-600">
                  Waiting for {recipientName || "recipient"} to approve your
                  request…
                </p>
              )}
            </div>

            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold uppercase text-gray-500">
                Incoming Request
              </h3>
              {inboundRequest ? (
                <div className="space-y-2 rounded-xl border border-blue-200 bg-blue-50 p-3">
                  <p className="font-semibold text-blue-900">
                    {recipientName || "This user"} wants to share their screen
                  </p>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-sm btn-success flex-1"
                      onClick={handleAcceptClick}
                    >
                      Accept
                    </button>
                    <button
                      className="btn btn-sm btn-ghost flex-1"
                      onClick={handleRejectClick}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No incoming requests at the moment.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ScreenShareModal;
