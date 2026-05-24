const express = require('express');
const router = express.Router();
const { createShareLink, accessSharedFile, downloadSharedFile } = require('../controllers/shareController');
const protect = require('../middleware/authMiddleware');

router.post('/create/:fileId', protect, createShareLink);
router.post('/:token', accessSharedFile);
router.get('/download/:token', downloadSharedFile);

module.exports = router;
