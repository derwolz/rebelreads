/**
 * Sirened Image Bucket Service
 * 
 * This service provides specialized image handling for the Sirened platform
 * using the @replit/object-storage package. It handles different image types
 * and maintains a consistent naming convention.
 */
import { objectStorage } from './object-storage';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
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

// Import types from schema
import { IMAGE_TYPES } from '@shared/schema';

// Supported image types
type BookImageType = typeof IMAGE_TYPES[number] | 'book-thumbnail' | 'book-banner' | 'author-avatar' | 'custom';

class SirenedImageBucket {
  // Directory structure for different image types
  private directories: Record<string, string> = {
    // Main image types
    'book-detail': 'covers/detail',
    'background': 'covers/background',
    'spine': 'covers/spine',
    'hero': 'covers/hero',
    // Auto-generated types
    'book-card': 'covers/card',
    'mini': 'covers/mini',
    // Other types
    'book-thumbnail': 'covers/thumbnail',
    'book-banner': 'covers/banner', 
    'author-avatar': 'authors/avatars',
    'custom': 'custom',
  };
  
  /**
   * Upload a book or author-related image
   * @param file The uploaded file (from multer)
   * @param imageType Type of image (determines storage path)
   * @param bookId Optional book ID for book-related images
   * @returns The storage key (path) of the uploaded file
   */
  async uploadBookImage(file: UploadedFile, imageType: BookImageType, bookId?: number): Promise<string> {
    try {
      // Validate image file type
      if (!file.mimetype.startsWith('image/')) {
        throw new Error('Uploaded file must be an image');
      }
      
      // Get the appropriate directory for this image type
      const directory = this.directories[imageType];
      
      // Create a more specific path if bookId is provided
      const filePath = bookId 
        ? `${directory}/book_${bookId}` 
        : directory;
        
      // Upload to object storage
      const storageKey = await objectStorage.uploadFile(file, filePath);
      
      return storageKey;
    } catch (error) {
      console.error('Error uploading image to Sirened bucket:', error);
      throw new Error('Failed to upload image');
    }
  }
  
  /**
   * Upload a profile image for a user
   * @param file The uploaded file (from multer)
   * @param userId The user ID
   * @returns The storage key (path) of the uploaded file
   */
  async uploadProfileImage(file: UploadedFile, userId: number): Promise<string> {
    try {
      // Validate image file type
      if (!file.mimetype.startsWith('image/')) {
        throw new Error('Uploaded file must be an image');
      }
      
      // Define the directory structure for profile images
      const directory = `profiles/user_${userId}`;
      
      // Upload to object storage
      const storageKey = await objectStorage.uploadFile(file, directory);
      
      return storageKey;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      throw new Error('Failed to upload profile image');
    }
  }
  
  /**
   * Get an image file from storage
   * @param storageKey The key (path) to the file
   * @returns The file buffer or null if not found
   */
  async getImage(storageKey: string): Promise<Buffer | null> {
    return objectStorage.getFile(storageKey);
  }
  
  /**
   * Delete an image from storage
   * @param storageKey The key (path) to the file
   * @returns Boolean indicating success
   */
  async deleteImage(storageKey: string): Promise<boolean> {
    return objectStorage.deleteFile(storageKey);
  }
  
  /**
   * List images in a specific category
   * @param imageType Type of images to list
   * @param bookId Optional book ID to filter by
   * @returns Array of file keys
   */
  async listImages(imageType: BookImageType, bookId?: number): Promise<string[]> {
    const baseDir = this.directories[imageType];
    const directory = bookId ? `${baseDir}/book_${bookId}` : baseDir;
    
    return objectStorage.listFiles(directory);
  }
  
  /**
   * Get the public URL for an image
   * @param storageKey The key (path) to the file
   * @returns The public URL
   */
  getPublicUrl(storageKey: string): string {
    return objectStorage.getPublicUrl(storageKey);
  }
}

// Create singleton instance
export const sirenedImageBucket = new SirenedImageBucket();