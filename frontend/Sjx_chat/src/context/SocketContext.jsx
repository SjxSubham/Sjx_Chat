import { createContext, useState, useEffect, useContext } from "react";
import { useAuthContext } from "./AuthContext";
import io from "socket.io-client";
import PropTypes from 'prop-types';

const SocketContext = createContext();

export const useSocketContext = () => {
	const context = useContext(SocketContext);
	if (!context) {
		throw new Error('useSocketContext must be used within a SocketContextProvider');
	}
	return context;
};

export const SocketContextProvider = ({ children }) => {
	const [socket, setSocket] = useState(null);
	const [onlineUsers, setOnlineUsers] = useState([]);
	const [isConnected, setIsConnected] = useState(false);
	const { authUser } = useAuthContext();

	useEffect(() => {
		let newSocket;
		let reconnectAttempts = 0;
		const maxReconnectAttempts = 5;

		const connectSocket = () => {
			if (authUser) {
				try {
					newSocket = io(import.meta.env.VITE_SOCKET_URL || "https://sjx-chatapp.onrender.com", {
						query: {
							userId: authUser._id,
						},
						withCredentials: true,
						reconnection: true,
						reconnectionAttempts: maxReconnectAttempts,
						reconnectionDelay: 1000,
						timeout: 10000
					});

					newSocket.on("connect", () => {
						console.log("Socket connected successfully");
						setIsConnected(true);
						reconnectAttempts = 0;
					});

					newSocket.on("disconnect", () => {
						console.log("Socket disconnected");
						setIsConnected(false);
					});

					newSocket.on("getOnlineUsers", (users) => {
						setOnlineUsers(users);
					});

					newSocket.on("error", (error) => {
						console.error('Socket error:', error);
					});

					newSocket.on("connect_error", (error) => {
						console.error('Socket connection error:', error);
						reconnectAttempts++;
						if (reconnectAttempts >= maxReconnectAttempts) {
							console.error('Max reconnection attempts reached');
							newSocket.close();
						}
					});

					setSocket(newSocket);
				} catch (error) {
					console.error('Error initializing socket:', error);
				}
			}
		};

		connectSocket();

		return () => {
			if (newSocket) {
				newSocket.close();
				setSocket(null);
				setIsConnected(false);
			}
		};
	}, [authUser]);

	return (
		<SocketContext.Provider value={{ socket, onlineUsers, isConnected }}>
			{children}
		</SocketContext.Provider>
	);
};

SocketContextProvider.propTypes = {
	children: PropTypes.node.isRequired
};