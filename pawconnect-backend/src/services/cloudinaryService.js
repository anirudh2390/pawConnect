const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinary');

/**
 * Upload a local file path to Cloudinary (with automatic fallback to local /uploads storage)
 * @param {string} localFilePath - Temp file path from multer disk storage
 * @param {string} folder - Cloudinary folder to upload into
 * @returns {Promise<{url: string, publicId: string}|null>}
 */
const uploadToCloudinary = async (localFilePath, folder = 'pawconnect') => {
    try {
        if (!localFilePath) return null;

        const filename = path.basename(localFilePath);

        const isCloudinaryConfigured =
            process.env.CLOUDINARY_CLOUD_NAME &&
            process.env.CLOUDINARY_CLOUD_NAME !== 'placeholder_cloud_name' &&
            process.env.CLOUDINARY_API_KEY &&
            process.env.CLOUDINARY_API_KEY !== 'placeholder_api_key' &&
            process.env.CLOUDINARY_API_SECRET &&
            process.env.CLOUDINARY_API_SECRET !== 'placeholder_api_secret';

        if (isCloudinaryConfigured) {
            try {
                const result = await cloudinary.uploader.upload(localFilePath, { folder });
                // Clean up local temp file after successful cloud upload
                if (fs.existsSync(localFilePath)) {
                    fs.unlinkSync(localFilePath);
                }
                return {
                    url: result.secure_url,
                    publicId: result.public_id,
                };
            } catch (cloudErr) {
                console.warn(`[Cloudinary Warning] Upload failed: ${cloudErr.message}. Falling back to local storage.`);
            }
        }

        // Local storage fallback: served via Express static at /uploads/:filename
        return {
            url: `http://localhost:5000/uploads/${filename}`,
            publicId: `local_${filename}`,
        };
    } catch (error) {
        console.error(`Upload Error: ${error.message}`);
        throw error;
    }
};

/**
 * Delete an asset from Cloudinary by public_id or local uploads
 * @param {string} publicId - Cloudinary public ID to delete
 * @returns {Promise<Object>}
 */
const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) return null;

        if (publicId.startsWith('local_')) {
            const filename = publicId.replace('local_', '');
            const filePath = path.join(__dirname, '../../uploads', filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            return { result: 'ok' };
        }

        return await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error(`Cloudinary Delete Error: ${error.message}`);
        return null;
    }
};

module.exports = {
    uploadToCloudinary,
    deleteFromCloudinary,
};

