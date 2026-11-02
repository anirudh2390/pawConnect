require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch {}
const mongoose = require('mongoose');

// Exact mapping of original uploaded files for each pet
const ORIGINAL_PET_IMAGES = {
    'sumo': ['/uploads/images-1789530804388-222803291.jpg'],
    'ginger': [
        '/uploads/images-1789531029111-417608765.jpg',
        '/uploads/images-1789531029112-200781510.jpg',
        '/uploads/images-1789531029112-899204343.jpg'
    ],
    'rex': [
        '/uploads/images-1790001464152-370322675.jpg',
        '/uploads/images-1790001464161-347515644.jpg'
    ],
    'spot': [
        '/uploads/images-1790141947293-47573587.jpg',
        '/uploads/images-1790141947295-590560495.jpg'
    ],
    'snow': [
        '/uploads/images-1790142040725-96275152.jpg',
        '/uploads/images-1790142040726-934562609.jpg'
    ],
    'vimal kumar': [
        '/uploads/images-1790142200383-399321028.jpg',
        '/uploads/images-1790142200384-669160620.jpg'
    ],
    'james': [
        '/uploads/images-1790142502198-237369411.jpg',
        '/uploads/images-1790142502198-335507841.jpg',
        '/uploads/images-1790142502198-733554938.jpg'
    ],
    'rocky': [
        '/uploads/images-1790142665944-306011990.jpg',
        '/uploads/images-1790142665944-668114825.jpg',
        '/uploads/images-1790142665945-53925146.jpg'
    ],
    'minnie': [
        '/uploads/images-1790142766773-720142975.jpg',
        '/uploads/images-1790142766773-805287657.jpg',
        '/uploads/images-1790142766774-769988144.jpg'
    ],
    'imbru': ['/uploads/images-1790146318567-749831543.jpg'],
    'pompom': ['/uploads/images-1790157868815-142481752.jpg']
};

async function restore() {
    try {
        console.log('Connecting to MongoDB...');
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`Connected to: ${conn.connection.name}`);
        const petsCol = conn.connection.db.collection('pets');
        const usersCol = conn.connection.db.collection('users');

        // Restore exact original images for each pet
        for (const [name, urls] of Object.entries(ORIGINAL_PET_IMAGES)) {
            const res = await petsCol.updateOne(
                { name: new RegExp(`^${name}$`, 'i') },
                { $set: { imageUrls: urls } }
            );
            console.log(`✅ Restored ${urls.length} exact uploaded photos for pet: ${name} (matched: ${res.matchedCount})`);
        }

        // Restore exact uploaded profile picture for Shashi
        const userRes = await usersCol.updateOne(
            { name: new RegExp('^shashi$', 'i') },
            { $set: { profilePicture: { url: '/uploads/profilePicture-1789533728669-232737860.webp', publicId: 'local_shashi' } } }
        );
        console.log(`✅ Restored original avatar for Shashi (matched: ${userRes.matchedCount})`);

        console.log('\n🎉 Finished restoring all exact original user images!');
        process.exit(0);
    } catch (err) {
        console.error('Error restoring original images:', err);
        process.exit(1);
    }
}

restore();
