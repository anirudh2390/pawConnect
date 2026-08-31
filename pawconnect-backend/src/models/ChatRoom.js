const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema(
    {
        participantIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        petRelatedId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Pet',
        },
        lastMessageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
            sparse: true,
        },
    },
    {
        timestamps: true,
    }
);

// Efficient lookup for a unique sorted participant pair
chatRoomSchema.index({ participantIds: 1 });
// Cover the common sort by updatedAt descending
chatRoomSchema.index({ participantIds: 1, updatedAt: -1 });

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
