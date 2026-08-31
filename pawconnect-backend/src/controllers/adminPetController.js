const Pet = require('../models/Pet');

/**
 * @desc    Get all pending pet listings for admin review
 * @route   GET /api/admin/pets/pending
 * @access  Private (Admin only)
 */
const getPendingPets = async (req, res, next) => {
    try {
        const { sort = '-createdAt' } = req.query;

        const pets = await Pet.find({ status: 'Pending' })
            .sort(sort)
            .populate('listerId', 'name email phoneNumber location');

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            message: 'Pending pet listings retrieved successfully',
            count: pets.length,
            pets,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all pet listings (admin dashboard)
 * @route   GET /api/admin/pets
 * @access  Private (Admin only)
 */
const getAllPetsAdmin = async (req, res, next) => {
    try {
        const { status, type, sort = '-createdAt' } = req.query;

        const filter = {};
        if (status) {
            filter.status = status;
        }
        if (type && type !== 'All') {
            filter.type = type;
        }

        const pets = await Pet.find(filter)
            .sort(sort)
            .populate('listerId', 'name email phoneNumber location');

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            message: 'All pet listings retrieved successfully',
            count: pets.length,
            pets,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Approve a pet listing
 * @route   PUT /api/admin/pets/:id/approve
 * @access  Private (Admin only)
 */
const approvePet = async (req, res, next) => {
    try {
        const { id } = req.params;

        const pet = await Pet.findById(id);

        if (!pet) {
            return res.status(404).json({
                status: 'error',
                statusCode: 404,
                message: 'Pet listing not found',
            });
        }

        pet.status = 'Approved';
        await pet.save();

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            message: 'Pet listing approved successfully',
            pet,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Reject a pet listing with reason
 * @route   PUT /api/admin/pets/:id/reject
 * @access  Private (Admin only)
 */
const rejectPet = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({
                status: 'error',
                statusCode: 400,
                message: 'Rejection reason is required',
                errors: { reason: 'Reason for rejection must be provided' },
            });
        }

        const pet = await Pet.findById(id);

        if (!pet) {
            return res.status(404).json({
                status: 'error',
                statusCode: 404,
                message: 'Pet listing not found',
            });
        }

        pet.status = 'Rejected';
        // Optionally store rejection reason in a new field if needed
        // For now, we'll just update status

        await pet.save();

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            message: 'Pet listing rejected successfully',
            pet,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Mark a pet as adopted
 * @route   PUT /api/admin/pets/:id/adopted
 * @access  Private (Admin only)
 */
const markAsAdopted = async (req, res, next) => {
    try {
        const { id } = req.params;

        const pet = await Pet.findById(id);

        if (!pet) {
            return res.status(404).json({
                status: 'error',
                statusCode: 404,
                message: 'Pet listing not found',
            });
        }

        pet.status = 'Adopted';
        await pet.save();

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            message: 'Pet marked as adopted successfully',
            pet,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get admin dashboard statistics
 * @route   GET /api/admin/pets/stats
 * @access  Private (Admin only)
 */
const getPetStats = async (req, res, next) => {
    try {
        const totalListings = await Pet.countDocuments();
        const pendingListings = await Pet.countDocuments({ status: 'Pending' });
        const approvedListings = await Pet.countDocuments({ status: 'Approved' });
        const rejectedListings = await Pet.countDocuments({ status: 'Rejected' });
        const adoptedListings = await Pet.countDocuments({ status: 'Adopted' });

        const typeBreakdown = await Pet.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } },
        ]);

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            message: 'Pet statistics retrieved successfully',
            stats: {
                totalListings,
                pendingListings,
                approvedListings,
                rejectedListings,
                adoptedListings,
                typeBreakdown,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPendingPets,
    getAllPetsAdmin,
    approvePet,
    rejectPet,
    markAsAdopted,
    getPetStats,
};
