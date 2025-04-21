/**
 * Sirened book bucket service.
 * This service provides functionality for uploading, retrieving, and deleting book files
 * from object storage.
 */

import { Client } from '@replit/object-storage';

interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

/**
 * Handles book file uploads and storage
 */
export class SirenedBookBucket {
  private storage: Client;
  private bucketName: string;

  constructor() {
    // Initialize object storage
    this.storage = new Client();
    this.bucketName = 'sirened-book-files';
  }

  /**
   * Get a full path for a book file in the object storage
   * Pattern: sirened-book-files/book_{bookId}/{formatType}/{filename}
   */
  private getBookFilePath(bookId: number, formatType: string, filename: string): string {
    // Sanitize filename to prevent path traversal attacks
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    return `${this.bucketName}/book_${bookId}/${formatType}/${sanitizedFilename}`;
  }

  /**
   * Upload a book file to object storage
   * @param bookId The ID of the book
   * @param formatType The type of book format (e.g., 'softback', 'hardback', 'digital', 'audiobook')
   * @param file The file to upload
   * @returns The URL of the uploaded file
   */
  async uploadBookFile(bookId: number, formatType: string, file: UploadedFile): Promise<string> {
    if (!file || !file.buffer) {
      throw new Error('No file provided for upload');
    }

    try {
      // Create a path for the file in the format: sirened-book-files/book_{bookId}/{formatType}/{filename}
      const path = this.getBookFilePath(bookId, formatType, file.originalname);
      
      // Upload the file to object storage
      await this.storage.put(path, file.buffer, {
        contentType: file.mimetype,
        contentLength: file.size,
      });

      // Return the path which is the identifier for the file in the storage
      return path;
    } catch (error) {
      console.error('Error uploading book file:', error);
      throw new Error(`Failed to upload book file: ${(error as Error).message}`);
    }
  }

  /**
   * Get a book file from object storage
   * @param path The path of the file in object storage
   * @returns The file data and metadata
   */
  async getBookFile(path: string): Promise<{ data: Buffer; contentType: string }> {
    try {
      // Get the file from object storage
      const data = await this.storage.get(path);
      
      if (!data) {
        throw new Error('File not found');
      }

      // Get the file metadata
      const meta = await this.storage.head(path);
      const contentType = meta?.contentType || 'application/octet-stream';

      return { data, contentType };
    } catch (error) {
      console.error('Error getting book file:', error);
      throw new Error(`Failed to get book file: ${(error as Error).message}`);
    }
  }

  /**
   * Delete a book file from object storage
   * @param path The path of the file in object storage
   */
  async deleteBookFile(path: string): Promise<void> {
    try {
      // Delete the file from object storage
      await this.storage.delete(path);
    } catch (error) {
      console.error('Error deleting book file:', error);
      throw new Error(`Failed to delete book file: ${(error as Error).message}`);
    }
  }

  /**
   * List all book files for a specific book
   * @param bookId The ID of the book
   * @returns List of file paths
   */
  async listBookFiles(bookId: number): Promise<string[]> {
    try {
      const prefix = `${this.bucketName}/book_${bookId}/`;
      const files = await this.storage.list(prefix);
      return files;
    } catch (error) {
      console.error('Error listing book files:', error);
      throw new Error(`Failed to list book files: ${(error as Error).message}`);
    }
  }
}

// Create and export a singleton instance
export const sirenedBookBucket = new SirenedBookBucket();