const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
    {
        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        targetType: {
            type: String,
            enum: ['Pet', 'User'],
            required: true,
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'targetType',
        },
        reason: {
            type: String,
            required: true,
            trim: true,
        },
        details: {
            type: String,
            trim: true,
            default: '',
        },
        status: {
            type: String,
            enum: ['Open', 'Resolved', 'Dismissed'],
            default: 'Open',
        },
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        resolvedAt: {
            type: Date,
            default: null,
        },
        resolutionNote: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
