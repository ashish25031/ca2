const { getPool, sql } = require('../config/db');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const path = require('path');

// @desc    Create shared link
// @route   POST /api/share/create/:fileId
// @access  Private
const createShareLink = async (req, res) => {
    try {
        const { password, expiryHours } = req.body;
        const fileId = req.params.fileId;
        const pool = await getPool();

        // Check if file exists and belongs to user
        const fileResult = await pool.request()
            .input('id', sql.Int, fileId)
            .query('SELECT * FROM Files WHERE id = @id');

        const file = fileResult.recordset[0];
        if (!file || file.uploaded_by !== req.user.id) {
            return res.status(404).json({ message: 'File not found or unauthorized' });
        }

        // Generate token
        const token = crypto.randomBytes(32).toString('hex');
        
        // Hash password if provided
        let hashedPassword = null;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            hashedPassword = await bcrypt.hash(password, salt);
        }

        // Calculate expiry
        let expiryTime = null;
        if (expiryHours) {
            const date = new Date();
            date.setHours(date.getHours() + parseInt(expiryHours));
            expiryTime = date;
        }

        // Save to DB
        const result = await pool.request()
            .input('file_id', sql.Int, fileId)
            .input('share_token', sql.NVarChar, token)
            .input('access_password', sql.NVarChar, hashedPassword)
            .input('expiry_time', sql.DateTime2, expiryTime)
            .query(`
                INSERT INTO SharedLinks (file_id, share_token, access_password, expiry_time) 
                OUTPUT INSERTED.* 
                VALUES (@file_id, @share_token, @access_password, @expiry_time)
            `);

        res.status(201).json({
            linkId: result.recordset[0].id,
            token,
            shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/shared/${token}`
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error creating share link' });
    }
};

// @desc    Access shared file
// @route   POST /api/share/:token
// @access  Public
const accessSharedFile = async (req, res) => {
    try {
        const token = req.params.token;
        const { password } = req.body; // Client might send password here to unlock
        const pool = await getPool();

        const linkResult = await pool.request()
            .input('token', sql.NVarChar, token)
            .query('SELECT s.*, f.filename, f.filepath, f.filesize FROM SharedLinks s JOIN Files f ON s.file_id = f.id WHERE s.share_token = @token');

        const link = linkResult.recordset[0];

        if (!link) {
            return res.status(404).json({ message: 'Invalid or expired link' });
        }

        // Check expiry
        if (link.expiry_time && new Date(link.expiry_time) < new Date()) {
            return res.status(400).json({ message: 'Link has expired' });
        }

        // Check password
        if (link.access_password) {
            if (!password) {
                return res.status(401).json({ message: 'Password required', requirePassword: true });
            }
            const isMatch = await bcrypt.compare(password, link.access_password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid password' });
            }
        }

        // Return file info or trigger download directly
        // Usually, an API returns file info and a temporary download token, or we can just send the file
        res.json({
            filename: link.filename,
            filesize: link.filesize,
            downloadUrl: `/api/share/download/${token}?pwd=${encodeURIComponent(password || '')}`
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error accessing shared file' });
    }
};

// @desc    Download shared file
// @route   GET /api/share/download/:token
// @access  Public
const downloadSharedFile = async (req, res) => {
    try {
        const token = req.params.token;
        const password = req.query.pwd;
        const pool = await getPool();

        const linkResult = await pool.request()
            .input('token', sql.NVarChar, token)
            .query('SELECT s.*, f.filename, f.filepath FROM SharedLinks s JOIN Files f ON s.file_id = f.id WHERE s.share_token = @token');

        const link = linkResult.recordset[0];

        if (!link) return res.status(404).send('Invalid link');
        if (link.expiry_time && new Date(link.expiry_time) < new Date()) return res.status(400).send('Link expired');
        
        if (link.access_password) {
            const isMatch = await bcrypt.compare(password || '', link.access_password);
            if (!isMatch) return res.status(401).send('Unauthorized');
        }

        const absolutePath = path.resolve(link.filepath);
        res.download(absolutePath, link.filename);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error downloading shared file');
    }
};

module.exports = {
    createShareLink,
    accessSharedFile,
    downloadSharedFile
};
