const Joi = require('joi');

/**
 * Validation schema for creating a pet listing
 */
const petCreateSchema = Joi.object({
    name: Joi.string().required().trim().messages({
        'string.empty': 'Pet name is required',
        'any.required': 'Pet name is required',
    }),
    type: Joi.string().valid('Dog', 'Cat', 'Other').required().messages({
        'any.only': 'Pet type must be Dog, Cat, or Other',
        'any.required': 'Pet type is required',
    }),
    breed: Joi.string().required().trim().messages({
        'string.empty': 'Breed is required',
        'any.required': 'Breed is required',
    }),
    age: Joi.object({
        number: Joi.number().min(0).max(100),
        unit: Joi.string().valid('Months', 'Years').default('Years'),
    }).optional(),
    gender: Joi.string().valid('Male', 'Female').required().messages({
        'any.only': 'Gender must be Male or Female',
        'any.required': 'Gender is required',
    }),
    size: Joi.string().valid('Small', 'Medium', 'Large').required().messages({
        'any.only': 'Size must be Small, Medium, or Large',
        'any.required': 'Size is required',
    }),
    vaccinationStatus: Joi.string().valid('Fully', 'Partially', 'None').default('None'),
    medicalHistory: Joi.string().trim().max(1000).optional().allow(''),
    description: Joi.string().trim().max(2000).optional().allow(''),
    location: Joi.object({
        city: Joi.string().required().trim(),
        state: Joi.string().trim().optional(),
    }).required().messages({
        'object.base': 'Location must include city and optionally state',
        'any.required': 'Location is required',
    }),
}).unknown(true); // Allow files field from multer

/**
 * Validation schema for updating a pet listing
 */
const petUpdateSchema = Joi.object({
    name: Joi.string().trim().optional(),
    type: Joi.string().valid('Dog', 'Cat', 'Other').optional(),
    breed: Joi.string().trim().optional(),
    age: Joi.object({
        number: Joi.number().min(0).max(100),
        unit: Joi.string().valid('Months', 'Years').default('Years'),
    }).optional(),
    gender: Joi.string().valid('Male', 'Female').optional(),
    size: Joi.string().valid('Small', 'Medium', 'Large').optional(),
    vaccinationStatus: Joi.string().valid('Fully', 'Partially', 'None').optional(),
    medicalHistory: Joi.string().trim().max(1000).optional().allow(''),
    description: Joi.string().trim().max(2000).optional().allow(''),
    location: Joi.object({
        city: Joi.string().trim().optional(),
        state: Joi.string().trim().optional(),
    }).optional(),
}).unknown(true);

/**
 * Middleware to validate pet creation request
 */
const validatePetCreate = (req, res, next) => {
    const { error, value } = petCreateSchema.validate(req.body);
    if (error) {
        const errors = {};
        error.details.forEach((detail) => {
            errors[detail.context.key] = detail.message;
        });
        return res.status(400).json({
            status: 'error',
            statusCode: 400,
            message: 'Validation failed',
            errors,
        });
    }
    req.validatedBody = value;
    next();
};

/**
 * Middleware to validate pet update request
 */
const validatePetUpdate = (req, res, next) => {
    const { error, value } = petUpdateSchema.validate(req.body);
    if (error) {
        const errors = {};
        error.details.forEach((detail) => {
            errors[detail.context.key] = detail.message;
        });
        return res.status(400).json({
            status: 'error',
            statusCode: 400,
            message: 'Validation failed',
            errors,
        });
    }
    req.validatedBody = value;
    next();
};

module.exports = {
    validatePetCreate,
    validatePetUpdate,
};
