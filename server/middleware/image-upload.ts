import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { generateS3Key, uploadToS3, isS3ConfigValid } from '../services/image-bucket';
import fs from 'fs';
import path from 'path';
import { IMAGE_TYPES } from '@shared/schema';

// Define allowed file types
const ALLOWED_MIMETYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
];

// File size limit (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Configure fallback local storage for when S3 is not available
const localUploadsDir = './uploads';
const localCoversDir = path.join(localUploadsDir, 'covers');

// Ensure directories exist
[localUploadsDir, localCoversDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Create multer storage configuration
const storage = multer.memoryStorage();

// Filter for allowed file types
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
    return cb(null, true);
  }
  cb(new Error('Only JPEG, PNG, WebP and GIF image files are allowed'));
};

// Create multer instance with configuration
export const imageUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});

/**
 * Middleware to process uploaded files and store them in S3 or locally
 */
export const processImageUploads = async (req: Request, res: Response, next: NextFunction) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } || {};
  
  // Skip if no files
  if (!files || Object.keys(files).length === 0) {
    return next();
  }
  
  // Process each file to either S3 or local storage
  try {
    const bookId = req.body.bookId ? parseInt(req.body.bookId, 10) : undefined;
    const processedFiles: {[fieldname: string]: {url: string, size: number}} = {};
    
    for (const [fieldName, fieldFiles] of Object.entries(files)) {
      for (const file of fieldFiles) {
        // Extract image type from fieldName (e.g., bookImage_book-detail -> book-detail)
        let imageType = '';
        if (fieldName.startsWith('bookImage_')) {
          imageType = fieldName.replace('bookImage_', '');
        } else {
          // Use a default type if not specified
          imageType = 'generic';
        }
        
        // Define file path and URL
        let fileUrl: string;
        
        if (isS3ConfigValid()) {
          // Upload to S3
          const s3Key = generateS3Key(file.originalname, imageType, bookId);
          fileUrl = await uploadToS3(file.buffer, s3Key, file.mimetype);
        } else {
          // Fallback to local storage
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const filename = uniqueSuffix + path.extname(file.originalname);
          const localPath = path.join(localCoversDir, filename);
          
          // Write file to disk
          fs.writeFileSync(localPath, file.buffer);
          
          // Generate URL
          fileUrl = `/uploads/covers/${filename}`;
        }
        
        // Store processed file info
        processedFiles[fieldName] = {
          url: fileUrl,
          size: file.size
        };
      }
    }
    
    // Add processed files to request for use in route handlers
    req.processedFiles = processedFiles;
    next();
  } catch (error) {
    console.error('Error processing file uploads:', error);
    return res.status(500).json({ error: 'Failed to process file uploads' });
  }
};

// Fields for book image upload
export const bookImageUploadFields = [
  { name: 'bookImage_book-detail', maxCount: 1 },
  { name: 'bookImage_background', maxCount: 1 },
  { name: 'bookImage_grid-item', maxCount: 1 },
  { name: 'bookImage_hero', maxCount: 1 }
];

// Middleware for handling book image uploads
export const bookImageUploadMiddleware = [
  imageUpload.fields(bookImageUploadFields),
  processImageUploads
];

// Fields for profile image upload
export const profileImageUploadFields = [
  { name: 'profileImage', maxCount: 1 }
];

// Middleware for handling profile image uploads
export const profileImageUploadMiddleware = [
  imageUpload.fields(profileImageUploadFields),
  processImageUploads
];

// Extend Express Request interface to include processedFiles
declare global {
  namespace Express {
    interface Request {
      processedFiles?: {
        [fieldname: string]: {
          url: string;
          size: number;
        };
      };
    }
  }
}