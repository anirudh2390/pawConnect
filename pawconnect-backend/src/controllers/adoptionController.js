const Adoption = require('../models/Adoption');
const Pet = require('../models/Pet');
const User = require('../models/User');

// Helper: emit socket notification to a user's personal notification room
const notifyUser = (io, userId, event, payload) => {
    if (io) {
        io.to(userId.toString()).emit(event, payload);
    }
};

// ─── POST /api/adoptions ────────────────────────────────────────────────────
// Submit an adoption request for a pet.
// Rules:
//   - Cannot adopt your own listing
//   - Pet must be 'Approved' (live)
//   - User cannot have an active (non-Rejected) request for the same pet
const submitAdoptionRequest = async (req, res, next) => {
    try {
        const adopterId = req.user.id;
        const { petId, questionnaire } = req.body;

        if (!petId) {
            return res.status(400).json({
                status: 'error',
                message: 'petId is required',
            });
        }

        // Load pet
        const pet = await Pet.findById(petId).populate('listerId', 'name email');
        if (!pet) {
            return res.status(404).json({ status: 'error', message: 'Pet not found' });
        }

        // Cannot adopt own pet
        if (pet.listerId._id.toString() === adopterId) {
            return res.status(403).json({
                status: 'error',
                message: 'You cannot submit an adoption request for your own listing',
            });
        }

        // Pet must be Approved/live
        if (pet.status !== 'Approved') {
            return res.status(400).json({
                status: 'error',
                message: `This pet is not available for adoption (status: ${pet.status})`,
            });
        }

        // Check for existing active request
        const existing = await Adoption.findOne({
            petId,
            adopterId,
            status: { $nin: ['Rejected'] },
        });
        if (existing) {
            return res.status(409).json({
                status: 'error',
                message: 'You already have an active adoption request for this pet',
                existingRequestId: existing._id,
            });
        }

        // Create the adoption request
        const adoption = await Adoption.create({
            petId,
            adopterId,
            listerId: pet.listerId._id,
            questionnaire: questionnaire || {},
            status: 'Received',
        });

        // Populate for response
        const populated = await Adoption.findById(adoption._id)
            .populate('petId', 'name type breed imageUrls location')
            .populate('adopterId', 'name email profilePicture')
            .populate('listerId', 'name email');

        // Socket notification to the pet owner
        const io = req.app.get('io');
        notifyUser(io, pet.listerId._id, 'adoption_notification', {
            type: 'NEW_REQUEST',
            message: `${req.user.name || 'Someone'} submitted an adoption request for ${pet.name}`,
            adoptionId: adoption._id,
            petId: pet._id,
            petName: pet.name,
        });

        return res.status(201).json({
            status: 'success',
            message: 'Adoption request submitted successfully',
            adoption: populated,
        });
    } catch (err) {
        next(err);
    }
};

// ─── GET /api/adoptions/sent ────────────────────────────────────────────────
// Get all adoption requests sent by the authenticated user (as adopter)
const getMyAdoptionRequests = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const filter = { adopterId: req.user.id };
        if (status) filter.status = status;

        const total = await Adoption.countDocuments(filter);
        const requests = await Adoption.find(filter)
            .populate('petId', 'name type breed imageUrls location status listerId')
            .populate('listerId', 'name email phoneNumber profilePicture location')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        return res.status(200).json({
            status: 'success',
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
            requests,
        });
    } catch (err) {
        next(err);
    }
};

// ─── GET /api/adoptions/received ────────────────────────────────────────────
// Get all adoption requests received by the authenticated user (as lister/owner)
const getOwnerAdoptionRequests = async (req, res, next) => {
    try {
        const { status, petId, page = 1, limit = 10 } = req.query;
        const filter = { listerId: req.user.id };
        if (status) filter.status = status;
        if (petId) filter.petId = petId;

        const total = await Adoption.countDocuments(filter);
        const requests = await Adoption.find(filter)
            .populate('petId', 'name type breed imageUrls location status')
            .populate('adopterId', 'name email phoneNumber profilePicture location bio')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        return res.status(200).json({
            status: 'success',
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
            requests,
        });
    } catch (err) {
        next(err);
    }
};

// ─── PATCH /api/adoptions/:id/cancel ────────────────────────────────────────
// Cancel an adoption request. Only the adopter can cancel their own request.
// Can only cancel when status is 'Received' or 'In-Review'.
const cancelAdoptionRequest = async (req, res, next) => {
    try {
        const adoption = await Adoption.findById(req.params.id)
            .populate('petId', 'name listerId')
            .populate('listerId', 'name');

        if (!adoption) {
            return res.status(404).json({ status: 'error', message: 'Adoption request not found' });
        }

        // Only the adopter can cancel
        if (adoption.adopterId.toString() !== req.user.id) {
            return res.status(403).json({
                status: 'error',
                message: 'You are not authorised to cancel this request',
            });
        }

        // Can only cancel non-terminal requests
        const cancellable = ['Received', 'In-Review', 'Interview-Scheduled'];
        if (!cancellable.includes(adoption.status)) {
            return res.status(400).json({
                status: 'error',
                message: `Cannot cancel a request that is already ${adoption.status}`,
            });
        }

        adoption.status = 'Rejected';
        adoption.notes = req.body.reason
            ? `Cancelled by adopter: ${req.body.reason}`
            : 'Cancelled by adopter';
        await adoption.save();

        // Notify the pet owner
        const io = req.app.get('io');
        notifyUser(io, adoption.listerId._id, 'adoption_notification', {
            type: 'REQUEST_CANCELLED',
            message: `An adoption request for ${adoption.petId.name} was cancelled by the applicant`,
            adoptionId: adoption._id,
            petId: adoption.petId._id,
            petName: adoption.petId.name,
        });

        return res.status(200).json({
            status: 'success',
            message: 'Adoption request cancelled',
            adoption,
        });
    } catch (err) {
        next(err);
    }
};

// ─── PATCH /api/adoptions/:id/respond ───────────────────────────────────────
// Respond to an adoption request (approve or reject).
// Only the pet owner (lister) can respond.
// On approve:
//   - Sets this adoption to 'Approved'
//   - Sets pet.status to 'Adopted'
//   - Rejects all other pending requests for the same pet
// On reject: Sets this adoption to 'Rejected'
const respondToAdoptionRequest = async (req, res, next) => {
    try {
        const { action, notes } = req.body; // action: 'approve' | 'reject' | 'review' | 'schedule'

        const validActions = ['approve', 'reject', 'review', 'schedule'];
        if (!action || !validActions.includes(action)) {
            return res.status(400).json({
                status: 'error',
                message: `action must be one of: ${validActions.join(', ')}`,
            });
        }

        const adoption = await Adoption.findById(req.params.id)
            .populate('petId', 'name status listerId')
            .populate('adopterId', 'name email');

        if (!adoption) {
            return res.status(404).json({ status: 'error', message: 'Adoption request not found' });
        }

        // Only the lister can respond
        if (adoption.listerId.toString() !== req.user.id) {
            return res.status(403).json({
                status: 'error',
                message: 'You are not authorised to respond to this request',
            });
        }

        // Cannot respond to already-terminal requests
        const terminal = ['Approved', 'Rejected'];
        if (terminal.includes(adoption.status)) {
            return res.status(400).json({
                status: 'error',
                message: `This request has already been ${adoption.status}`,
            });
        }

        const io = req.app.get('io');

        if (action === 'approve') {
            // 1. Approve this request
            adoption.status = 'Approved';
            if (notes) adoption.notes = notes;
            await adoption.save();

            // 2. Mark the pet as Adopted
            await Pet.findByIdAndUpdate(adoption.petId._id, { status: 'Adopted' });

            // 3. Auto-reject all other active requests for this pet
            const otherRequests = await Adoption.find({
                petId: adoption.petId._id,
                _id: { $ne: adoption._id },
                status: { $nin: ['Rejected'] },
            }).populate('adopterId', '_id');

            if (otherRequests.length > 0) {
                await Adoption.updateMany(
                    {
                        petId: adoption.petId._id,
                        _id: { $ne: adoption._id },
                        status: { $nin: ['Rejected'] },
                    },
                    {
                        status: 'Rejected',
                        notes: 'This pet has been adopted by another applicant',
                    }
                );

                // Notify each rejected adopter
                for (const req of otherRequests) {
                    notifyUser(io, req.adopterId._id, 'adoption_notification', {
                        type: 'REQUEST_REJECTED',
                        message: `Your adoption request for ${adoption.petId.name} was not successful — the pet has found a home`,
                        adoptionId: req._id,
                        petId: adoption.petId._id,
                        petName: adoption.petId.name,
                    });
                }
            }

            // 4. Notify the approved adopter
            notifyUser(io, adoption.adopterId._id, 'adoption_notification', {
                type: 'REQUEST_APPROVED',
                message: `🎉 Congratulations! Your adoption request for ${adoption.petId.name} has been approved!`,
                adoptionId: adoption._id,
                petId: adoption.petId._id,
                petName: adoption.petId.name,
            });

        } else if (action === 'reject') {
            adoption.status = 'Rejected';
            if (notes) adoption.notes = notes;
            await adoption.save();

            // Notify the adopter
            notifyUser(io, adoption.adopterId._id, 'adoption_notification', {
                type: 'REQUEST_REJECTED',
                message: `Your adoption request for ${adoption.petId.name} was not approved`,
                adoptionId: adoption._id,
                petId: adoption.petId._id,
                petName: adoption.petId.name,
                notes: notes || null,
            });

        } else if (action === 'review') {
            adoption.status = 'In-Review';
            if (notes) adoption.notes = notes;
            await adoption.save();

            notifyUser(io, adoption.adopterId._id, 'adoption_notification', {
                type: 'STATUS_UPDATED',
                message: `Your adoption request for ${adoption.petId.name} is now under review`,
                adoptionId: adoption._id,
                petId: adoption.petId._id,
                petName: adoption.petId.name,
            });

        } else if (action === 'schedule') {
            adoption.status = 'Interview-Scheduled';
            if (notes) adoption.notes = notes;
            await adoption.save();

            notifyUser(io, adoption.adopterId._id, 'adoption_notification', {
                type: 'INTERVIEW_SCHEDULED',
                message: `An interview has been scheduled for your adoption request for ${adoption.petId.name}`,
                adoptionId: adoption._id,
                petId: adoption.petId._id,
                petName: adoption.petId.name,
                notes: notes || null,
            });
        }

        const updated = await Adoption.findById(adoption._id)
            .populate('petId', 'name type breed imageUrls location status')
            .populate('adopterId', 'name email profilePicture phoneNumber')
            .populate('listerId', 'name email');

        return res.status(200).json({
            status: 'success',
            message: `Adoption request ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action === 'review' ? 'moved to review' : 'interview scheduled'}`,
            adoption: updated,
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    submitAdoptionRequest,
    getMyAdoptionRequests,
    getOwnerAdoptionRequests,
    cancelAdoptionRequest,
    respondToAdoptionRequest,
};
