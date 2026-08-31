const mongoose = require('mongoose');

const petSchema = new mongoose.Schema(
    {
        listerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            enum: ['Dog', 'Cat', 'Other'],
            required: true,
            index: true,
        },
        breed: {
            type: String,
            required: true,
            index: true,
        },
        aiPredictedBreed: {
            detectedBreed: String,
            confidenceScore: Number,
        },
        age: {
            number: Number,
            unit: {
                type: String,
                enum: ['Months', 'Years'],
                default: 'Years',
            },
        },
        gender: {
            type: String,
            enum: ['Male', 'Female'],
            required: true,
        },
        size: {
            type: String,
            enum: ['Small', 'Medium', 'Large'],
            required: true,
        },
        vaccinationStatus: {
            type: String,
            enum: ['Fully', 'Partially', 'None'],
            default: 'None',
        },
        medicalHistory: String,
        description: String,
        imageUrls: [String],
        location: {
            city: {
                type: String,
                required: true,
                index: true,
            },
            state: String,
        },
        status: {
            type: String,
            enum: ['Draft', 'Pending', 'Approved', 'Adopted', 'Rejected'],
            default: 'Pending',
            index: true,
        },
        fraudVerificationScore: {
            type: Number,
            default: 0.0,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for search filters optimization
petSchema.index({ type: 1, breed: 1, 'location.city': 1 });

module.exports = mongoose.model('Pet', petSchema);
