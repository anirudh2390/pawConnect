import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { token, user } = useContext(AuthContext);

    useEffect(() => {
        let socketInstance = null;

        if (token) {
            const rawBackendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            const cleanBackendUrl = rawBackendUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');

            socketInstance = io(cleanBackendUrl, {
                auth: { token },
                transports: ['websocket', 'polling'],
            });

            socketInstance.on('connect', () => {
                console.log('Socket connected successfully to server gateway.');
                // Announce online presence as soon as the socket connects.
                // user?.id is the field returned by the auth API.
                const uid = user?.id || user?._id;
                if (uid) {
                    socketInstance.emit('user_online', uid);
                    socketInstance.emit('join_user_notifications', uid);
                }
            });

            // Re-announce if the user object becomes available after connection
            // (edge case on first load where token exists but user is still loading)
            if (user) {
                const uid = user?.id || user?._id;
                if (uid && socketInstance.connected) {
                    socketInstance.emit('user_online', uid);
                    socketInstance.emit('join_user_notifications', uid);
                }
            }

            setSocket(socketInstance);
        } else {
            setSocket(null);
        }

        return () => {
            if (socketInstance) {
                socketInstance.disconnect();
            }
        };
        // Re-run when token changes (login/logout) or when user object becomes available
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, user?.id]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
