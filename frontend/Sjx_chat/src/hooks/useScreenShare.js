import { useCallback, useRef, useState } from "react";
import { useSocketContext } from "../context/SocketContext";

export const useScreenShare = () => {
	const { socket } = useSocketContext();
	const [isSharing, setIsSharing] = useState(false);
	const [sharedStream, setSharedStream] = useState(null);
	const [error, setError] = useState(null);
	const canvasRef = useRef(null);
	const screenStreamRef = useRef(null);
	const frameIdRef = useRef(null);
	const videoRef = useRef(null);

	const startScreenShare = useCallback(
		async (receiverId, roomId) => {
			try {
				setError(null);
				const stream = await navigator.mediaDevices.getDisplayMedia({
					video: { cursor: "always" },
					audio: false,
				});

				screenStreamRef.current = stream;
				setSharedStream(stream);
				setIsSharing(true);

				// Get the canvas from the reference
				const canvas = canvasRef.current;
				if (canvas) {
					const ctx = canvas.getContext("2d");
					const video = document.createElement("video");
					videoRef.current = video;
					video.srcObject = stream;
					video.play();

					const sendFrame = () => {
						try {
							if (video.readyState === video.HAVE_ENOUGH_DATA) {
								ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
								const imageData = canvas.toDataURL("image/jpeg", 0.6);
								if (socket) {
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
					stopScreenShare(receiverId, roomId);
				};
			} catch (error) {
				console.error("Error starting screen share:", error);
				setError(error.message);
				setIsSharing(false);
			}
		},
		[socket]
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

			if (socket) {
				socket.emit("stop-screen-share", {
					roomId: roomId,
					initiatorId: socket.id,
					receiverId,
				});
			}
		},
		[socket]
	);

	return {
		isSharing,
		sharedStream,
		startScreenShare,
		stopScreenShare,
		canvasRef,
		error,
	};
};
