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
	const { authUser } = useAuthContext();

	useEffect(() => {
		let newSocket;

		if (authUser) {
			try {
				newSocket = io(import.meta.env.VITE_SOCKET_URL || "https://sjx-chatapp.onrender.com", {
					query: {
						userId: authUser._id,
					},
					withCredentials: true
				});

				setSocket(newSocket);

				newSocket.on("getOnlineUsers", (users) => {
					setOnlineUsers(users);
				});

				newSocket.on("error", (error) => {
					console.error('Socket error:', error);
				});

				newSocket.on("connect_error", (error) => {
					console.error('Socket connection error:', error);
				});
			} catch (error) {
				console.error('Error initializing socket:', error);
			}
		} else {
			if (socket) {
				socket.close();
				setSocket(null);
			}
		}

		return () => {
			if (newSocket) {
				newSocket.close();
			}
		};
	}, [authUser]);

	return (
		<SocketContext.Provider value={{ socket, onlineUsers }}>
			{children}
		</SocketContext.Provider>
	);
};

SocketContextProvider.propTypes = {
	children: PropTypes.node.isRequired
};