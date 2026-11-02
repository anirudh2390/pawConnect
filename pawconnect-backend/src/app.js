const fs = require('fs');
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
const chatbotRoutes = require('./routes/chatbotRoutes');

const app = express();

// Security Middlewares
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((u) => u.trim().replace(/\/+$/, ''))
    : ['http://localhost:5173'];

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*') || process.env.NODE_ENV !== 'production') {
                return callback(null, true);
            }
            return callback(null, true);
        },
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
const uploadsDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// Fallback for missing uploads (e.g. cloned repos where uploads/ was gitignored)
app.get('/uploads/:filename', (req, res) => {
    const filename = req.params.filename.toLowerCase();
    if (filename.startsWith('profilepicture') || filename.includes('avatar')) {
        return res.redirect('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80');
    }
    const isCat = filename.includes('cat');
    const fallbackImage = isCat
        ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80'
        : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80';
    return res.redirect(fallbackImage);
});

// Routes Hookup
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/adoptions', adoptionRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Serve frontend production build if available
const frontendDistPath = path.join(__dirname, '../../pawconnect-frontend/dist');
const localDistPath = path.join(__dirname, '../public');

if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
            return next();
        }
        res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
} else if (fs.existsSync(localDistPath)) {
    app.use(express.static(localDistPath));
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
            return next();
        }
        res.sendFile(path.join(localDistPath, 'index.html'));
    });
} else {
    // Base Checkpoint
    app.get('/', (req, res) => {
        res.status(200).json({ status: 'ok', message: 'PawConnect API Gateway running.' });
    });
}

// Error handling interceptor
app.use(errorMiddleware);

module.exports = app;
