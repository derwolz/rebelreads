import path from 'path';
import { Readable } from 'stream';
import { nanoid } from 'nanoid';
import fetch from 'node-fetch';

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
  private readonly defaultBucketId: string;
  private readonly baseUrl: string = 'https://objects.replit.app/v1';
  private readonly apiUrl: string;

  constructor() {
    // Get the bucket ID from the environment or .replit config
    this.defaultBucketId = process.env.REPLIT_BUCKET_ID || 'replit-objstore-ac9f763f-902a-4711-b57a-2a5a71e598d3';
    this.apiUrl = `${this.baseUrl}/buckets/${this.defaultBucketId}/objects`;
    console.log(`Initialized ObjectStorageService with bucket ID: ${this.defaultBucketId}`);
  }

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
      
      // Upload to Replit Object Storage
      const response = await fetch(`${this.apiUrl}/${storageKey}`, {
        method: 'PUT',
        body: buffer,
        headers: {
          'Content-Type': this.getContentTypeFromExtension(extension),
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error uploading to object storage: ${response.status} ${errorText}`);
        throw new Error(`Failed to upload file: ${response.status} ${response.statusText}`);
      }
      
      console.log(`Successfully uploaded file to object storage: ${storageKey}`);
      
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
      // Get file from Replit Object Storage
      const response = await fetch(`${this.apiUrl}/${storageKey}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log(`File not found in object storage: ${storageKey}`);
          throw new Error('File not found');
        }
        
        const errorText = await response.text();
        console.error(`Error retrieving from object storage: ${response.status} ${errorText}`);
        throw new Error(`Failed to retrieve file: ${response.status} ${response.statusText}`);
      }
      
      // Get the content type from the response headers
      const contentType = response.headers.get('content-type') || this.getContentTypeFromExtension(path.extname(storageKey));
      
      // Convert the response body to a readable stream
      const stream = Readable.fromWeb(response.body as any);
      
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
      // Use HEAD request to check if file exists
      const response = await fetch(`${this.apiUrl}/${storageKey}`, {
        method: 'HEAD',
      });
      
      return response.ok;
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
      // Delete file from Replit Object Storage
      const response = await fetch(`${this.apiUrl}/${storageKey}`, {
        method: 'DELETE',
      });
      
      return response.ok;
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
    // For Replit Object Storage, we use the API route to serve the files
    return `/api/storage/${storageKey}`;
  }

  /**
   * List all files in a directory
   * @param directory Directory to list files from
   * @returns Array of storage keys for files in the directory
   */
  async listFiles(directory: string): Promise<string[]> {
    try {
      // List files with the directory prefix from Replit Object Storage
      // We need to use the /v1/buckets/{bucketId}/list endpoint
      const response = await fetch(`${this.baseUrl}/buckets/${this.defaultBucketId}/list?prefix=${directory}/`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error listing files from object storage: ${response.status} ${errorText}`);
        return [];
      }
      
      const data = await response.json() as { objects: { name: string }[] };
      
      // Extract the full storage keys from the response
      return data.objects.map(obj => obj.name);
    } catch (error) {
      console.error('Error listing files from storage:', error);
      return [];
    }
  }
  
  /**
   * Get content type from file extension
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

// Export a singleton instance
export const objectStorage = new ObjectStorageService();