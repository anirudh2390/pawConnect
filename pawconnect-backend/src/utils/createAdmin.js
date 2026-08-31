require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

const createAdmin = async () => {
    const adminEmail = 'admin@pawconnect.org';
    const adminPass = 'admin12345';

    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pawconnect';
        console.log(`Connecting to database: ${mongoUri}`);
        await mongoose.connect(mongoUri);

        const existingAdmin = await User.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log(`Admin user with email ${adminEmail} already exists.`);
            process.exit(0);
        }

        const newAdmin = new User({
            name: 'PawConnect Admin',
            email: adminEmail,
            passwordHash: adminPass, // Pre-save hook will hash this using bcrypt
            role: 'ADMIN',
            location: { city: 'NYC', state: 'NY' },
            phoneNumber: '+15550100',
            bio: 'Platform administration account.',
        });

        await newAdmin.save();
        console.log('-------------------------------');
        console.log('ADMIN USER CREATED SUCCESSFULLY');
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPass}`);
        console.log('-------------------------------');
        process.exit(0);
    } catch (error) {
        console.error(`Error creating admin: ${error.message}`);
        process.exit(1);
    }
};

createAdmin();
