const User = require('../models/User');
const Pet = require('../models/Pet');
const Adoption = require('../models/Adoption');
const { uploadToCloudinary, deleteFromCloudinary } = require('../services/cloudinaryService');

// ─── GET PROFILE ──────────────────────────────────────────────────────────────
// @desc    Get current authenticated user's full profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        res.status(200).json({ status: 'success', user });
    } catch (error) {
        next(error);
    }
};

// ─── UPDATE PROFILE ───────────────────────────────────────────────────────────
// @desc    Update profile info (name, bio, phone, location, social)
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res, next) => {
    const { name, bio, phoneNumber, location, socialAccounts } = req.body;

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        if (name) user.name = name.trim();
        if (bio !== undefined) user.bio = bio;
        if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
        if (location) user.location = { ...user.location, ...location };
        if (socialAccounts) user.socialAccounts = { ...user.socialAccounts, ...socialAccounts };

        await user.save();

        const userObj = user.toObject();
        delete userObj.passwordHash;

        res.status(200).json({
            status: 'success',
            message: 'Profile updated successfully',
            user: userObj,
        });
    } catch (error) {
        next(error);
    }
};

// ─── UPLOAD PROFILE PICTURE ───────────────────────────────────────────────────
// @desc    Upload / replace profile picture via Cloudinary
// @route   POST /api/users/profile/picture
// @access  Private
const uploadProfilePicture = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 'error', message: 'No image file provided' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        // Delete previous profile picture from Cloudinary if it exists
        if (user.profilePicture?.publicId) {
            await deleteFromCloudinary(user.profilePicture.publicId).catch((err) =>
                console.warn('Warning: Could not delete old profile picture from Cloudinary:', err.message)
            );
        }

        // Upload new image to Cloudinary
        const uploadResult = await uploadToCloudinary(req.file.path, 'pawconnect/avatars');

        user.profilePicture = {
            url: uploadResult.url,
            publicId: uploadResult.publicId,
        };

        await user.save();

        res.status(200).json({
            status: 'success',
            message: 'Profile picture updated successfully',
            profilePicture: user.profilePicture,
        });
    } catch (error) {
        next(error);
    }
};

// ─── CHANGE PASSWORD ──────────────────────────────────────────────────────────
// @desc    Change password (requires current password confirmation)
// @route   PUT /api/users/profile/password
// @access  Private
const changePassword = async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            status: 'error',
            message: 'Current password and new password are required',
        });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({
            status: 'error',
            message: 'New password must be at least 8 characters long',
        });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({
                status: 'error',
                message: 'Current password is incorrect',
                errors: { currentPassword: 'Incorrect current password' },
            });
        }

        // Set new password (pre-save hook handles hashing)
        user.passwordHash = newPassword;
        await user.save();

        res.status(200).json({
            status: 'success',
            message: 'Password changed successfully',
        });
    } catch (error) {
        next(error);
    }
};

// ─── MY LISTINGS ──────────────────────────────────────────────────────────────
// @desc    Get all pet listings created by the logged-in user
// @route   GET /api/users/profile/listings
// @access  Private
const getMyListings = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const filter = { listerId: req.user.id };
        if (status) filter.status = status;

        const [pets, total] = await Promise.all([
            Pet.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Pet.countDocuments(filter),
        ]);

        res.status(200).json({
            status: 'success',
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            listings: pets,
        });
    } catch (error) {
        next(error);
    }
};

// ─── MY ADOPTION REQUESTS (as adopter) ───────────────────────────────────────
// @desc    Get all adoption requests submitted by the logged-in user
// @route   GET /api/users/profile/adoption-requests
// @access  Private
const getMyAdoptionRequests = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const filter = { adopterId: req.user.id };
        if (status) filter.status = status;

        const [requests, total] = await Promise.all([
            Adoption.find(filter)
                .populate('petId', 'name type breed imageUrls status location')
                .populate('listerId', 'name email profilePicture')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Adoption.countDocuments(filter),
        ]);

        res.status(200).json({
            status: 'success',
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            requests,
        });
    } catch (error) {
        next(error);
    }
};

// ─── ADOPTION HISTORY (as lister — received requests for user's pets) ─────────
// @desc    Get adoption requests received for all of the user's listed pets
// @route   GET /api/users/profile/adoption-history
// @access  Private
const getAdoptionHistory = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const filter = { listerId: req.user.id };
        if (status) filter.status = status;

        const [history, total] = await Promise.all([
            Adoption.find(filter)
                .populate('petId', 'name type breed imageUrls status')
                .populate('adopterId', 'name email profilePicture location')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Adoption.countDocuments(filter),
        ]);

        res.status(200).json({
            status: 'success',
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            history,
        });
    } catch (error) {
        next(error);
    }
};

// ─── USER STATISTICS ──────────────────────────────────────────────────────────
// @desc    Aggregate user statistics (listings, requests, history, successes)
// @route   GET /api/users/profile/stats
// @access  Private
const getUserStats = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const [
            totalListings,
            liveListings,
            adoptedListings,
            totalRequestsSent,
            pendingRequests,
            approvedRequests,
            totalRequestsReceived,
        ] = await Promise.all([
            Pet.countDocuments({ listerId: userId }),
            Pet.countDocuments({ listerId: userId, status: 'Live' }),
            Pet.countDocuments({ listerId: userId, status: 'Adopted' }),
            Adoption.countDocuments({ adopterId: userId }),
            Adoption.countDocuments({ adopterId: userId, status: { $in: ['Received', 'In-Review', 'Interview-Scheduled'] } }),
            Adoption.countDocuments({ adopterId: userId, status: 'Approved' }),
            Adoption.countDocuments({ listerId: userId }),
        ]);

        res.status(200).json({
            status: 'success',
            stats: {
                listings: {
                    total: totalListings,
                    live: liveListings,
                    adopted: adoptedListings,
                },
                adoptionRequestsSent: {
                    total: totalRequestsSent,
                    pending: pendingRequests,
                    approved: approvedRequests,
                },
                adoptionRequestsReceived: {
                    total: totalRequestsReceived,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProfile,
    updateProfile,
    uploadProfilePicture,
    changePassword,
    getMyListings,
    getMyAdoptionRequests,
    getAdoptionHistory,
    getUserStats,
};
