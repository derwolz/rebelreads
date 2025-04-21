import path from 'path';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import { Readable } from 'stream';
import { nanoid } from 'nanoid';

// Since we're having issues with the Replit Object Storage package,
// we'll implement a file-system based alternative for now
// This can be replaced with the actual Replit Object Storage implementation later

/**
 * Generate a unique ID suitable for filenames
 * @param length Length of the ID to generate (default: 16)
 * @returns Unique ID string
 */
function createId(length: number = 16): string {
  return nanoid(length);
}

/**
 * File Storage Service using Replit Object Storage
 * Handles uploading, retrieving, and managing files in storage
 */
export class ObjectStorageService {
  /**
   * Upload a file buffer to object storage
   * @param buffer File buffer to upload
   * @param filename Original filename (for extension)
   * @param directory Optional directory path within storage
   * @returns The URL path to access the file
   */
  async uploadBuffer(buffer: Buffer, filename: string, directory: string = 'general'): Promise<string> {
    try {
      // Generate a unique ID for the file
      const uniqueId = createId();
      const extension = path.extname(filename);
      const storageKey = `${directory}/${uniqueId}${extension}`;
      
      // Create the physical directory path
      const baseDir = './uploads/object-storage';
      const fullDir = path.join(baseDir, directory);
      
      // Ensure the directory exists
      await fs.mkdir(fullDir, { recursive: true });
      
      // Save the file
      const filePath = path.join(baseDir, storageKey);
      await fs.writeFile(filePath, buffer);
      
      // Return the path to access the file
      return storageKey;
    } catch (error) {
      console.error('Error uploading file to storage:', error);
      throw new Error('Failed to upload file to storage');
    }
  }

  /**
   * Upload a file from a multer file object to object storage
   * @param file Multer file object
   * @param directory Directory to store the file in
   * @returns The URL path to access the file
   */
  async uploadFile(file: Express.Multer.File, directory: string = 'general'): Promise<string> {
    return this.uploadBuffer(file.buffer, file.originalname, directory);
  }

  /**
   * Get a file from object storage with content type detection
   * @param storageKey Storage key of the file
   * @returns Object containing content type and readable stream, or null if file not found
   */
  async getFile(storageKey: string): Promise<{ contentType: string, stream: Readable } | null> {
    try {
      // Construct the file path
      const baseDir = './uploads/object-storage';
      const filePath = path.join(baseDir, storageKey);
      
      // Check if file exists
      try {
        await fs.access(filePath);
      } catch (err) {
        console.log(`File not found: ${filePath}`);
        throw new Error('File not found');
      }
      
      // Detect content type based on file extension
      const extension = path.extname(storageKey).toLowerCase();
      let contentType = 'application/octet-stream'; // Default content type
      
      // Map extensions to content types
      const contentTypeMap: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.pdf': 'application/pdf',
        '.json': 'application/json',
        '.txt': 'text/plain',
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript'
      };
      
      if (extension in contentTypeMap) {
        contentType = contentTypeMap[extension];
      }
      
      // Create a readable stream from the file
      const stream = createReadStream(filePath);
      return { contentType, stream };
    } catch (error) {
      console.error('Error retrieving file from storage:', error);
      throw error; // Let the caller handle the error
    }
  }

  /**
   * Check if a file exists in storage
   * @param storageKey Storage key of the file
   * @returns Boolean indicating if the file exists
   */
  async fileExists(storageKey: string): Promise<boolean> {
    try {
      const baseDir = './uploads/object-storage';
      const filePath = path.join(baseDir, storageKey);
      
      try {
        await fs.access(filePath);
        return true;
      } catch {
        return false;
      }
    } catch (error) {
      console.error('Error checking file existence in storage:', error);
      return false;
    }
  }

  /**
   * Delete a file from storage
   * @param storageKey Storage key of the file
   * @returns Boolean indicating success
   */
  async deleteFile(storageKey: string): Promise<boolean> {
    try {
      const baseDir = './uploads/object-storage';
      const filePath = path.join(baseDir, storageKey);
      
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('Error deleting file from storage:', error);
      return false;
    }
  }

  /**
   * Get a publicly accessible URL for a file
   * @param storageKey Storage key of the file
   * @returns Public URL for the file
   */
  getPublicUrl(storageKey: string): string {
    // This returns the internal API route that will serve the file
    return `/api/storage/${storageKey}`;
  }

  /**
   * List all files in a directory
   * @param directory Directory to list files from
   * @returns Array of storage keys for files in the directory
   */
  async listFiles(directory: string): Promise<string[]> {
    try {
      const baseDir = './uploads/object-storage';
      const fullDir = path.join(baseDir, directory);
      
      // Ensure the directory exists
      try {
        await fs.access(fullDir);
      } catch {
        return []; // Directory doesn't exist
      }
      
      // Get all files in the directory
      const files = await fs.readdir(fullDir);
      
      // Format the storage keys
      return files.map(file => `${directory}/${file}`);
    } catch (error) {
      console.error('Error listing files from storage:', error);
      return [];
    }
  }
}

// Export a singleton instance
export const objectStorage = new ObjectStorageService();