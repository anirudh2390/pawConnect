require('dotenv').config();
const cloudinary = require('../src/config/cloudinary');

async function testConnection() {
    console.log('--- Testing Cloudinary Connection ---');
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
        console.log('⚠️  Cloudinary keys are NOT set in pawconnect-backend/.env:');
        console.log(`   - CLOUDINARY_CLOUD_NAME: ${cloudName || '(missing)'}`);
        console.log(`   - CLOUDINARY_API_KEY:    ${apiKey ? '***' : '(missing)'}`);
        console.log(`   - CLOUDINARY_API_SECRET: ${apiSecret ? '***' : '(missing)'}`);
        console.log('\n💡 The application will safely use local /uploads storage for pet and user images.');
        return;
    }

    try {
        console.log(`📡 Pinging Cloudinary account (${cloudName})…`);
        const res = await cloudinary.api.ping();
        console.log('✅ Cloudinary connected successfully! Status:', res.status);
    } catch (err) {
        console.error('❌ Cloudinary connection failed:');
        console.error(err.error?.message || err.message || err);
    }
}

testConnection();

