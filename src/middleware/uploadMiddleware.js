
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary'); 
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'job-freelance', // Nama folder di Cloudinary
        format: async (req, file) => {
            const ext = file.originalname.split('.').pop();
            // Hanya izinkan format gambar umum
            if (['jpeg', 'jpg', 'png', 'gif', 'webp'].includes(ext.toLowerCase())) {
                return ext;
            }
            return 'png'; // Default jika tidak dikenal
        },
        public_id: (req, file) => `jf-${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9]/g, '-')}`, // Nama unik
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Hanya file gambar (JPEG, PNG, GIF, WEBP) yang diizinkan!'), false);
        }
    }
});

module.exports = upload;