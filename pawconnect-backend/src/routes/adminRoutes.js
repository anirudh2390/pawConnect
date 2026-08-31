const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
    getPendingPets,
    getAllPetsAdmin,
    approvePet,
    rejectPet,
    markAsAdopted,
    getPetStats,
} = require('../controllers/adminPetController');
const {
    getAllUsers,
    setBanStatus,
    deleteUser,
    getUserStats,
} = require('../controllers/adminUserController');
const {
    getAllReports,
    getReportStats,
    createReport,
    resolveReport,
    deleteReport,
} = require('../controllers/adminReportController');

// ── Pet Management (Admin) ────────────────────────────────────────────────────
router.get('/pets/pending', protect, authorize('ADMIN'), getPendingPets);
router.get('/pets', protect, authorize('ADMIN'), getAllPetsAdmin);
router.get('/pets/stats', protect, authorize('ADMIN'), getPetStats);
router.put('/pets/:id/approve', protect, authorize('ADMIN'), approvePet);
router.put('/pets/:id/reject', protect, authorize('ADMIN'), rejectPet);
router.put('/pets/:id/adopted', protect, authorize('ADMIN'), markAsAdopted);

// ── User Management (Admin) ───────────────────────────────────────────────────
router.get('/users/stats', protect, authorize('ADMIN'), getUserStats);
router.get('/users', protect, authorize('ADMIN'), getAllUsers);
router.patch('/users/:id/ban', protect, authorize('ADMIN'), setBanStatus);
router.delete('/users/:id', protect, authorize('ADMIN'), deleteUser);

// ── Report Management ─────────────────────────────────────────────────────────
router.get('/reports/stats', protect, authorize('ADMIN'), getReportStats);
router.get('/reports', protect, authorize('ADMIN'), getAllReports);
router.post('/reports', protect, createReport);                              // any authenticated user can report
router.patch('/reports/:id/resolve', protect, authorize('ADMIN'), resolveReport);
router.delete('/reports/:id', protect, authorize('ADMIN'), deleteReport);

module.exports = router;
