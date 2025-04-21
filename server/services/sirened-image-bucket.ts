import { ObjectStorageService } from './object-storage';
import path from 'path';
import { nanoid } from 'nanoid';
import fs from 'fs/promises';

/**
 * SirenedImageBucket service
 * A dedicated service for handling book image uploads with Sirened-specific functionality
 * This extends the base ObjectStorageService with additional features specific to book image management
 */
export class SirenedImageBucket {
  private objectStorage: ObjectStorageService;
  
  constructor(objectStorage: ObjectStorageService) {
    this.objectStorage = objectStorage;
  }
  
  /**
   * Upload a book image file
   * @param file Multer file object
   * @param imageType Type of image (book-detail, book-card, etc.)
   * @param bookId Optional book ID for organization
   * @returns Storage key of the uploaded file
   */
  async uploadBookImage(file: Express.Multer.File, imageType: string, bookId?: number): Promise<string> {
    // Create a folder structure: covers/{bookId or 'general'}
    const folder = bookId ? `covers/${bookId}` : 'covers/general';
    
    // Generate a unique filename with type prefix for better organization
    const uniqueId = nanoid(12);
    const extension = path.extname(file.originalname);
    
    // Manually rename the file to include the image type
    const originalName = file.originalname;
    file.originalname = `${imageType}_${uniqueId}${extension}`;
    
    // Use the base object storage service to upload the file
    const storageKey = await this.objectStorage.uploadFile(file, folder);
    
    // Restore original filename
    file.originalname = originalName;
    
    return storageKey;
  }
  
  /**
   * Get public URL for a stored image
   * @param storageKey Storage key of the image
   * @returns Public URL for accessing the image
   */
  getPublicUrl(storageKey: string): string {
    return this.objectStorage.getPublicUrl(storageKey);
  }
  
  /**
   * Delete a book image
   * @param storageKey Storage key of the image to delete
   * @returns Boolean indicating success
   */
  async deleteBookImage(storageKey: string): Promise<boolean> {
    return this.objectStorage.deleteFile(storageKey);
  }
  
  /**
   * List all images for a specific book
   * @param bookId Book ID
   * @returns Array of storage keys for the book's images
   */
  async listBookImages(bookId: number): Promise<string[]> {
    return this.objectStorage.listFiles(`covers/${bookId}`);
  }
}

// Create and export a singleton instance
import { objectStorage } from './object-storage';
export const sirenedImageBucket = new SirenedImageBucket(objectStorage);