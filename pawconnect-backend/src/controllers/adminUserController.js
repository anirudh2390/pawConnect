const User = require('../models/User');
const Pet = require('../models/Pet');
const Adoption = require('../models/Adoption');
const mongoose = require('mongoose');

// ── GET /api/admin/users ──────────────────────────────────────────────────────
// Returns paginated user list (excluding passwordHash)
const getAllUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search = '', role = '' } = req.query;

        const filter = {};
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }
        if (role && ['USER', 'ADMIN'].includes(role)) {
            filter.role = role;
        }

        const total = await User.countDocuments(filter);
        const users = await User.find(filter)
            .select('-passwordHash')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        return res.status(200).json({
            status: 'success',
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
            users,
        });
    } catch (err) {
        next(err);
    }
};

// ── PATCH /api/admin/users/:id/ban ────────────────────────────────────────────
// Ban or unban a user
const setBanStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { isBanned } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ status: 'error', message: 'Invalid user ID' });
        }

        const user = await User.findById(id).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        // Prevent banning another admin
        if (user.role === 'ADMIN') {
            return res.status(403).json({ status: 'error', message: 'Cannot ban an admin account' });
        }

        // Prevent self-ban
        if (user._id.toString() === req.user.id) {
            return res.status(403).json({ status: 'error', message: 'Cannot ban your own account' });
        }

        user.isBanned = !!isBanned;
        await user.save();

        return res.status(200).json({
            status: 'success',
            message: isBanned ? 'User banned successfully' : 'User unbanned successfully',
            user,
        });
    } catch (err) {
        next(err);
    }
};

// ── DELETE /api/admin/users/:id ───────────────────────────────────────────────
// Permanently delete a user account
const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ status: 'error', message: 'Invalid user ID' });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        if (user.role === 'ADMIN') {
            return res.status(403).json({ status: 'error', message: 'Cannot delete an admin account' });
        }

        if (user._id.toString() === req.user.id) {
            return res.status(403).json({ status: 'error', message: 'Cannot delete your own account' });
        }

        await User.findByIdAndDelete(id);

        return res.status(200).json({
            status: 'success',
            message: 'User account deleted successfully',
        });
    } catch (err) {
        next(err);
    }
};

// ── GET /api/admin/users/stats ────────────────────────────────────────────────
// User statistics for admin dashboard
const getUserStats = async (req, res, next) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'USER' });
        const bannedUsers = await User.countDocuments({ role: 'USER', isBanned: true });
        const adminUsers = await User.countDocuments({ role: 'ADMIN' });
        const totalPets = await Pet.countDocuments();
        const totalAdoptions = await Adoption.countDocuments();

        return res.status(200).json({
            status: 'success',
            stats: {
                totalUsers,
                activeUsers: totalUsers - bannedUsers,
                bannedUsers,
                adminUsers,
                totalPets,
                totalAdoptions,
            },
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAllUsers,
    setBanStatus,
    deleteUser,
    getUserStats,
};
