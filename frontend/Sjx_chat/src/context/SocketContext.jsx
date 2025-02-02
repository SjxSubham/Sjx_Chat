// import { createContext, useState, useEffect, useContext } from "react";
// import { useAuthContext } from "./AuthContext";
// import io from "socket.io-client";

// const SocketContext = createContext();

// export const useSocketContext = () => {
// 	return useContext(SocketContext);
// };

// export const SocketContextProvider = ({ children }) => {
// 	const [socket, setSocket] = useState(null);
// 	const [onlineUsers, setOnlineUsers] = useState([]);
// 	const { authUser } = useAuthContext();

// 	useEffect(() => {
// 		if (authUser) {
// 			const socket = io("https://sjx-chatapp.onrender.com", {
// 				query: {
// 					userId: authUser._id,
// 				},
// 			});

// 			setSocket(socket);

// 			// socket.on() is used to listen to the events. can be used both on client and server side
// 			socket.on("getOnlineUsers", (users) => {
// 				setOnlineUsers(users);
// 			});

// 			return () => socket.close();
// 		} else {
// 			if (socket) {
// 				socket.close();
// 				setSocket(null);
// 			}
// 		};
// 	}, [authUser]);

// 	return <SocketContext.Provider value={{ socket, onlineUsers }}>{children}</SocketContext.Provider>;
// };



import { createContext, useState, useEffect, useContext } from "react";
import { useAuthContext } from "./AuthContext";
import io from "socket.io-client";

const SocketContext = createContext();

export const useSocketContext = () => {
    return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const { authUser } = useAuthContext();

    useEffect(() => {
        let newSocket;

        if (authUser) {
            newSocket = io("https://sjx-chatapp.onrender.com", {
                query: {
                    userId: authUser._id,
                },
            });

           

            setSocket(newSocket);
            newSocket.on("getOnlineUsers", (users) => {
                setOnlineUsers(users);
            });

            //return () => socket.close();
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
    }, [authUser]); // Only re-run when authUser changes

    return (
        <SocketContext.Provider value={{ socket, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
};