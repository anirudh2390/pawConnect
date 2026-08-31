const Joi = require('joi');

const registerSchema = Joi.object({
    name: Joi.string().required().min(2).max(50).messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.empty': 'Name is required',
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'Please enter a valid email address',
        'string.empty': 'Email is required',
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Password must be at least 6 characters long',
        'string.empty': 'Password is required',
    }),
    location: Joi.object({
        city: Joi.string().required().messages({ 'string.empty': 'City is required' }),
        state: Joi.string().required().messages({ 'string.empty': 'State is required' }),
    }).required(),
    phoneNumber: Joi.string().pattern(/^[0-9+\s-]{8,15}$/).required().messages({
        'string.pattern.base': 'Please enter a valid phone number (8-15 digits)',
        'string.empty': 'Phone number is required',
    }),
});

const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Please enter a valid email address',
        'string.empty': 'Email is required',
    }),
    password: Joi.string().required().messages({
        'string.empty': 'Password is required',
    }),
});

const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            const errors = error.details.reduce((acc, current) => {
                acc[current.path.join('.')] = current.message;
                return acc;
            }, {});
            return res.status(400).json({
                status: 'error',
                statusCode: 400,
                message: 'Validation failed',
                errors,
            });
        }
        next();
    };
};

module.exports = {
    validateRegister: validateRequest(registerSchema),
    validateLogin: validateRequest(loginSchema),
};
