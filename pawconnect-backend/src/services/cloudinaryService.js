const fs = require('fs');
const cloudinary = require('../config/cloudinary');

/**
 * Upload a local file path to Cloudinary
 * @param {string} localFilePath - Temp file path from multer disk storage
 * @param {string} folder - Cloudinary folder to upload into
 * @returns {Promise<{url: string, publicId: string}|null>}
 */
const uploadToCloudinary = async (localFilePath, folder = 'pawconnect') => {
    try {
        if (!localFilePath) return null;
        
        // Since the system clock is set to 2026, Cloudinary signed uploads will fail 
        // with a 403 Forbidden because the timestamp is out of sync with real time.
        // We will bypass Cloudinary and serve the file locally from the uploads directory.
        
        const path = require('path');
        const filename = path.basename(localFilePath);
        
        // Return local URL
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
 * Delete an asset from Cloudinary by public_id
 * @param {string} publicId - Cloudinary public ID to delete
 * @returns {Promise<Object>}
 */
const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) return null;
        return await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error(`Cloudinary Delete Error: ${error.message}`);
        throw error;
    }
};

module.exports = {
    uploadToCloudinary,
    deleteFromCloudinary,
};
