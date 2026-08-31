const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
    getMyRooms,
    getRoomMessages,
    getOrCreateRoom,
    sendMessage,
    markMessagesRead,
    getTotalUnread,
} = require('../controllers/chatController');

// All chat routes require authentication
router.use(protect);

// GET  /api/chats/rooms                  – list all my conversations
router.get('/rooms', getMyRooms);

// GET  /api/chats/unread-count           – total unread across all rooms
router.get('/unread-count', getTotalUnread);

// POST /api/chats/rooms                  – create / fetch a room with another user
router.post('/rooms', getOrCreateRoom);

// GET  /api/chats/rooms/:roomId/messages – paginated message history
router.get('/rooms/:roomId/messages', getRoomMessages);

// POST /api/chats/rooms/:roomId/messages – send & persist a message
router.post('/rooms/:roomId/messages', sendMessage);

// PATCH /api/chats/rooms/:roomId/read   – mark all room messages as read
router.patch('/rooms/:roomId/read', markMessagesRead);

module.exports = router;
