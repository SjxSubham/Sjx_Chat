import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSocketContext } from "../context/SocketContext";
import { useAuthContext } from "../context/AuthContext";

const DEFAULT_CAPTURE_OPTIONS = {
  video: {
    cursor: "always",
    frameRate: 30,
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
  audio: false,
};

const JPEG_PRESET = {
  quality: 0.6,
  mimeType: "image/jpeg",
};

const FRAME_INTERVAL_MS = 1000 / 20; // ~20 FPS upper bound

const createInitialStats = () => ({
  frames: 0,
  bytesSent: 0,
  startedAt: null,
  stoppedAt: null,
});

export const useScreenShare = () => {
  const { socket } = useSocketContext();
  const { authUser } = useAuthContext();

  const [isSharing, setIsSharing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState(null);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [encryptionKey, setEncryptionKey] = useState(null);

  const canvasRef = useRef(null);
  const previewVideoRef = useRef(null);
  const activeRoomIdRef = useRef(null);
  const initiatorIdRef = useRef(authUser?._id || null);

  const captureStreamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastFrameAtRef = useRef(0);
  const pendingStopRef = useRef(false);
  const statsRef = useRef(createInitialStats());

  useEffect(() => {
    initiatorIdRef.current = authUser?._id || null;
  }, [authUser?._id]);

  const setInitiatorOverride = useCallback(
    (overrideId) => {
      initiatorIdRef.current = overrideId || authUser?._id || null;
    },
    [authUser?._id],
  );

  const resetStats = useCallback(() => {
    statsRef.current = createInitialStats();
  }, []);

  const getElapsedSeconds = useCallback(() => {
    const { startedAt, stoppedAt } = statsRef.current;
    if (!startedAt) return 0;
    const end = stoppedAt || Date.now();
    return Math.max(0, Math.round((end - startedAt) / 1000));
  }, []);

  const cleanupStream = useCallback(() => {
    pendingStopRef.current = false;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (captureStreamRef.current) {
      captureStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (trackError) {
          console.warn("Failed to stop capture track", trackError);
        }
      });
      captureStreamRef.current = null;
    }

    if (previewVideoRef.current) {
      previewVideoRef.current.srcObject = null;
    }

    setIsSharing(false);
    setIsStarting(false);
  }, []);

  const emitStopEvent = useCallback(
    ({ receiverId, conversationId, reason }) => {
      if (!socket || !activeRoomId) return;

      socket.emit("stop-screen-share", {
        roomId: activeRoomId,
        initiatorId: initiatorIdRef.current,
        receiverId,
        conversationId,
        stats: {
          ...statsRef.current,
          durationSeconds: getElapsedSeconds(),
          reason: reason || "user_stopped",
        },
      });
    },
    [socket, activeRoomId, getElapsedSeconds],
  );

  const stopTransportOnly = useCallback(() => {
    cleanupStream();
    setActiveRoomId(null);
    setEncryptionKey(null);
  }, [cleanupStream]);

  const stopShare = useCallback(
    ({ receiverId, conversationId, reason } = {}) => {
      if (!isSharing && !captureStreamRef.current) return;

      pendingStopRef.current = true;
      statsRef.current.stoppedAt = Date.now();

      stopTransportOnly();
      emitStopEvent({ receiverId, conversationId, reason });
    },
    [stopTransportOnly, emitStopEvent, isSharing],
  );

  const sendFrame = useCallback(
    async ({ roomId, customData }) => {
      if (!socket || !canvasRef.current || !captureStreamRef.current) return;

      const now = performance.now();
      if (now - lastFrameAtRef.current < FRAME_INTERVAL_MS) {
        animationFrameRef.current = requestAnimationFrame(() =>
          sendFrame({ roomId, customData }),
        );
        return;
      }

      lastFrameAtRef.current = now;

      try {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d", { willReadFrequently: false });
        const video = previewVideoRef.current;

        if (video?.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const frame = canvas.toDataURL(
            JPEG_PRESET.mimeType,
            JPEG_PRESET.quality,
          );

          statsRef.current.frames += 1;
          statsRef.current.bytesSent += frame.length;

          socket.emit("screen-stream-data", {
            roomId,
            data: frame,
            meta: {
              timestamp: Date.now(),
              ...customData,
            },
          });
        }
      } catch (frameError) {
        console.error("Failed to capture frame", frameError);
      }

      if (!pendingStopRef.current) {
        animationFrameRef.current = requestAnimationFrame(() =>
          sendFrame({ roomId, customData }),
        );
      }
    },
    [socket],
  );

  const startShare = useCallback(
    async (
      {
        roomId,
        receiverId,
        conversationId,
        key,
        captureOptions = {},
        customMeta = {},
        onPreview,
      },
      { width = 1280, height = 720 } = {},
    ) => {
      if (!socket) {
        setError("Socket connection not available.");
        return null;
      }

      if (isStarting || isSharing) {
        setError("Screen share is already running.");
        return null;
      }

      if (!roomId || !receiverId || !conversationId) {
        setError("Missing room, receiver, or conversation information.");
        return null;
      }

      setIsStarting(true);
      resetStats();

      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          ...DEFAULT_CAPTURE_OPTIONS,
          ...captureOptions,
        });

        captureStreamRef.current = stream;
        activeRoomIdRef.current = roomId;
        setActiveRoomId(roomId);
        setEncryptionKey(key || null);

        statsRef.current.startedAt = Date.now();

        const video =
          previewVideoRef.current || document.createElement("video");
        previewVideoRef.current = video;
        video.srcObject = stream;
        video.muted = true;
        await video.play();

        if (typeof onPreview === "function") {
          onPreview(stream);
        }

        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = width;
          canvas.height = height;
        }

        setIsSharing(true);
        setIsStarting(false);

        const track = stream.getVideoTracks()[0];
        track.addEventListener(
          "ended",
          () =>
            stopShare({
              receiverId,
              conversationId,
              reason: "initiator_disconnected",
            }),
          { once: true },
        );

        pendingStopRef.current = false;
        animationFrameRef.current = requestAnimationFrame(() =>
          sendFrame({
            roomId,
            customData: {
              receiverId,
              conversationId,
              ...customMeta,
            },
          }),
        );

        return stream;
      } catch (captureError) {
        console.error("Failed to start screen share:", captureError);
        setError(captureError.message || "Failed to start screen share");
        cleanupStream();
        return null;
      }
    },
    [socket, isStarting, isSharing, resetStats, sendFrame, stopShare],
  );

  useEffect(() => {
    if (!socket) return undefined;

    const handleStop = () => {
      cleanupStream();
      setActiveRoomId(null);
      setEncryptionKey(null);
    };

    socket.on("screen-share-stopped", handleStop);
    return () => {
      socket.off("screen-share-stopped", handleStop);
    };
  }, [socket, cleanupStream]);

  const state = useMemo(
    () => ({
      isSharing,
      isStarting,
      error,
      roomId: activeRoomId,
      encryptionKey,
      stats: {
        ...statsRef.current,
        durationSeconds: getElapsedSeconds(),
      },
    }),
    [
      isSharing,
      isStarting,
      error,
      activeRoomId,
      encryptionKey,
      getElapsedSeconds,
    ],
  );

  return {
    ...state,
    canvasRef,
    previewVideoRef,
    startShare,
    stopShare,
    stopTransportOnly,
    resetStats,
    setInitiatorOverride,
  };
};

export default useScreenShare;
