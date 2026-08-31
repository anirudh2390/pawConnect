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

        // Upload the file to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            folder,
            resource_type: 'auto',
        });

        // Remove the temp file from local disk asynchronously
        fs.unlink(localFilePath, (err) => {
            if (err) console.error(`Failed to delete local temp file: ${localFilePath}`, err);
        });

        return {
            url: response.secure_url,
            publicId: response.public_id,
        };
    } catch (error) {
        // Attempt local file cleanup in case of failure
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        console.error(`Cloudinary Upload Error: ${error.message}`);
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
