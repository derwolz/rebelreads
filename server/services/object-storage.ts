/**
 * Object Storage Service
 * 
 * This service provides a wrapper around @replit/object-storage
 * for file storage and retrieval.
 */
import { Client, type ClientOptions, type StorageObject } from '@replit/object-storage';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';

// Define interface for file objects (like Express multer files)
interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

class ObjectStorageService {
  private client: Client;
  
  constructor() {
    // Create the Replit Object Storage client
    this.client = new Client({
      // The bucketId is specific to our Sirened application object storage
      bucketId: 'replit-objstore-ac9f763f-902a-4711-b57a-2a5a71e598d3',
    });
  }

  /**
   * Upload a file to object storage
   * @param file The uploaded file (from multer)
   * @param directory Optional subdirectory to place the file in
   * @returns The storage key (path) of the uploaded file
   */
  async uploadFile(file: UploadedFile, directory?: string): Promise<string> {
    try {
      // Create a unique filename to avoid collisions
      const uniqueId = nanoid(8);
      const extname = path.extname(file.originalname);
      const filename = `${path.basename(file.originalname, extname)}-${uniqueId}${extname}`;
      
      // Construct the storage key (path)
      const storageKey = directory ? `${directory}/${filename}` : filename;
      
      // Upload the file to object storage using the correct method
      const result = await this.client.uploadFromBytes(storageKey, file.buffer);
      
      if (!result.ok) {
        throw new Error(`Upload failed: ${result.error.message}`);
      }
      
      return storageKey;
    } catch (error) {
      console.error('Error uploading file to object storage:', error);
      throw new Error('Failed to upload file to object storage');
    }
  }

  /**
   * Retrieve a file from object storage
   * @param storageKey The key (path) to the file
   * @returns The file buffer
   */
  async getFile(storageKey: string): Promise<Buffer | null> {
    try {
      // Get the file from object storage using the correct method
      const result = await this.client.downloadAsBytes(storageKey);
      
      if (!result.ok) {
        return null;
      }
      
      return result.value[0]; // downloadAsBytes returns an array with a single Buffer
    } catch (error) {
      console.error('Error retrieving file from object storage:', error);
      return null;
    }
  }

  /**
   * Delete a file from object storage
   * @param storageKey The key (path) to the file
   * @returns Boolean indicating success
   */
  async deleteFile(storageKey: string): Promise<boolean> {
    try {
      // Delete the file from object storage
      const result = await this.client.delete(storageKey);
      return result.ok;
    } catch (error) {
      console.error('Error deleting file from object storage:', error);
      return false;
    }
  }

  /**
   * List files in a directory
   * @param directory The directory to list files from
   * @returns Array of file keys
   */
  async listFiles(directory: string): Promise<string[]> {
    try {
      // List files with the given prefix
      const result = await this.client.list({ prefix: `${directory}/` });
      
      if (!result.ok) {
        return [];
      }
      
      // Map StorageObject array to array of keys (strings)
      return result.value.map(obj => obj.name);
    } catch (error) {
      console.error('Error listing files from object storage:', error);
      return [];
    }
  }

  /**
   * Get the public URL for a file
   * @param storageKey The key (path) to the file
   * @returns The public URL
   */
  getPublicUrl(storageKey: string): string {
    // Always return a relative URL path
    // This ensures it works across both development and production domains
    // The browser will resolve it relative to the current domain
    return `/api/storage/${storageKey}`;
  }
}

// Create singleton instance
export const objectStorage = new ObjectStorageService();