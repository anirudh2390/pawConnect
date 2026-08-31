const socketIO = require('socket.io');

// Track online users: userId -> Set of socketIds
const onlineUsers = new Map();

const initSocket = (server) => {
    const io = socketIO(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // ── User presence ──────────────────────────────────────────────────
        socket.on('user_online', (userId) => {
            if (!userId) return;

            if (!onlineUsers.has(userId)) {
                onlineUsers.set(userId, new Set());
            }
            onlineUsers.get(userId).add(socket.id);

            // Store userId on socket for disconnect cleanup
            socket.userId = userId;

            // Join personal notification room
            socket.join(userId);

            // Broadcast online status to everyone
            io.emit('presence_update', { userId, isOnline: true });
            console.log(`User ${userId} is online (socket ${socket.id})`);
        });

        // Join user's individual room for direct system notifications (legacy support)
        socket.on('join_user_notifications', (userId) => {
            socket.join(userId);
            console.log(`User ${userId} joined notifications channel.`);
        });

        // ── Chat room management ───────────────────────────────────────────
        socket.on('join_room', (roomId) => {
            socket.join(roomId);
            console.log(`Socket ${socket.id} joined room: ${roomId}`);
        });

        socket.on('leave_room', (roomId) => {
            socket.leave(roomId);
            console.log(`Socket ${socket.id} left room: ${roomId}`);
        });

        // ── Real-time messaging ────────────────────────────────────────────
        // NOTE: message_received is emitted by the REST API controller after
        // persisting to MongoDB. No socket-level re-broadcast needed here.
        // The send_message socket event is intentionally NOT handled to avoid
        // delivering duplicate raw (non-persisted) payloads to recipients.

        // ── Typing indicators ──────────────────────────────────────────────
        socket.on('typing', ({ roomId, senderName, isTyping }) => {
            socket.to(roomId).emit('typing_status', { senderName, isTyping });
        });

        // ── Disconnect cleanup ─────────────────────────────────────────────
        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);

            const userId = socket.userId;
            if (userId && onlineUsers.has(userId)) {
                onlineUsers.get(userId).delete(socket.id);

                if (onlineUsers.get(userId).size === 0) {
                    onlineUsers.delete(userId);
                    io.emit('presence_update', { userId, isOnline: false });
                    console.log(`User ${userId} is now offline`);
                }
            }
        });
    });

    return io;
};

module.exports = initSocket;
