const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.CLOUD_API_KEY,
    api_secret:process.env.CLOUD_API_SECREAT

})

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'Openarms',
        allowedFormats: ['jpeg', 'png', 'jpg'],
        public_id: (req, file) => file.originalname.split('.')[0]
    }
});

module.exports = { cloudinary, storage };