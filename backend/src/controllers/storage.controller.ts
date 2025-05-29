import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { storageService } from '../services/storage.service';
import { logger } from '../utils/logger';
import { 
  BadRequestError, 
  NotFoundError, 
  InternalServerError 
} from '../middleware/error.middleware';

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, 'uploads/temp/');
    },
    filename: (_req, _file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${uniqueSuffix}-${_file.originalname}`);
    },
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (_req, _file, cb) => {
    // Accept all files for now, but you can add validation here
    cb(null, true);
  },
});

// Storage Controller
// Handles file upload, download, deletion, listing, and temp file cleanup
// All endpoints must use correct service and file system access
// All endpoints should be protected with JWT middleware if files are user-specific
// TODO: Add input validation middleware (zod) for query/params
// TODO: Add more granular error handling and logging for production
// TODO: Add virus/malware scanning for uploaded files if required

export const storageController = {
  // Middleware for handling file uploads
  uploadFile: (fieldName: string, options?: any) => {
    return (req: Request, res: Response, next: NextFunction) => {
      const uploadSingle = upload.single(fieldName);
      
      uploadSingle(req as any, res as any, async (err: any) => {
        if (err) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new BadRequestError('File size exceeds the limit'));
          }
          logger.error('File upload error:', err);
          return next(new InternalServerError('Failed to upload file'));
        }

        // If no file was uploaded, continue to the next middleware
        if (!req.file) {
          return next();
        }

        try {
          // Process the uploaded file
          const fileData = await storageService.uploadFile(req.file, {
            ...options,
            keepOriginalName: true,
          });

          // Attach file data to the request object
          req.fileData = fileData;
          next();
        } catch (error) {
          next(error);
        }
      });
    };
  },

  // Handle file upload
  async handleFileUpload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.fileData) {
        throw new BadRequestError('No file uploaded');
      }

      res.json({
        success: true,
        data: req.fileData,
      });
    } catch (error) {
      next(error);
    }
  },

  // Generate pre-signed URL for direct upload
  async generatePresignedUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const { fileName, mimeType } = req.body;
      const { bucket, expiresIn, metadata } = req.query;

      if (!fileName || !mimeType) {
        throw new BadRequestError('fileName and mimeType are required');
      }

      const presignedUrl = await storageService.generatePresignedUrl(
        fileName,
        mimeType,
        {
          bucket: bucket as string,
          expiresIn: expiresIn ? parseInt(expiresIn as string, 10) : undefined,
          metadata: metadata ? JSON.parse(metadata as string) : undefined,
        }
      );

      res.json({
        success: true,
        data: presignedUrl,
      });
    } catch (error) {
      next(error);
    }
  },

  // Download a file
  async downloadFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { filePath } = req.params;
      const fullPath = path.join(process.cwd(), 'uploads', filePath);

      // Check if file exists
      const fileExists = await storageService.fileExists(fullPath);
      if (!fileExists) {
        throw new NotFoundError('File not found');
      }

      // Get file stats
      const stats = await storageService.getFileStats(fullPath);
      
      // Set headers
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Content-Type', mime.lookup(fullPath) || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename=${path.basename(fullPath)}`);

      // Stream the file
      const fileStream = storageService.getFileStream(fullPath);
      fileStream.pipe(res);
    } catch (error) {
      next(error);
    }
  },

  // Delete a file
  async deleteFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { filePath } = req.params;
      const fullPath = path.join(process.cwd(), 'uploads', filePath);

      // Check if file exists
      const fileExists = await storageService.fileExists(fullPath);
      if (!fileExists) {
        throw new NotFoundError('File not found');
      }

      // Delete the file
      await storageService.deleteFile(fullPath);

      res.json({
        success: true,
        message: 'File deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // List files in a directory
  async listFiles(req: Request, res: Response, next: NextFunction) {
    try {
      const { directory = '' } = req.query;
      const dirPath = path.join(process.cwd(), 'uploads', directory as string);

      // Check if directory exists
      try {
        await fs.promises.access(dirPath);
      } catch (error) {
        throw new NotFoundError('Directory not found');
      }

      // Read directory contents
      const files = await fs.promises.readdir(dirPath, { withFileTypes: true });

      // Get file stats
      const fileList = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(dirPath, file.name);
          const stats = await fs.promises.stat(filePath);
          
          return {
            name: file.name,
            path: path.relative(path.join(process.cwd(), 'uploads'), filePath),
            isDirectory: file.isDirectory(),
            size: stats.size,
            mtime: stats.mtime,
            mime: file.isFile() ? mime.lookup(filePath) || 'application/octet-stream' : null,
          };
        })
      );

      res.json({
        success: true,
        data: fileList,
      });
    } catch (error) {
      next(error);
    }
  },

  // Clean up temporary files
  async cleanupTempFiles(req: Request, res: Response, next: NextFunction) {
    try {
      const { olderThanHours = '24' } = req.query;
      
      await storageService.cleanupTempFiles(parseInt(olderThanHours as string, 10));
      
      res.json({
        success: true,
        message: 'Temporary files cleaned up successfully',
      });
    } catch (error) {
      next(error);
    }
  },
};

// Add missing imports
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
