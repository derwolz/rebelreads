import express, { Request, Response, Router } from 'express';
import { objectStorage } from '../services/object-storage';
import path from 'path';

const router: Router = express.Router();

/**
 * Simple MIME type lookup function
 * @param extension File extension with or without leading dot
 * @returns MIME type string or default type
 */
function getMimeType(extension: string): string {
  // Ensure extension starts with a dot and convert to lowercase
  const ext = extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`;
  
  // Common MIME types mapping
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.zip': 'application/zip',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'audio/ogg',
    '.wav': 'audio/wav',
    '.avi': 'video/x-msvideo',
    '.csv': 'text/csv'
  };
  
  // Return the MIME type or default to binary
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Route to serve files from object storage
 * Acts as a proxy to retrieve files from storage and serve them with proper content type
 * URL format: /api/storage/:storageKey
 */
router.get('/:storageKey(*)', async (req: Request, res: Response) => {
  try {
    const storageKey = req.params.storageKey;
    
    // Get file from storage
    const fileBuffer = await objectStorage.getFile(storageKey);
    
    if (!fileBuffer) {
      console.error(`File not found in storage: ${storageKey}`);
      return res.status(404).send('File not found');
    }
    
    // Determine content type based on file extension
    const extension = path.extname(storageKey);
    const contentType = getMimeType(extension);
    
    // Set appropriate headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', fileBuffer.length);
    
    // Add cache headers to improve performance
    const CACHE_DURATION = 60 * 60 * 24 * 7; // 7 days in seconds
    res.setHeader('Cache-Control', `public, max-age=${CACHE_DURATION}`);
    
    // Send the file
    res.send(fileBuffer);
  } catch (error) {
    console.error('Error serving file from storage:', error);
    res.status(500).send('Error retrieving file');
  }
});

export default router;