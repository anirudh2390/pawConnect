const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
    submitAdoptionRequest,
    getMyAdoptionRequests,
    getOwnerAdoptionRequests,
    cancelAdoptionRequest,
    respondToAdoptionRequest,
} = require('../controllers/adoptionController');

router.post('/', protect, submitAdoptionRequest);
router.get('/sent', protect, getMyAdoptionRequests);
router.get('/received', protect, getOwnerAdoptionRequests);
router.patch('/:id/cancel', protect, cancelAdoptionRequest);
router.patch('/:id/respond', protect, respondToAdoptionRequest);

module.exports = router;
