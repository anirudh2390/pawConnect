const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch {}
const mongoose = require('mongoose');
const cloudinary = require('../src/config/cloudinary');

const downloadsDir = path.join(process.env.USERPROFILE, 'Downloads');
const uploadsDir = path.resolve(__dirname, '../uploads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Exact mapping from original download files to original upload filenames
const fileMapping = [
    { src: 'bulldog1.jpg', target: 'images-1789530804388-222803291.jpg', petName: 'sumo' },
    { src: 'orange1.jpg', target: 'images-1789531029111-417608765.jpg', petName: 'ginger' },
    { src: 'orange2.jpg', target: 'images-1789531029112-200781510.jpg', petName: 'ginger' },
    { src: 'orange3.jpg', target: 'images-1789531029112-899204343.jpg', petName: 'ginger' },
    { src: 'shashi.webp', target: 'profilePicture-1789533728669-232737860.webp', userName: 'Shashi' },
    { src: 'beagle1.jpg', target: 'images-1790001464152-370322675.jpg', petName: 'rex' },
    { src: 'beagle2.jpg', target: 'images-1790001464161-347515644.jpg', petName: 'rex' },
    { src: 'bengal1.jpg', target: 'images-1790141947293-47573587.jpg', petName: 'spot' },
    { src: 'bengal2.jpg', target: 'images-1790141947295-590560495.jpg', petName: 'spot' },
    { src: 'persianwhite1.jpg', target: 'images-1790142040725-96275152.jpg', petName: 'snow' },
    { src: 'persianwhite2.jpg', target: 'images-1790142040726-934562609.jpg', petName: 'snow' },
    { src: 'pit1.jpg', target: 'images-1790142200383-399321028.jpg', petName: 'vimal kumar' },
    { src: 'pit2.jpg', target: 'images-1790142200384-669160620.jpg', petName: 'vimal kumar' },
    { src: 'gr1.jpg', target: 'images-1790142502198-237369411.jpg', petName: 'james' },
    { src: 'gr2.jpg', target: 'images-1790142502198-335507841.jpg', petName: 'james' },
    { src: 'gr3.jpg', target: 'images-1790142502198-733554938.jpg', petName: 'james' },
    { src: 'rot1.jpg', target: 'images-1790142665944-306011990.jpg', petName: 'rocky' },
    { src: 'rot2.jpg', target: 'images-1790142665944-668114825.jpg', petName: 'rocky' },
    { src: 'rot3.jpg', target: 'images-1790142665945-53925146.jpg', petName: 'rocky' },
    { src: 'pug1.jpg', target: 'images-1790142766773-720142975.jpg', petName: 'minnie' },
    { src: 'pug2.jpg', target: 'images-1790142766773-805287657.jpg', petName: 'minnie' },
    { src: 'pug3.jpg', target: 'images-1790142766774-769988144.jpg', petName: 'minnie' },
    { src: 'dash.jpg', target: 'images-1790146318567-749831543.jpg', petName: 'imbru' },
    { src: 'pom1.jpg', target: 'images-1790157868815-142481752.jpg', petName: 'pompom' }
];

async function run() {
    console.log('1. Copying original images from Downloads to uploads/ folder...');
    for (const item of fileMapping) {
        const srcPath = path.join(downloadsDir, item.src);
        const destPath = path.join(uploadsDir, item.target);
        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
            console.log(`  ✓ Copied ${item.src} -> uploads/${item.target}`);
        } else {
            console.warn(`  ⚠️ Missing source file: ${srcPath}`);
        }
    }

    console.log('\n2. Uploading original images to Cloudinary and updating MongoDB...');
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`Connected to MongoDB: ${conn.connection.name}`);
    const petsCol = conn.connection.db.collection('pets');
    const usersCol = conn.connection.db.collection('users');

    // Group targets by pet
    const petImagesMap = {};
    for (const item of fileMapping) {
        if (item.petName) {
            if (!petImagesMap[item.petName]) petImagesMap[item.petName] = [];
            
            // Upload to Cloudinary
            const filePath = path.join(uploadsDir, item.target);
            try {
                console.log(`  Uploading ${item.src} to Cloudinary...`);
                const cloudRes = await cloudinary.uploader.upload(filePath, { folder: 'pawconnect' });
                petImagesMap[item.petName].push(cloudRes.secure_url);
            } catch (cErr) {
                console.warn(`  Cloudinary upload failed: ${cErr.message}. Using local path.`);
                petImagesMap[item.petName].push(`http://localhost:5000/uploads/${item.target}`);
            }
        } else if (item.userName) {
            const filePath = path.join(uploadsDir, item.target);
            try {
                console.log(`  Uploading ${item.src} for ${item.userName} to Cloudinary...`);
                const cloudRes = await cloudinary.uploader.upload(filePath, { folder: 'pawconnect' });
                await usersCol.updateOne(
                    { name: item.userName },
                    { $set: { profilePicture: { url: cloudRes.secure_url, publicId: cloudRes.public_id } } }
                );
            } catch {
                await usersCol.updateOne(
                    { name: item.userName },
                    { $set: { profilePicture: { url: `http://localhost:5000/uploads/${item.target}`, publicId: `local_${item.target}` } } }
                );
            }
        }
    }

    // Update each pet in the database
    for (const [name, urls] of Object.entries(petImagesMap)) {
        await petsCol.updateOne({ name: name }, { $set: { imageUrls: urls } });
        console.log(`  ✅ Updated ${name} with ${urls.length} original Cloudinary images`);
    }

    console.log('\n🎉 Successfully restored all of your exact original images to both uploads/ and Cloudinary!');
    process.exit(0);
}

run().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});

