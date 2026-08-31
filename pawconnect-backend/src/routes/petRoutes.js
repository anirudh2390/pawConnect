const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { validatePetCreate, validatePetUpdate } = require('../validators/petValidator');
const {
    createPet,
    getPets,
    getPetById,
    getUserPets,
    updatePet,
    deletePet,
} = require('../controllers/petController');

// Public routes
router.get('/', getPets);
router.get('/:id', getPetById);

// Protected routes (user)
router.post('/', protect, upload.array('images', 5), validatePetCreate, createPet);
router.get('/user/listings', protect, getUserPets);
router.put('/:id', protect, upload.array('images', 5), validatePetUpdate, updatePet);
router.delete('/:id', protect, deletePet);

module.exports = router;
