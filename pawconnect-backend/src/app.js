const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const errorMiddleware = require('./middlewares/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const petRoutes = require('./routes/petRoutes');
const adoptionRoutes = require('./routes/adoptionRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Security Middlewares
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
app.use(
    cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    })
);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express Rate Limit configuration
// In development we raise the ceiling to avoid 429s from automated browser tests.
// Production keeps a strict 100 req / 15 min cap.
const isDev = process.env.NODE_ENV !== 'production';
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDev ? 500 : 100,   // 500 in dev, 100 in prod
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
    skip: () => isDev && process.env.DISABLE_RATE_LIMIT === 'true',
});
app.use('/api/', apiLimiter);

// Static assets staging folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes Hookup
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/adoptions', adoptionRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/admin', adminRoutes);

// Base Checkpoint
app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'PawConnect API Gateway running.' });
});

// Error handling interceptor
app.use(errorMiddleware);

module.exports = app;
