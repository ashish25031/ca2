const { getPool, sql } = require('../config/db');
const path = require('path');
const fs = require('fs');

// @desc    Upload a file
// @route   POST /api/files/upload
// @access  Private
const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const pool = await getPool();
        const { originalname, path: filepath, size } = req.file;

        // Save to DB
        const result = await pool.request()
            .input('filename', sql.NVarChar, originalname)
            .input('filepath', sql.NVarChar, filepath)
            .input('filesize', sql.BigInt, size)
            .input('uploaded_by', sql.Int, req.user.id)
            .query('INSERT INTO Files (filename, filepath, filesize, uploaded_by) OUTPUT INSERTED.* VALUES (@filename, @filepath, @filesize, @uploaded_by)');

        res.status(201).json(result.recordset[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during file upload' });
    }
};

// @desc    Get all files for user
// @route   GET /api/files
// @access  Private
const getFiles = async (req, res) => {
    try {
        const pool = await getPool();
        
        const result = await pool.request()
            .input('uploaded_by', sql.Int, req.user.id)
            .query('SELECT * FROM Files WHERE uploaded_by = @uploaded_by ORDER BY upload_date DESC');

        res.json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching files' });
    }
};

// @desc    Delete file
// @route   DELETE /api/files/:id
// @access  Private
const deleteFile = async (req, res) => {
    try {
        const pool = await getPool();
        
        // Find file
        const fileResult = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM Files WHERE id = @id');

        const file = fileResult.recordset[0];

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Check user owns file
        if (file.uploaded_by !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        // Delete from DB
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Files WHERE id = @id');

        // Delete from local storage
        if (fs.existsSync(file.filepath)) {
            fs.unlinkSync(file.filepath);
        }

        res.json({ id: req.params.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error deleting file' });
    }
};

// @desc    Download file
// @route   GET /api/files/download/:id
// @access  Private
const downloadFile = async (req, res) => {
    try {
        const pool = await getPool();
        
        const fileResult = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM Files WHERE id = @id');

        const file = fileResult.recordset[0];

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Check authorization
        if (file.uploaded_by !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        const absolutePath = path.resolve(file.filepath);
        res.download(absolutePath, file.filename);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error downloading file' });
    }
};

module.exports = {
    uploadFile,
    getFiles,
    deleteFile,
    downloadFile
};
