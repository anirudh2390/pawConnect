const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const Adoption = require('../models/Adoption');
const mongoose = require('mongoose');

// ── helpers ──────────────────────────────────────────────────────────────────

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const notifyUser = (io, userId, event, payload) => {
    if (io) io.to(userId.toString()).emit(event, payload);
};

// ── GET /api/chats/rooms ──────────────────────────────────────────────────────
// Returns all chat rooms the authenticated user participates in.
// Each room is enriched with: other participant, last message, unread count.
const getMyRooms = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const rooms = await ChatRoom.find({ participantIds: userId })
            .populate('participantIds', 'name profilePicture')
            .populate('lastMessageId')
            .sort({ updatedAt: -1 });

        const enriched = await Promise.all(
            rooms.map(async (room) => {
                const other = room.participantIds.find(
                    (p) => p._id.toString() !== userId
                );
                const unread = await Message.countDocuments({
                    roomId: room._id,
                    senderId: { $ne: userId },
                    isRead: false,
                });
                return {
                    _id: room._id,
                    petRelatedId: room.petRelatedId,
                    otherParticipant: other || null,
                    lastMessage: room.lastMessageId || null,
                    unreadCount: unread,
                    updatedAt: room.updatedAt,
                };
            })
        );

        return res.status(200).json({ status: 'success', rooms: enriched });
    } catch (err) {
        next(err);
    }
};

// ── GET /api/chats/rooms/:roomId/messages ────────────────────────────────────
// Returns paginated message history for a room.
// User must be a participant.
const getRoomMessages = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { roomId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        if (!isValidId(roomId)) {
            return res.status(400).json({ status: 'error', message: 'Invalid room ID' });
        }

        const room = await ChatRoom.findById(roomId);
        if (!room) {
            return res.status(404).json({ status: 'error', message: 'Chat room not found' });
        }

        const isMember = room.participantIds.some((id) => id.toString() === userId);
        if (!isMember) {
            return res.status(403).json({ status: 'error', message: 'Unauthorized: you are not a member of this chat' });
        }

        const total = await Message.countDocuments({ roomId });
        const messages = await Message.find({ roomId })
            .populate('senderId', 'name profilePicture')
            .sort({ createdAt: 1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        return res.status(200).json({
            status: 'success',
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
            messages,
        });
    } catch (err) {
        next(err);
    }
};

// ── POST /api/chats/rooms ─────────────────────────────────────────────────────
// Creates or retrieves an existing chat room between two users.
// Rules:
//   - The two users must share an active adoption request (non-Rejected).
//   - A room is unique per (sorted participant pair).
const getOrCreateRoom = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { otherUserId } = req.body;

        if (!otherUserId) {
            return res.status(400).json({ status: 'error', message: 'otherUserId is required' });
        }
        if (!isValidId(otherUserId)) {
            return res.status(400).json({ status: 'error', message: 'Invalid otherUserId' });
        }
        if (otherUserId === userId) {
            return res.status(400).json({ status: 'error', message: 'Cannot create a chat with yourself' });
        }

        // Adoption eligibility: find a non-Rejected adoption record between these two users
        const adoption = await Adoption.findOne({
            $or: [
                { adopterId: userId, listerId: otherUserId },
                { adopterId: otherUserId, listerId: userId },
            ],
            status: { $nin: ['Rejected'] },
        });

        if (!adoption) {
            return res.status(403).json({
                status: 'error',
                message: 'Chat is only allowed when there is an active adoption request between you and this user',
            });
        }

        // Sort IDs for a canonical pair key
        const sortedIds = [userId, otherUserId].sort();

        let room = await ChatRoom.findOne({
            participantIds: { $all: sortedIds, $size: 2 },
        });

        if (!room) {
            room = await ChatRoom.create({
                participantIds: sortedIds,
                petRelatedId: adoption.petId,
            });
        }

        await room.populate('participantIds', 'name profilePicture');

        return res.status(200).json({ status: 'success', room });
    } catch (err) {
        next(err);
    }
};

// ── POST /api/chats/rooms/:roomId/messages ───────────────────────────────────
// Send and persist a message to a room.
// Also emits a Socket.IO event so other participants receive it in real-time.
const sendMessage = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { roomId } = req.params;
        const { text } = req.body;

        if (!isValidId(roomId)) {
            return res.status(400).json({ status: 'error', message: 'Invalid room ID' });
        }
        if (!text || !text.trim()) {
            return res.status(400).json({ status: 'error', message: 'Message text is required' });
        }

        const room = await ChatRoom.findById(roomId);
        if (!room) {
            return res.status(404).json({ status: 'error', message: 'Chat room not found' });
        }

        const isMember = room.participantIds.some((id) => id.toString() === userId);
        if (!isMember) {
            return res.status(403).json({ status: 'error', message: 'Unauthorized: you are not a member of this chat' });
        }

        // Persist the message
        const message = await Message.create({
            roomId,
            senderId: userId,
            text: text.trim(),
            isRead: false,
        });

        await message.populate('senderId', 'name profilePicture');

        // Update room's last message pointer + updatedAt
        await ChatRoom.findByIdAndUpdate(roomId, { lastMessageId: message._id });

        // Emit to all room members via Socket.IO
        const io = req.app.get('io');
        if (io) {
            // Emit only to OTHER participants (sender gets the message via REST response)
            // This prevents duplicate delivery to the sender
            const otherIds = room.participantIds.filter((id) => id.toString() !== userId);
            for (const otherId of otherIds) {
                // Deliver new message to recipient's personal room (they have joined it via user_online)
                notifyUser(io, otherId, 'message_received', { roomId, message });
                // Also notify about unread count change
                notifyUser(io, otherId, 'unread_count_updated', { roomId });
            }
        }

        return res.status(201).json({ status: 'success', message });
    } catch (err) {
        next(err);
    }
};

// ── PATCH /api/chats/rooms/:roomId/read ──────────────────────────────────────
// Mark all unread messages in a room as read (for the authenticated user).
const markMessagesRead = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { roomId } = req.params;

        if (!isValidId(roomId)) {
            return res.status(400).json({ status: 'error', message: 'Invalid room ID' });
        }

        const room = await ChatRoom.findById(roomId);
        if (!room) {
            return res.status(404).json({ status: 'error', message: 'Chat room not found' });
        }

        const isMember = room.participantIds.some((id) => id.toString() === userId);
        if (!isMember) {
            return res.status(403).json({ status: 'error', message: 'Unauthorized' });
        }

        const result = await Message.updateMany(
            { roomId, senderId: { $ne: userId }, isRead: false },
            { isRead: true }
        );

        // Notify this user's own unread count changed
        const io = req.app.get('io');
        notifyUser(io, userId, 'unread_count_updated', { roomId });

        return res.status(200).json({
            status: 'success',
            markedRead: result.modifiedCount,
        });
    } catch (err) {
        next(err);
    }
};

// ── GET /api/chats/unread-count ───────────────────────────────────────────────
// Returns total unread message count across all rooms for the current user.
const getTotalUnread = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const rooms = await ChatRoom.find({ participantIds: userId }, '_id');
        const roomIds = rooms.map((r) => r._id);

        const count = await Message.countDocuments({
            roomId: { $in: roomIds },
            senderId: { $ne: userId },
            isRead: false,
        });

        return res.status(200).json({ status: 'success', unreadCount: count });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getMyRooms,
    getRoomMessages,
    getOrCreateRoom,
    sendMessage,
    markMessagesRead,
    getTotalUnread,
};
