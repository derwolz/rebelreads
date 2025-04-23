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
import sharp from 'sharp';

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
    'background': 'covers/background',
    'spine': 'covers/spine',
    'hero': 'covers/hero',
    'full': 'covers/full',
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
  
  /**
   * Generate additional book image sizes from the full resolution image
   * Specifically creates:
   * - book-card (260x435)
   * - mini (64x40)
   * 
   * Note: We no longer generate book-detail (773x480) since we use the full image for that purpose
   * IMPORTANT: Images are stored in separate directories:
   * - book-card images go in 'covers/card'
   * - mini images go in 'covers/mini'
   * 
   * @param fullResolutionFile The original high-res image file (2560x1600)
   * @param bookId The book ID
   * @returns Object with the generated image storage keys and public URLs
   */
  async generateAdditionalBookImages(
    fullResolutionFile: UploadedFile,
    bookId: number
  ): Promise<{
    bookCard: { storageKey: string; publicUrl: string } | null;
    mini: { storageKey: string; publicUrl: string } | null;
  }> {
    console.log(`Generating additional image sizes for book ID ${bookId} from full resolution image`);
    
    if (!fullResolutionFile || !fullResolutionFile.buffer) {
      throw new Error('No full resolution image provided for resizing');
    }
    
    const result = {
      bookCard: null as { storageKey: string; publicUrl: string } | null,
      mini: null as { storageKey: string; publicUrl: string } | null
    };
    
    try {
      // Image processing options with proper aspect ratio preservation
      const imageOptions = { 
        fit: 'contain' as const, 
        background: { r: 255, g: 255, b: 255, alpha: 0 },
        withoutEnlargement: true
      };
      
      // Convert to optimized format (WebP) for smaller file sizes
      const formatOptions = { 
        quality: 90
      };
      
      // We no longer generate a separate book-detail image
      // Instead, the book-detail view will use the full image directly
      
      // Generate book-card image (260x435)
      const bookCardBuffer = await sharp(fullResolutionFile.buffer)
        .resize(260, 435, imageOptions)
        .webp(formatOptions)
        .toBuffer();
      
      // Create a file object for the book-card image
      const bookCardFile: UploadedFile = {
        ...fullResolutionFile,
        buffer: bookCardBuffer,
        size: bookCardBuffer.length,
        originalname: `book-card-${bookId}.webp`,
        mimetype: 'image/webp'
      };
      
      console.log("Creating book-card image for:", bookId, "to be stored in directory:", this.directories['book-card']);
      
      // Upload the book-card image
      const bookCardStorageKey = await this.uploadBookImage(bookCardFile, 'book-card', bookId);
      const bookCardPublicUrl = this.getPublicUrl(bookCardStorageKey);
      
      result.bookCard = {
        storageKey: bookCardStorageKey,
        publicUrl: bookCardPublicUrl
      };
      
      // Generate mini image (64x40)
      const miniBuffer = await sharp(fullResolutionFile.buffer)
        .resize(64, 40, imageOptions)
        .webp(formatOptions)
        .toBuffer();
      
      // Create a file object for the mini image
      const miniFile: UploadedFile = {
        ...fullResolutionFile,
        buffer: miniBuffer,
        size: miniBuffer.length,
        originalname: `mini-${bookId}.webp`,
        mimetype: 'image/webp'
      };
      
      // Upload the mini image
      const miniStorageKey = await this.uploadBookImage(miniFile, 'mini', bookId);
      const miniPublicUrl = this.getPublicUrl(miniStorageKey);
      
      result.mini = {
        storageKey: miniStorageKey,
        publicUrl: miniPublicUrl
      };
      
      console.log(`Successfully generated additional images for book ID ${bookId}`);
      return result;
    } catch (error) {
      console.error(`Error generating additional images for book ID ${bookId}:`, error);
      return result;
    }
  }
}

// Create singleton instance
export const sirenedImageBucket = new SirenedImageBucket();