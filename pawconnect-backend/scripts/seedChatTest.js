/**
 * seedChatTest.js
 * Creates: 1 Approved pet (Bob's), 1 adoption request (Alice→Bob), status Received
 * Run: node scripts/seedChatTest.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Pet = require('../src/models/Pet');
const Adoption = require('../src/models/Adoption');
const ChatRoom = require('../src/models/ChatRoom');

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pawconnect');
    console.log('DB connected');

    // Look up Alice and Bob by email
    const User = require('../src/models/User');
    const alice = await User.findOne({ email: 'alice@pawtest.com' });
    const bob = await User.findOne({ email: 'bob@pawtest.com' });

    if (!alice || !bob) {
        console.error('Alice or Bob not found in DB. Register them first.');
        process.exit(1);
    }

    console.log(`Alice: ${alice._id} | Bob: ${bob._id}`);

    // Remove any old test data for clean slate
    await Pet.deleteMany({ listerId: bob._id });
    await Adoption.deleteMany({ $or: [{ adopterId: alice._id }, { adopterId: bob._id }] });
    await ChatRoom.deleteMany({
        participantIds: { $all: [alice._id, bob._id], $size: 2 }
    });
    console.log('Old test data cleaned');

    // Create Bob's pet (Approved — ready for adoption)
    const pet = await Pet.create({
        listerId: bob._id,
        name: 'Buddy',
        type: 'Dog',
        breed: 'Labrador',
        age: { number: 2, unit: 'Years' },
        gender: 'Male',
        size: 'Large',
        vaccinationStatus: 'Fully',
        description: 'Friendly Labrador looking for a loving home.',
        location: { city: 'Mumbai', state: 'Maharashtra' },
        status: 'Approved',
    });
    console.log(`Created pet: ${pet.name} (${pet._id})`);

    // Create Alice's adoption request for Bob's pet
    const adoption = await Adoption.create({
        petId: pet._id,
        adopterId: alice._id,
        listerId: bob._id,
        questionnaire: {
            experienceLevel: 'Intermediate',
            homeEnvironment: 'House with yard',
            hoursLeftAlone: 4,
            hasOtherPets: false,
        },
        status: 'Received',
    });
    console.log(`Created adoption request: ${adoption._id} (Status: ${adoption.status})`);
    console.log(`\n✅ Test data ready:`);
    console.log(`   Alice (adopter): ${alice.email}`);
    console.log(`   Bob (lister/owner): ${bob.email}`);
    console.log(`   Pet: ${pet.name} (ID: ${pet._id})`);
    console.log(`   Adoption: ${adoption._id}`);
    console.log(`\n   Now Alice can chat with Bob via the /api/chats/rooms endpoint.`);

    await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
