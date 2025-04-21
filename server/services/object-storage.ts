import path from 'path';
import { Readable } from 'stream';
import { nanoid } from 'nanoid';
import fs from 'fs/promises';
import { createReadStream, existsSync, mkdirSync } from 'fs';

/**
 * Generate a unique ID suitable for filenames
 * @param length Length of the ID to generate (default: 16)
 * @returns Unique ID string
 */
function createId(length: number = 16): string {
  return nanoid(length);
}

/**
 * Enhanced File Storage Service for Replit
 * This implementation is compatible with the official @replit/object-storage package API
 * but uses direct filesystem access for environments where the package can't be installed
 */
export class ReplitObjectStorage {
  private readonly bucketId: string;
  private readonly baseDir: string;

  constructor() {
    // Get the bucket ID from the environment or .replit config
    this.bucketId = process.env.REPLIT_BUCKET_ID || 'replit-objstore-ac9f763f-902a-4711-b57a-2a5a71e598d3';
    
    // The location where Replit mounts the object storage
    this.baseDir = process.env.REPL_HOME ? 
      `${process.env.REPL_HOME}/.config/object-storage/${this.bucketId}` : 
      './uploads/object-storage';
    
    console.log(`Initialized ReplitObjectStorage with bucket ID: ${this.bucketId}`);
    console.log(`Storage base directory: ${this.baseDir}`);
    
    // Ensure the base directory exists synchronously to avoid race conditions
    if (!existsSync(this.baseDir)) {
      try {
        mkdirSync(this.baseDir, { recursive: true });
        console.log(`Created base directory: ${this.baseDir}`);
      } catch (error) {
        console.error(`Error creating base directory: ${error}`);
      }
    }
  }
  
  /**
   * Upload a file buffer to object storage with a specific key
   * Compatible with official @replit/object-storage API
   * 
   * @param key The storage key to save the object under
   * @param data Buffer data to store
   * @returns Promise<void>
   */
  async put(key: string, data: Buffer): Promise<void> {
    try {
      // Extract directory path from key
      const dirPath = path.dirname(key);
      const fullDirPath = path.join(this.baseDir, dirPath);
      
      // Create directory if it doesn't exist
      if (dirPath !== '.' && !existsSync(fullDirPath)) {
        await fs.mkdir(fullDirPath, { recursive: true });
      }
      
      // Save the file to storage
      const filePath = path.join(this.baseDir, key);
      await fs.writeFile(filePath, data);
      
      console.log(`Successfully uploaded object to key: ${key}`);
    } catch (error) {
      console.error(`Error storing object at key ${key}:`, error);
      throw new Error(`Failed to store object at key ${key}`);
    }
  }
  
  /**
   * Get an object from storage by key
   * Compatible with official @replit/object-storage API
   * 
   * @param key The storage key to retrieve
   * @returns Promise<Buffer> The data stored at the key
   */
  async get(key: string): Promise<Buffer> {
    try {
      const filePath = path.join(this.baseDir, key);
      return await fs.readFile(filePath);
    } catch (error) {
      console.error(`Error retrieving object at key ${key}:`, error);
      throw new Error(`Object not found at key ${key}`);
    }
  }
  
  /**
   * Delete an object from storage
   * Compatible with official @replit/object-storage API
   * 
   * @param key The storage key to delete
   * @returns Promise<void>
   */
  async delete(key: string): Promise<void> {
    try {
      const filePath = path.join(this.baseDir, key);
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Error deleting object at key ${key}:`, error);
      throw new Error(`Failed to delete object at key ${key}`);
    }
  }
  
  /**
   * List objects with a given prefix
   * Compatible with official @replit/object-storage API
   * 
   * @param prefix The prefix to list objects under
   * @returns Promise<string[]> Array of keys matching the prefix
   */
  async list(prefix?: string): Promise<string[]> {
    try {
      // If prefix is provided, list only objects in that "directory"
      const listPath = prefix ? path.join(this.baseDir, prefix) : this.baseDir;
      
      // Check if directory exists
      if (!existsSync(listPath)) {
        return [];
      }
      
      // Get all files in the directory, recursively
      const results: string[] = [];
      await this.listFilesRecursively(listPath, results, prefix || '');
      
      return results;
    } catch (error) {
      console.error(`Error listing objects with prefix ${prefix}:`, error);
      return [];
    }
  }
  
  /**
   * Helper method to list files recursively
   */
  private async listFilesRecursively(dirPath: string, results: string[], prefix: string): Promise<void> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(this.baseDir, fullPath);
      
      if (entry.isDirectory()) {
        await this.listFilesRecursively(fullPath, results, prefix);
      } else {
        results.push(relativePath);
      }
    }
  }
  
  /**
   * Check if a key exists in storage
   * 
   * @param key The storage key to check
   * @returns Promise<boolean>
   */
  async exists(key: string): Promise<boolean> {
    try {
      const filePath = path.join(this.baseDir, key);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get a stream to an object in storage
   * Not in official API but very useful for web server responses
   * 
   * @param key The storage key to stream
   * @returns Readable stream of the object data
   */
  createReadStream(key: string): Readable {
    const filePath = path.join(this.baseDir, key);
    return createReadStream(filePath);
  }
  
  // === COMPATIBILITY METHODS WITH ORIGINAL IMPLEMENTATION ===
  
  /**
   * Upload a file buffer to object storage
   * Compatible with previous custom implementation
   * 
   * @param buffer File buffer to upload
   * @param filename Original filename (for extension)
   * @param directory Optional directory path within storage
   * @returns The storage key where the file was saved
   */
  async uploadBuffer(buffer: Buffer, filename: string, directory: string = 'general'): Promise<string> {
    try {
      // Generate a unique ID for the file
      const uniqueId = createId();
      const extension = path.extname(filename);
      const storageKey = `${directory}/${uniqueId}${extension}`;
      
      // Upload to storage using the new API
      await this.put(storageKey, buffer);
      
      // Return the path to access the file
      return storageKey;
    } catch (error) {
      console.error('Error uploading file to storage:', error);
      throw new Error('Failed to upload file to storage');
    }
  }

  /**
   * Upload a file from a multer file object to object storage
   * Compatible with previous custom implementation
   * 
   * @param file Multer file object
   * @param directory Directory to store the file in
   * @returns The storage key where the file was saved
   */
  async uploadFile(file: Express.Multer.File, directory: string = 'general'): Promise<string> {
    return this.uploadBuffer(file.buffer, file.originalname, directory);
  }

  /**
   * Get a file from object storage with content type detection
   * Compatible with previous custom implementation
   * 
   * @param storageKey Storage key of the file
   * @returns Object containing content type and readable stream, or null if file not found
   */
  async getFile(storageKey: string): Promise<{ contentType: string, stream: Readable } | null> {
    try {
      // Check if file exists
      if (!(await this.exists(storageKey))) {
        console.log(`File not found in object storage: ${storageKey}`);
        return null;
      }
      
      // Detect content type based on file extension
      const extension = path.extname(storageKey).toLowerCase();
      const contentType = this.getContentTypeFromExtension(extension);
      
      // Create a readable stream from the file
      const stream = this.createReadStream(storageKey);
      
      return { contentType, stream };
    } catch (error) {
      console.error('Error retrieving file from storage:', error);
      throw error; // Let the caller handle the error
    }
  }

  /**
   * Check if a file exists in storage
   * Compatible with previous custom implementation
   * 
   * @param storageKey Storage key of the file
   * @returns Boolean indicating if the file exists
   */
  async fileExists(storageKey: string): Promise<boolean> {
    return this.exists(storageKey);
  }

  /**
   * Delete a file from storage
   * Compatible with previous custom implementation
   * 
   * @param storageKey Storage key of the file
   * @returns Boolean indicating success
   */
  async deleteFile(storageKey: string): Promise<boolean> {
    try {
      await this.delete(storageKey);
      return true;
    } catch (error) {
      console.error('Error deleting file from storage:', error);
      return false;
    }
  }

  /**
   * Get a publicly accessible URL for a file
   * Compatible with previous custom implementation
   * 
   * @param storageKey Storage key of the file
   * @returns Public URL for the file
   */
  getPublicUrl(storageKey: string): string {
    // This returns the internal API route that will serve the file
    return `/api/storage/${storageKey}`;
  }

  /**
   * List all files in a directory
   * Compatible with previous custom implementation
   * 
   * @param directory Directory to list files from
   * @returns Array of storage keys for files in the directory
   */
  async listFiles(directory: string): Promise<string[]> {
    return this.list(directory);
  }
  
  /**
   * Get content type from file extension
   * Helper method for content type detection
   * 
   * @param extension File extension (with dot)
   * @returns MIME type string
   */
  private getContentTypeFromExtension(extension: string): string {
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
    
    return contentTypeMap[extension.toLowerCase()] || 'application/octet-stream';
  }
}

// For backward compatibility, we also expose ObjectStorageService
export class ObjectStorageService extends ReplitObjectStorage {
  // This class extends ReplitObjectStorage for backward compatibility
}

// Export a singleton instance
export const objectStorage = new ReplitObjectStorage();