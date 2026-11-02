const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const dns = require('dns');
const mongoose = require('mongoose');

// Configure public DNS servers to prevent SRV lookup failures on Windows with mongodb+srv
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
    // Keep system defaults if custom servers fail to set
}

let cachedPromise = null;

const connectDB = async () => {
    // If already connected, reuse existing mongoose connection (vital for serverless & fast response)
    if (mongoose.connection.readyState >= 1) {
        return mongoose.connection;
    }

    if (!cachedPromise) {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/pawconnect';
        cachedPromise = mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
        }).then((conn) => {
            console.log(`MongoDB Connected: ${conn.connection.host}`);
            return conn;
        }).catch((error) => {
            cachedPromise = null;
            console.error(`MongoDB Connection Error: ${error.message}`);
            if (!process.env.VERCEL) {
                process.exit(1);
            }
            throw error;
        });
    }

    return cachedPromise;
};

module.exports = connectDB;

