const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadFile, getFiles, deleteFile, downloadFile } = require('../controllers/fileController');
const protect = require('../middleware/authMiddleware');

// Setup multer storage
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

router.route('/')
    .get(protect, getFiles)
    .post(protect, upload.single('file'), uploadFile);

router.route('/:id')
    .delete(protect, deleteFile);

router.get('/download/:id', protect, downloadFile);

module.exports = router;
