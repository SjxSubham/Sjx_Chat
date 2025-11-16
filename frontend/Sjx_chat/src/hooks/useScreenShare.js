import { useCallback, useRef, useState } from "react";
import { useSocketContext } from "../context/SocketContext";
import { useAuthContext } from "../context/AuthContext";

export const useScreenShare = () => {
  const { socket } = useSocketContext();
  const { authUser } = useAuthContext();

  const [isSharing, setIsSharing] = useState(false);
  const [sharedStream, setSharedStream] = useState(null);
  const [error, setError] = useState(null);
  const [encryptionKey, setEncryptionKey] = useState(null);
  const canvasRef = useRef(null);
  const screenStreamRef = useRef(null);
  const frameIdRef = useRef(null);
  const videoRef = useRef(null);
  const activeRoomIdRef = useRef(null);

  /**
   * Encrypt data using Web Crypto API (client-side)
   */
  const encryptFrameClientSide = useCallback(async (frameData, key) => {
    try {
      if (!key) return frameData;

      const keyBuffer = await crypto.subtle.importKey(
        "raw",
        Buffer.from(key, "base64"),
        { name: "AES-GCM" },
        false,
        ["encrypt"],
      );

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encoder = new TextEncoder();
      const data = encoder.encode(frameData);

      const encryptedData = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        keyBuffer,
        data,
      );

      return {
        encryptedData: Buffer.from(encryptedData).toString("hex"),
        iv: Buffer.from(iv).toString("base64"),
        encrypted: true,
      };
    } catch (error) {
      console.error("Client-side encryption error:", error);
      return frameData;
    }
  }, []);

  /**
   * Decrypt data using Web Crypto API (client-side)
   */
  const decryptFrameClientSide = useCallback(async (encryptedPayload, key) => {
    try {
      if (!key || !encryptedPayload.encrypted) {
        return encryptedPayload;
      }

      const keyBuffer = await crypto.subtle.importKey(
        "raw",
        Buffer.from(key, "base64"),
        { name: "AES-GCM" },
        false,
        ["decrypt"],
      );

      const iv = Buffer.from(encryptedPayload.iv, "base64");
      const encryptedData = Buffer.from(encryptedPayload.encryptedData, "hex");

      const decryptedData = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        keyBuffer,
        encryptedData,
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      console.error("Client-side decryption error:", error);
      return null;
    }
  }, []);

  const startScreenShare = useCallback(
    async (receiverId, roomId, key) => {
      try {
        setError(null);
        setEncryptionKey(key);

        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" },
          audio: false,
        });

        screenStreamRef.current = stream;
        setSharedStream(stream);
        setIsSharing(true);
        activeRoomIdRef.current = roomId;

        // Get the canvas from the reference
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          const video = document.createElement("video");
          videoRef.current = video;
          video.srcObject = stream;
          video.play();

          const sendFrame = async () => {
            try {
              if (video.readyState === video.HAVE_ENOUGH_DATA) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = canvas.toDataURL("image/jpeg", 0.5);

                if (socket) {
                  // Send plain data - server will encrypt
                  socket.emit("screen-stream-data", {
                    roomId: roomId,
                    data: imageData,
                  });
                }
              }
            } catch (error) {
              console.error("Error sending frame:", error);
            }

            frameIdRef.current = requestAnimationFrame(sendFrame);
          };

          frameIdRef.current = requestAnimationFrame(sendFrame);
        }

        // Listen for stop event
        stream.getTracks()[0].onended = () => {
          stopScreenShare(receiverId, activeRoomIdRef.current || roomId);
        };
      } catch (error) {
        console.error("Error starting screen share:", error);
        setError(error.message);
        setIsSharing(false);
      }
    },
    [socket],
  );

  const stopScreenShare = useCallback(
    (receiverId, roomId) => {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }

      setIsSharing(false);
      setSharedStream(null);
      setEncryptionKey(null);
      activeRoomIdRef.current = null;

      if (socket) {
        const effectiveRoomId =
          roomId && roomId.startsWith("screen-share-")
            ? roomId
            : activeRoomIdRef.current;
        socket.emit("stop-screen-share", {
          roomId: effectiveRoomId,
          initiatorId: authUser?._id,
          receiverId,
        });
      }
    },
    [socket],
  );

  return {
    isSharing,
    sharedStream,
    startScreenShare,
    stopScreenShare,
    encryptFrameClientSide,
    decryptFrameClientSide,
    canvasRef,
    error,
    encryptionKey,
  };
};
