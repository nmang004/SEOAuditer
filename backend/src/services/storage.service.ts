import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { promisify } from 'util';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { BadRequestError, InternalServerError } from '../middleware/error.middleware';

const fsUnlink = promisify(fs.unlink);
const fsMkdir = promisify(fs.mkdir);
const fsAccess = promisify(fs.access);

// Ensure upload directory exists
const ensureUploadsDir = async () => {
  const uploadDir = path.join(process.cwd(), 'uploads');
  try {
    await fsAccess(uploadDir);
  } catch (error) {
    await fsMkdir(uploadDir, { recursive: true });
  }
  return uploadDir;
};

export class StorageService {
  private static instance: StorageService;
  private uploadDir: string;

  private constructor() {
    this.uploadDir = '';
    this.initialize();
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  private async initialize() {
    this.uploadDir = await ensureUploadsDir();
    logger.info(`Storage service initialized. Upload directory: ${this.uploadDir}`);
  }

  /**
   * Upload a file to the server
   * @param file The file to upload (from multer)
   * @param options Upload options
   * @returns The file path and metadata
   */
  public async uploadFile(file: Express.Multer.File, options: {
    allowedMimeTypes?: string[];
    maxSize?: number;
    subfolder?: string;
    keepOriginalName?: boolean;
  } = {}) {
    const {
      allowedMimeTypes = ['*/*'],
      maxSize = 10 * 1024 * 1024, // 10MB default
      subfolder = '',
      keepOriginalName = false,
    } = options;

    // Check file size
    if (file.size > maxSize) {
      throw new BadRequestError(`File size exceeds the limit of ${maxSize / (1024 * 1024)}MB`);
    }

    // Check MIME type
    if (!allowedMimeTypes.includes('*/*') && !allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestError(`File type ${file.mimetype} is not allowed`);
    }

    try {
      // Create subfolder if it doesn't exist
      let uploadPath = this.uploadDir;
      if (subfolder) {
        uploadPath = path.join(uploadPath, subfolder);
        await fsMkdir(uploadPath, { recursive: true });
      }

      // Generate unique filename
      const fileExt = path.extname(file.originalname);
      const fileName = keepOriginalName 
        ? file.originalname.replace(/[^\w\d.-]/g, '_')
        : `${uuidv4()}${fileExt}`;
      
      const filePath = path.join(uploadPath, fileName);

      // Move file to uploads directory
      await promisify(fs.rename)(file.path, filePath);

      // Return file metadata
      return {
        originalName: file.originalname,
        fileName,
        filePath,
        mimeType: file.mimetype,
        size: file.size,
        url: `${config.apiUrl}/uploads/${subfolder ? `${subfolder}/` : ''}${fileName}`,
      };
    } catch (error) {
      logger.error('Error uploading file:', error);
      // Clean up the temp file if it exists
      try {
        await fsUnlink(file.path);
      } catch (cleanupError) {
        logger.error('Error cleaning up temp file:', cleanupError);
      }
      throw new InternalServerError('Failed to upload file');
    }
  }

  /**
   * Delete a file from the server
   * @param filePath The path to the file to delete
   */
  public async deleteFile(filePath: string): Promise<void> {
    try {
      await fsUnlink(filePath);
    } catch (error) {
      const e = error as any;
      if (e.code !== 'ENOENT') { // Ignore "file not found" errors
        logger.error('Error deleting file:', error);
        throw new InternalServerError('Failed to delete file');
      }
    }
  }

  /**
   * Delete multiple files
   * @param filePaths Array of file paths to delete
   */
  public async deleteFiles(filePaths: string[]): Promise<void> {
    await Promise.all(filePaths.map(path => this.deleteFile(path)));
  }

  /**
   * Get file stream for downloading
   * @param filePath Path to the file
   * @returns File stream
   */
  public getFileStream(filePath: string): fs.ReadStream {
    try {
      return fs.createReadStream(filePath);
    } catch (error) {
      logger.error('Error getting file stream:', error);
      throw new InternalServerError('Failed to read file');
    }
  }

  /**
   * Check if a file exists
   * @param filePath Path to the file
   * @returns Boolean indicating if the file exists
   */
  public async fileExists(filePath: string): Promise<boolean> {
    try {
      await fsAccess(filePath);
      return true;
    } catch (error) {
      const e = error as any;
      if (e.code !== 'ENOENT') {
        throw error;
      }
      return false;
    }
  }

  /**
   * Get file stats
   * @param filePath Path to the file
   * @returns File stats
   */
  public async getFileStats(filePath: string): Promise<fs.Stats> {
    try {
      return await fs.promises.stat(filePath);
    } catch (error) {
      logger.error('Error getting file stats:', error);
      throw new InternalServerError('Failed to get file stats');
    }
  }

  /**
   * Generate a pre-signed URL for direct upload to cloud storage (e.g., S3)
   * @param fileName The name of the file
   * @param mimeType The MIME type of the file
   * @param options Additional options
   * @returns Pre-signed URL and file key
   */
  public async generatePresignedUrl(
    fileName: string,
    mimeType: string,
    options: {
      bucket?: string;
      expiresIn?: number;
      metadata?: Record<string, string>;
    } = {}
  ) {
    // In a real implementation, this would generate a pre-signed URL for S3 or similar
    // For now, we'll return a mock response
    const fileKey = `uploads/${uuidv4()}-${fileName}`;
    
    return {
      url: `${config.apiUrl}/api/storage/upload/${fileKey}`,
      method: 'PUT',
      headers: {
        'Content-Type': mimeType,
        ...(options.metadata || {}),
      },
      fileKey,
      expiresAt: new Date(Date.now() + (options.expiresIn || 3600 * 1000)).toISOString(),
    };
  }

  /**
   * Clean up old temporary files
   * @param olderThanHours Delete files older than this many hours
   */
  public async cleanupTempFiles(olderThanHours = 24): Promise<void> {
    try {
      const now = Date.now();
      const files = await fs.promises.readdir(this.uploadDir, { withFileTypes: true });
      
      for (const file of files) {
        if (file.isFile()) {
          const filePath = path.join(this.uploadDir, file.name);
          const stats = await this.getFileStats(filePath);
          const fileAgeHours = (now - stats.mtimeMs) / (1000 * 60 * 60);
          
          if (fileAgeHours > olderThanHours) {
            await this.deleteFile(filePath);
            logger.info(`Cleaned up old file: ${filePath}`);
          }
        }
      }
    } catch (error) {
      logger.error('Error cleaning up temp files:', error);
    }
  }
}

// Export a singleton instance
export const storageService = StorageService.getInstance();
