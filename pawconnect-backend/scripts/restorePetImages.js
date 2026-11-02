require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch {}
const mongoose = require('mongoose');

const PET_BREED_IMAGES = {
    'sumo': ['https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80'],
    'ginger': [
        'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=800&q=80'
    ],
    'rex': ['https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=800&q=80'],
    'spot': ['https://images.unsplash.com/photo-1513360309081-38f076278f1e?auto=format&fit=crop&w=800&q=80'],
    'snow': ['https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=800&q=80'],
    'vimal kumar': ['https://images.unsplash.com/photo-1568572933382-74d440642117?auto=format&fit=crop&w=800&q=80'],
    'james': ['https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=800&q=80'],
    'rocky': ['https://images.unsplash.com/photo-1567752881298-894bb81f9379?auto=format&fit=crop&w=800&q=80'],
    'minnie': ['https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?auto=format&fit=crop&w=800&q=80'],
    'imbru': ['https://images.unsplash.com/photo-1612195583950-b8fd34c87093?auto=format&fit=crop&w=800&q=80'],
    'pompom': ['https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80']
};

async function restore() {
    try {
        console.log('Connecting to MongoDB...');
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`Connected to: ${conn.connection.name}`);
        const petsCol = conn.connection.db.collection('pets');
        const pets = await petsCol.find({}).toArray();

        for (const pet of pets) {
            const petName = pet.name.toLowerCase().trim();
            const images = PET_BREED_IMAGES[petName];
            if (images) {
                await petsCol.updateOne({ _id: pet._id }, { $set: { imageUrls: images } });
                console.log(`✅ Restored images for: ${pet.name} (${pet.breed})`);
            } else if (pet.imageUrls && pet.imageUrls.some(u => typeof u === 'string' && u.includes('localhost:5000'))) {
                // If pet is not in explicit dictionary but has localhost URL, assign breed/type fallback
                const isCat = (pet.type || '').toLowerCase() === 'cat';
                const fallbackUrl = isCat
                    ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80'
                    : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80';
                await petsCol.updateOne({ _id: pet._id }, { $set: { imageUrls: [fallbackUrl] } });
                console.log(`✅ Updated localhost URL with type-safe image for: ${pet.name}`);
            }
        }

        // Also fix any user profile pictures referencing localhost:5000
        const usersCol = conn.connection.db.collection('users');
        const userResult = await usersCol.updateMany(
            { 'profilePicture.url': { $regex: 'localhost:5000' } },
            { $set: { 'profilePicture.url': 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80' } }
        );
        if (userResult.modifiedCount > 0) {
            console.log(`✅ Updated ${userResult.modifiedCount} user avatar(s) with cloud CDN image.`);
        }

        console.log('\n🎉 Finished restoring high quality pet photos and avatars!');
        process.exit(0);
    } catch (err) {
        console.error('Error restoring images:', err);
        process.exit(1);
    }
}

restore();

