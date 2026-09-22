const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');


// Helper to sign JWT token
const signToken = (userId, role) => {
    return jwt.sign(
        { id: userId, role },
        process.env.JWT_SECRET || 'supersecretpawconnectkey12345!',
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
    const { name, email, password, location, phoneNumber } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                status: 'error',
                statusCode: 400,
                message: 'A user with this email address already exists',
                errors: { email: 'Email address already registered' },
            });
        }

        // Create user. Note: Force role to 'USER' even if registration payload requests ADMIN
        const newUser = new User({
            name,
            email,
            passwordHash: password, // Pre-save hook hashes this
            role: 'USER',
            location,
            phoneNumber,
        });

        await newUser.save();

        // Sign token & return success
        const token = signToken(newUser._id, newUser.role);

        res.status(201).json({
            status: 'success',
            message: 'Account created successfully',
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                location: newUser.location,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Login existing user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        // Check user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                status: 'error',
                statusCode: 401,
                message: 'Invalid email or password credentials',
                errors: { general: 'Invalid email or password' },
            });
        }

        // Verify user is active
        if (user.isBanned) {
            return res.status(403).json({
                status: 'error',
                statusCode: 403,
                message: 'Your account is banned. Please contact platform administrators.',
            });
        }

        // Verify Password Match
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                status: 'error',
                statusCode: 401,
                message: 'Invalid email or password credentials',
                errors: { general: 'Invalid email or password' },
            });
        }

        // Sign Token & Return User data
        const token = signToken(user._id, user.role);

        res.status(200).json({
            status: 'success',
            message: 'Logged in successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                location: user.location,
                phoneNumber: user.phoneNumber,
                bio: user.bio,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get Current Logged in User Profile Details
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                status: 'error',
                statusCode: 404,
                message: 'User profile not found',
            });
        }

        res.status(200).json({
            status: 'success',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                location: user.location,
                phoneNumber: user.phoneNumber,
                bio: user.bio,
                socialAccounts: user.socialAccounts,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Forgot Password Request
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                status: 'error',
                statusCode: 404,
                message: 'No account matching this email address was found',
            });
        }

        // Get reset token
        const resetToken = user.getResetPasswordToken();

        await user.save({ validateBeforeSave: false });

        // Create reset url
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

        const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password reset token',
                message,
            });

            res.status(200).json({
                status: 'success',
                message: 'Reset password instructions dispatched to email inbox',
            });
        } catch (err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });

            return res.status(500).json({
                status: 'error',
                statusCode: 500,
                message: 'Email could not be sent',
            });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Reset Password Action
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
    const { token, newPassword } = req.body;
    try {
        // Get hashed token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({
                status: 'error',
                statusCode: 400,
                message: 'Invalid or expired password reset link token',
            });
        }

        // Set new password
        user.passwordHash = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({
            status: 'success',
            message: 'Password updated successfully. You can now login.',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    getMe,
    forgotPassword,
    resetPassword,
};
