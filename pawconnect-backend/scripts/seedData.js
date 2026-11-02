/**
 * PawConnect — Sample Database Seed Script
 * =========================================
 * Creates sample users and pet listings for development/testing.
 *
 * ⚠️  SAFETY:
 *   - Does NOT drop existing collections.
 *   - Skips seeding if data already exists.
 *   - Does NOT include real credentials.
 *   - Safe to run multiple times.
 *
 * Usage:
 *   node scripts/seedData.js
 *
 * Prerequisites:
 *   - MongoDB must be running.
 *   - .env must be configured with MONGO_URI.
 */

require('dotenv').config();
const dns = require('dns');
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
    // Keep system defaults if custom servers fail to set
}
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ── Models ─────────────────────────────────────────────────────────────────
const User = require('../src/models/User');
const Pet = require('../src/models/Pet');

// ── Sample data ────────────────────────────────────────────────────────────
const SAMPLE_USERS = [
    {
        name: 'Demo Admin',
        email: 'admin@pawconnect.demo',
        passwordHash: 'DemoAdmin@123',  // will be hashed by User pre-save hook
        role: 'ADMIN',
        bio: 'Platform administrator',
        location: { city: 'Mumbai', state: 'Maharashtra' },
    },
    {
        name: 'Priya Sharma',
        email: 'priya@pawconnect.demo',
        passwordHash: 'DemoUser@123',
        role: 'USER',
        bio: 'Dog lover from Delhi',
        location: { city: 'Delhi', state: 'Delhi' },
    },
    {
        name: 'Arjun Mehta',
        email: 'arjun@pawconnect.demo',
        passwordHash: 'DemoUser@123',
        role: 'USER',
        bio: 'Lifelong cat person from Bangalore',
        location: { city: 'Bangalore', state: 'Karnataka' },
    },
];

const buildSamplePets = (ownerId) => [
    {
        listerId: ownerId,
        name: 'Max',
        type: 'Dog',
        breed: 'Labrador Retriever',
        age: { number: 2, unit: 'Years' },
        gender: 'Male',
        size: 'Large',
        vaccinationStatus: 'Fully',
        medicalHistory: 'None',
        description: 'Max is an energetic and friendly Labrador who loves to play fetch. He is great with kids and very well trained. Looking for an active family that can give him plenty of outdoor exercise.',
        location: { city: 'Delhi', state: 'Delhi' },
        imageUrls: ['https://images.dog.ceo/breeds/labrador/n02099712_1448.jpg'],
        status: 'Approved',
    },
    {
        listerId: ownerId,
        name: 'Luna',
        type: 'Cat',
        breed: 'Persian',
        age: { number: 3, unit: 'Years' },
        gender: 'Female',
        size: 'Medium',
        vaccinationStatus: 'Fully',
        medicalHistory: 'None',
        description: 'Luna is a beautiful, calm Persian cat who loves cuddles and nap time. She is litter trained and does well in apartments. Ideal for a quiet household.',
        location: { city: 'Bangalore', state: 'Karnataka' },
        imageUrls: ['https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Cat_November_2010-1a.jpg/320px-Cat_November_2010-1a.jpg'],
        status: 'Approved',
    },
    {
        listerId: ownerId,
        name: 'Bruno',
        type: 'Dog',
        breed: 'Beagle',
        age: { number: 8, unit: 'Months' },
        gender: 'Male',
        size: 'Small',
        vaccinationStatus: 'Partially',
        medicalHistory: 'None',
        description: 'Bruno is a playful puppy who is still being trained. He is curious, friendly, and looking for a patient family who can continue his training journey.',
        location: { city: 'Hyderabad', state: 'Telangana' },
        imageUrls: [],
        status: 'Pending',
    },
    {
        listerId: ownerId,
        name: 'Mia',
        type: 'Cat',
        breed: 'Siamese Mix',
        age: { number: 5, unit: 'Years' },
        gender: 'Female',
        size: 'Small',
        vaccinationStatus: 'Fully',
        medicalHistory: 'None',
        description: 'Mia is an independent and elegant cat who prefers a calm environment. She is very healthy and up-to-date on all vaccinations. Perfect for working professionals.',
        location: { city: 'Chennai', state: 'Tamil Nadu' },
        imageUrls: [],
        status: 'Approved',
    },
];

// ── Main seed function ─────────────────────────────────────────────────────
async function seed() {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/pawconnect';
        console.log('🔌 Connecting to MongoDB…');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // ── Check if data already exists ─────────────────────────────────────
        const existingUsers = await User.countDocuments({ email: { $in: SAMPLE_USERS.map(u => u.email) } });
        if (existingUsers > 0) {
            console.log('ℹ️  Sample users already exist. Skipping user seed to avoid duplicates.');
        } else {
            console.log('🌱 Seeding sample users…');
            const createdUsers = await User.insertMany(SAMPLE_USERS);
            console.log(`✅ Created ${createdUsers.length} sample users`);
            console.log('   Credentials:');
            SAMPLE_USERS.forEach(u => console.log(`   - ${u.email} / ${u.passwordHash} (${u.role})`));
        }

        // ── Seed pets ─────────────────────────────────────────────────────────
        const ownerUser = await User.findOne({ email: 'priya@pawconnect.demo' });
        if (!ownerUser) {
            console.log('⚠️  Could not find seed owner user — skipping pet seed.');
        } else {
            const existingPets = await Pet.countDocuments({ listerId: ownerUser._id });
            if (existingPets > 0) {
                console.log('ℹ️  Sample pets already exist. Skipping pet seed.');
            } else {
                const samplePets = buildSamplePets(ownerUser._id);
                console.log('🌱 Seeding sample pet listings…');
                const createdPets = await Pet.insertMany(samplePets);
                console.log(`✅ Created ${createdPets.length} sample pets`);
            }
        }

        console.log('\n🎉 Seed complete!');
        console.log('   Admin login: admin@pawconnect.demo / DemoAdmin@123');
        console.log('   User login:  priya@pawconnect.demo / DemoUser@123');

    } catch (err) {
        console.error('❌ Seed failed:', err.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 MongoDB connection closed.');
    }
}

seed();
