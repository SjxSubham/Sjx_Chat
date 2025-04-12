// import { createContext, useContext, useState } from "react";


// export const AuthContext = createContext();

// export const useAuthContext = () => {
//     return useContext(AuthContext);
// }

// export const AuthContextProvider = ({ children }) => {
//     const [authUser, setAuthUser] = useState(JSON.parse(localStorage.getItem("chat-user")) || null);
//     return (
//     <AuthContext.Provider value={{ authUser, setAuthUser}}>
//         {children}
//         </AuthContext.Provider>
//         );
// };


import { createContext, useContext, useState, useEffect } from "react";
import PropTypes from 'prop-types';

export const AuthContext = createContext();

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthContext must be used within an AuthContextProvider');
    }
    return context;
}

export const AuthContextProvider = ({ children }) => {
    const [authUser, setAuthUser] = useState(() => {
        try {
            const storedUser = localStorage.getItem("chat-user");
            return storedUser ? JSON.parse(storedUser) : null;
        } catch (error) {
            console.error('Error parsing stored user:', error);
            return null;
        }
    });

    useEffect(() => {
        try {
            if (authUser) {
                localStorage.setItem("chat-user", JSON.stringify(authUser));
            } else {
                localStorage.removeItem("chat-user");
            }
        } catch (error) {
            console.error('Error managing auth state in localStorage:', error);
        }
    }, [authUser]);

    return (
        <AuthContext.Provider value={{ authUser, setAuthUser }}>
            {children}
        </AuthContext.Provider>
    );
};

AuthContextProvider.propTypes = {
    children: PropTypes.node.isRequired
};