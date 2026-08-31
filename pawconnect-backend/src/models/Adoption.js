const mongoose = require('mongoose');

const adoptionSchema = new mongoose.Schema(
    {
        petId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Pet',
            required: true,
            index: true,
        },
        adopterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        listerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        questionnaire: {
            experienceLevel: String,
            homeEnvironment: String,
            hoursLeftAlone: Number,
            hasOtherPets: Boolean,
        },
        status: {
            type: String,
            enum: ['Received', 'In-Review', 'Interview-Scheduled', 'Approved', 'Rejected'],
            default: 'Received',
            index: true,
        },
        notes: String,
        cancelNote: String,
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Adoption', adoptionSchema);
