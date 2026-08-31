const Pet = require('../models/Pet');
const { uploadToCloudinary, deleteFromCloudinary } = require('../services/cloudinaryService');

/**
 * @desc    Create a new pet listing
 * @route   POST /api/pets
 * @access  Private
 */
const createPet = async (req, res, next) => {
    try {
        const { name, type, breed, age, gender, size, vaccinationStatus, medicalHistory, description, location, contact } = req.body;

        // Validate required fields
        if (!name || !type || !breed || !gender || !size || !location) {
            return res.status(400).json({
                status: 'error',
                statusCode: 400,
                message: 'Missing required fields',
                errors: {
                    name: !name ? 'Pet name is required' : undefined,
                    type: !type ? 'Pet type is required' : undefined,
                    breed: !breed ? 'Breed is required' : undefined,
                    gender: !gender ? 'Gender is required' : undefined,
                    size: !size ? 'Size is required' : undefined,
                    location: !location ? 'Location is required' : undefined,
                },
            });
        }

        // Upload images to Cloudinary if provided
        let imageUrls = [];
        if (req.files && req.files.length > 0) {
            try {
                for (const file of req.files) {
                    const uploadResult = await uploadToCloudinary(file.path, 'pawconnect/pets');
                    if (uploadResult) {
                        imageUrls.push(uploadResult.url);
                    }
                }
            } catch (uploadError) {
                console.error('Image upload failed:', uploadError.message);
                return res.status(400).json({
                    status: 'error',
                    statusCode: 400,
                    message: 'Failed to upload images',
                    error: uploadError.message,
                });
            }
        }

        // Create new pet listing with Pending status
        const newPet = new Pet({
            listerId: req.user.id,
            name: name.trim(),
            type,
            breed: breed.trim(),
            age: age ? JSON.parse(age) : { number: null, unit: 'Years' },
            gender,
            size,
            vaccinationStatus: vaccinationStatus || 'None',
            medicalHistory: medicalHistory ? medicalHistory.trim() : '',
            description: description ? description.trim() : '',
            imageUrls,
            location: typeof location === 'string' ? JSON.parse(location) : location,
            status: 'Pending', // Default status for newly created listings
        });

        await newPet.save();

        res.status(201).json({
            status: 'success',
            statusCode: 201,
            message: 'Pet listing created successfully. Awaiting admin approval.',
            pet: newPet,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all approved pet listings (public browse)
 * @route   GET /api/pets
 * @access  Public
 */
const getPets = async (req, res, next) => {
    try {
        const {
            search,
            type,
            breed,
            location,
            gender,
            vaccinationStatus,
            ageRange,
            sort = 'newest',
            page = '1',
            limit = '9',
        } = req.query;

        const pageNumber = Math.max(1, parseInt(page, 10) || 1);
        const pageSize = Math.max(1, Math.min(50, parseInt(limit, 10) || 9));

        const match = { status: 'Approved' };
        const andConditions = [];

        const parseArrayParam = (value) => {
            if (!value) return [];
            if (Array.isArray(value)) return value.map((item) => item.trim()).filter(Boolean);
            return value
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean);
        };

        const selectedTypes = parseArrayParam(type).filter((value) => value !== 'All');
        const selectedGenders = parseArrayParam(gender);
        const selectedVaccination = parseArrayParam(vaccinationStatus);
        const selectedAgeRanges = parseArrayParam(ageRange);

        if (selectedTypes.length > 0) {
            match.type = { $in: selectedTypes };
        }

        if (selectedGenders.length > 0) {
            match.gender = { $in: selectedGenders };
        }

        if (selectedVaccination.length > 0) {
            match.vaccinationStatus = { $in: selectedVaccination };
        }

        if (breed) {
            andConditions.push({ breed: new RegExp(breed, 'i') });
        }

        if (location) {
            const locationRegex = new RegExp(location, 'i');
            andConditions.push({
                $or: [
                    { 'location.city': locationRegex },
                    { 'location.state': locationRegex },
                ],
            });
        }

        if (search) {
            const searchRegex = new RegExp(search.trim(), 'i');
            andConditions.push({
                $or: [
                    { name: searchRegex },
                    { breed: searchRegex },
                    { type: searchRegex },
                    { description: searchRegex },
                    { 'location.city': searchRegex },
                    { 'location.state': searchRegex },
                ],
            });
        }

        if (selectedAgeRanges.length > 0) {
            const ageFilters = [];

            selectedAgeRanges.forEach((range) => {
                switch (range) {
                    case 'Puppy':
                        ageFilters.push({
                            $or: [
                                { 'age.unit': 'Months' },
                                {
                                    $and: [
                                        { 'age.unit': 'Years' },
                                        { 'age.number': { $lt: 1 } },
                                    ],
                                },
                            ],
                        });
                        break;
                    case 'Young':
                        ageFilters.push({
                            $and: [
                                { 'age.unit': 'Years' },
                                { 'age.number': { $gte: 1, $lt: 3 } },
                            ],
                        });
                        break;
                    case 'Adult':
                        ageFilters.push({
                            $and: [
                                { 'age.unit': 'Years' },
                                { 'age.number': { $gte: 3, $lt: 7 } },
                            ],
                        });
                        break;
                    case 'Senior':
                        ageFilters.push({
                            $and: [
                                { 'age.unit': 'Years' },
                                { 'age.number': { $gte: 7 } },
                            ],
                        });
                        break;
                }
            });

            if (ageFilters.length > 0) {
                andConditions.push({ $or: ageFilters });
            }
        }

        if (andConditions.length > 0) {
            match.$and = andConditions;
        }

        const sortMap = {
            newest: '-createdAt',
            oldest: 'createdAt',
            nameAsc: 'name',
            nameDesc: '-name',
        };
        const sortOrder = sortMap[sort] || '-createdAt';

        const totalCount = await Pet.countDocuments(match);
        const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
        const currentPage = Math.min(pageNumber, totalPages);

        const pets = await Pet.find(match)
            .sort(sortOrder)
            .skip((currentPage - 1) * pageSize)
            .limit(pageSize)
            .populate('listerId', 'name phoneNumber location email socialAccounts');

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            message: 'Approved pet listings retrieved successfully',
            pets,
            page: currentPage,
            limit: pageSize,
            totalCount,
            totalPages,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get pet listing by ID
 * @route   GET /api/pets/:id
 * @access  Public
 */
const getPetById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const pet = await Pet.findById(id).populate(
            'listerId',
            'name phoneNumber location email socialAccounts bio profilePicture createdAt'
        );

        if (!pet) {
            return res.status(404).json({
                status: 'error',
                statusCode: 404,
                message: 'Pet listing not found',
            });
        }

        // Allow viewing of pending/rejected listings only by owner or admin
        if (pet.status !== 'Approved' && pet.status !== 'Adopted') {
            if (req.user && (req.user.id.toString() === pet.listerId._id.toString() || req.user.role === 'ADMIN')) {
                // Owner or admin can view
            } else {
                return res.status(404).json({
                    status: 'error',
                    statusCode: 404,
                    message: 'Pet listing not found or not approved',
                });
            }
        }

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            message: 'Pet listing details retrieved successfully',
            pet,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get current user's pet listings
 * @route   GET /api/pets/user/listings
 * @access  Private
 */
const getUserPets = async (req, res, next) => {
    try {
        const pets = await Pet.find({ listerId: req.user.id }).sort('-createdAt');

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            message: 'Your pet listings retrieved successfully',
            count: pets.length,
            pets,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update a pet listing (owner only)
 * @route   PUT /api/pets/:id
 * @access  Private
 */
const updatePet = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, type, breed, age, gender, size, vaccinationStatus, medicalHistory, description, location } = req.body;

        // Find pet
        const pet = await Pet.findById(id);

        if (!pet) {
            return res.status(404).json({
                status: 'error',
                statusCode: 404,
                message: 'Pet listing not found',
            });
        }

        // Verify ownership
        if (pet.listerId.toString() !== req.user.id) {
            return res.status(403).json({
                status: 'error',
                statusCode: 403,
                message: 'Forbidden: You can only edit your own listings',
            });
        }

        // Handle new image uploads
        let newImageUrls = [...(pet.imageUrls || [])];
        if (req.files && req.files.length > 0) {
            try {
                for (const file of req.files) {
                    const uploadResult = await uploadToCloudinary(file.path, 'pawconnect/pets');
                    if (uploadResult) {
                        newImageUrls.push(uploadResult.url);
                    }
                }
            } catch (uploadError) {
                console.error('Image upload failed:', uploadError.message);
                return res.status(400).json({
                    status: 'error',
                    statusCode: 400,
                    message: 'Failed to upload images',
                    error: uploadError.message,
                });
            }
        }

        // Update fields
        if (name) pet.name = name.trim();
        if (type) pet.type = type;
        if (breed) pet.breed = breed.trim();
        if (age) pet.age = JSON.parse(age);
        if (gender) pet.gender = gender;
        if (size) pet.size = size;
        if (vaccinationStatus !== undefined) pet.vaccinationStatus = vaccinationStatus;
        if (medicalHistory !== undefined) pet.medicalHistory = medicalHistory.trim();
        if (description !== undefined) pet.description = description.trim();
        if (location) pet.location = typeof location === 'string' ? JSON.parse(location) : location;
        if (newImageUrls.length > 0) pet.imageUrls = newImageUrls;

        // Reset status to Pending for admin review (unless status is explicitly set to Adopted)
        if (pet.status !== 'Adopted') {
            pet.status = 'Pending';
        }

        await pet.save();

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            message: 'Pet listing updated successfully. Awaiting admin review.',
            pet,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete a pet listing (owner only)
 * @route   DELETE /api/pets/:id
 * @access  Private
 */
const deletePet = async (req, res, next) => {
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

        // Verify ownership
        if (pet.listerId.toString() !== req.user.id) {
            return res.status(403).json({
                status: 'error',
                statusCode: 403,
                message: 'Forbidden: You can only delete your own listings',
            });
        }

        // Delete images from Cloudinary
        if (pet.imageUrls && pet.imageUrls.length > 0) {
            // Note: Using URL to delete is not straightforward with Cloudinary
            // Ideally, we would have stored publicIds in the Pet model
            console.log('Note: Image deletion from Cloudinary requires storing publicId in Pet model');
        }

        await Pet.findByIdAndDelete(id);

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            message: 'Pet listing deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createPet,
    getPets,
    getPetById,
    getUserPets,
    updatePet,
    deletePet,
};
