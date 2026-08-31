const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const {
    getProfile,
    updateProfile,
    uploadProfilePicture,
    changePassword,
    getMyListings,
    getMyAdoptionRequests,
    getAdoptionHistory,
    getUserStats,
} = require('../controllers/userController');

// ── Profile CRUD ───────────────────────────────────────────────────────────────
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/profile/picture', protect, upload.single('profilePicture'), uploadProfilePicture);
router.put('/profile/password', protect, changePassword);

// ── User Activity Feeds ────────────────────────────────────────────────────────
router.get('/profile/listings', protect, getMyListings);
router.get('/profile/adoption-requests', protect, getMyAdoptionRequests);
router.get('/profile/adoption-history', protect, getAdoptionHistory);

// ── Statistics ─────────────────────────────────────────────────────────────────
router.get('/profile/stats', protect, getUserStats);

module.exports = router;
