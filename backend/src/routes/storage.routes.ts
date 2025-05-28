import { Router } from 'express';
import { storageController } from '../controllers/storage.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { rateLimit } from '../middleware/rate-limit.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Upload a file
router.post(
  '/upload',
  rateLimit.api,
  storageController.uploadFile('file', {
    allowedMimeTypes: [
      'image/*',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/json',
    ],
    maxSize: 50 * 1024 * 1024, // 50MB
  }),
  storageController.handleFileUpload
);

// Generate pre-signed URL for direct upload
router.post(
  '/presigned-url',
  rateLimit.api,
  validate('generatePresignedUrl'),
  storageController.generatePresignedUrl
);

// Download a file
router.get(
  '/download/:filePath(*)',
  rateLimit.api,
  storageController.downloadFile
);

// Delete a file
router.delete(
  '/:filePath(*)',
  rateLimit.api,
  storageController.deleteFile
);

// List files in a directory (admin only)
router.get(
  '/list',
  rateLimit.api,
  storageController.listFiles
);

// Clean up temporary files (admin only)
router.post(
  '/cleanup',
  rateLimit.api,
  storageController.cleanupTempFiles
);

// Direct file access (for public files)
router.get(
  '/public/:filePath(*)',
  rateLimit.api,
  (req, res, next) => {
    // This is a simplified version of downloadFile without authentication
    const { filePath } = req.params;
    const fullPath = path.join(process.cwd(), 'uploads', 'public', filePath);

    // Check if file exists
    fs.access(fullPath, fs.constants.F_OK, (err) => {
      if (err) {
        return res.status(404).json({ success: false, message: 'File not found' });
      }

      // Get file stats
      fs.stat(fullPath, (err, stats) => {
        if (err) {
          return next(new Error('Failed to get file stats'));
        }

        // Set headers
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Content-Type', mime.lookup(fullPath) || 'application/octet-stream');
        
        // For public files, use inline content disposition to display in browser
        const fileName = path.basename(fullPath);
        res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);

        // Stream the file
        const fileStream = fs.createReadStream(fullPath);
        fileStream.pipe(res);
      });
    });
  }
);

// Add missing imports
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';

export { router as storageRouter };
