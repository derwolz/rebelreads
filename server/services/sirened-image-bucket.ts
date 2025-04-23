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
    'book-cover': 'covers/cover',
    'book-card': 'covers/card',
    'mini': 'covers/mini',
    // Banner types
    'vertical-banner': 'covers/vertical-banner',
    'horizontal-banner': 'covers/horizontal-banner',
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
      
      if (!directory) {
        console.error(`Invalid image type: ${imageType}. Valid types are: ${Object.keys(this.directories).join(', ')}`);
        throw new Error(`Invalid image type: ${imageType}`);
      }
      
      console.log(`Uploading ${imageType} image to directory: ${directory}`);
      
      // Create a more specific path if bookId is provided
      const filePath = bookId 
        ? `${directory}/book_${bookId}` 
        : directory;
      
      console.log(`Final storage path: ${filePath}`);
      
      // Create a descriptive filename that includes image type and book ID
      const extname = path.extname(file.originalname) || '.webp';
      const basename = imageType;
      const uniqueId = nanoid(8);
      const filename = bookId 
        ? `${basename}-${bookId}-${uniqueId}${extname}`
        : `${basename}-${uniqueId}${extname}`;
      
      // Create the complete filepath with filename
      const fullPath = `${filePath}/${filename}`;
      console.log(`Full storage path with filename: ${fullPath}`);
      
      // Upload to object storage, forcing the specific path + filename
      const storageKey = await objectStorage.uploadFileWithPath(file, fullPath);
      
      if (!storageKey) {
        throw new Error(`Failed to upload image to path: ${fullPath}`);
      }
      
      // Log the resulting storage key and public URL
      const publicUrl = this.getPublicUrl(storageKey);
      console.log(`Image uploaded successfully: 
        - Storage Key: ${storageKey}
        - Public URL: ${publicUrl}
        - Image Type: ${imageType}`);
      
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
   * - book-cover (480x770)
   * - book-card (256x412)
   * - mini (64x40)
   * 
   * IMPORTANT: Images are stored in separate directories:
   * - book-cover images go in 'covers/cover'
   * - book-card images go in 'covers/card'
   * - mini images go in 'covers/mini'
   * 
   * This is a critical function for the book upload/edit process
   * 
   * @param fullResolutionFile The original high-res image file (1600x2560)
   * @param bookId The book ID
   * @returns Object with the generated image storage keys and public URLs
   */
  async generateAdditionalBookImages(
    fullResolutionFile: UploadedFile,
    bookId: number
  ): Promise<{
    bookCover: { storageKey: string; publicUrl: string } | null;
    bookCard: { storageKey: string; publicUrl: string } | null;
    mini: { storageKey: string; publicUrl: string } | null;
  }> {
    console.log(`Generating additional image sizes for book ID ${bookId} from full resolution image`);
    
    if (!fullResolutionFile || !fullResolutionFile.buffer) {
      throw new Error('No full resolution image provided for resizing');
    }
    
    const result = {
      bookCover: null as { storageKey: string; publicUrl: string } | null,
      bookCard: null as { storageKey: string; publicUrl: string } | null,
      mini: null as { storageKey: string; publicUrl: string } | null
    };
    
    try {
      // Verify that the directories exist in our configuration
      if (!this.directories['book-cover'] || !this.directories['book-card'] || !this.directories['mini']) {
        console.error('Missing directory configuration for derived images', this.directories);
        throw new Error('Directory configuration missing for derived images');
      }
      
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
      
      // Higher quality options for mini images
      const miniFormatOptions = {
        quality: 95
      };
      
      // ----------------------------------------------------------------
      // Generate book-cover image (480x770)
      // ----------------------------------------------------------------
      const bookCoverBuffer = await sharp(fullResolutionFile.buffer)
        .resize(480, 770, imageOptions)
        .webp(formatOptions)
        .toBuffer();
      
      // Create a descriptive filename that clearly indicates type and book ID
      const bookCoverFilename = `book-cover-${bookId}-${Date.now().toString(36)}.webp`;
      
      // Create a file object for the book-cover image
      const bookCoverFile: UploadedFile = {
        ...fullResolutionFile,
        buffer: bookCoverBuffer,
        size: bookCoverBuffer.length,
        originalname: bookCoverFilename,
        mimetype: 'image/webp'
      };
      
      console.log(`Creating book-cover image '${bookCoverFilename}' for book ID: ${bookId}`);
      console.log(`Will be stored in directory: ${this.directories['book-cover']}`);
      
      // Upload the book-cover image
      const bookCoverStorageKey = await this.uploadBookImage(bookCoverFile, 'book-cover', bookId);
      const bookCoverPublicUrl = this.getPublicUrl(bookCoverStorageKey);
      
      // Verify the path contains the correct directory
      if (!bookCoverStorageKey.includes(this.directories['book-cover'])) {
        console.error(`WARNING: Book cover storage key does not contain expected directory path.
          Expected: ${this.directories['book-cover']}
          Actual: ${bookCoverStorageKey}`);
      }
      
      console.log(`Book cover image saved at storage key: ${bookCoverStorageKey}`);
      console.log(`Book cover public URL: ${bookCoverPublicUrl}`);
      
      result.bookCover = {
        storageKey: bookCoverStorageKey,
        publicUrl: bookCoverPublicUrl
      };
      
      // ----------------------------------------------------------------
      // Generate book-card image (256x412)
      // ----------------------------------------------------------------
      const bookCardBuffer = await sharp(fullResolutionFile.buffer)
        .resize(256, 412, imageOptions)
        .webp(formatOptions)
        .toBuffer();
      
      // Create a descriptive filename that clearly indicates type and book ID
      const bookCardFilename = `book-card-${bookId}-${Date.now().toString(36)}.webp`;
      
      // Create a file object for the book-card image
      const bookCardFile: UploadedFile = {
        ...fullResolutionFile,
        buffer: bookCardBuffer,
        size: bookCardBuffer.length,
        originalname: bookCardFilename,
        mimetype: 'image/webp'
      };
      
      console.log(`Creating book-card image '${bookCardFilename}' for book ID: ${bookId}`);
      console.log(`Will be stored in directory: ${this.directories['book-card']}`);
      
      // Upload the book-card image
      const bookCardStorageKey = await this.uploadBookImage(bookCardFile, 'book-card', bookId);
      const bookCardPublicUrl = this.getPublicUrl(bookCardStorageKey);
      
      // Verify the path contains the correct directory
      if (!bookCardStorageKey.includes(this.directories['book-card'])) {
        console.error(`WARNING: Book card storage key does not contain expected directory path.
          Expected: ${this.directories['book-card']}
          Actual: ${bookCardStorageKey}`);
      }
      
      console.log(`Book card image saved at storage key: ${bookCardStorageKey}`);
      console.log(`Book card public URL: ${bookCardPublicUrl}`);
      
      result.bookCard = {
        storageKey: bookCardStorageKey,
        publicUrl: bookCardPublicUrl
      };
      
      // ----------------------------------------------------------------
      // Generate mini image (64x40)
      // ----------------------------------------------------------------
      const miniBuffer = await sharp(fullResolutionFile.buffer)
        .resize(64, 40, imageOptions)
        .webp({ quality: 95 }) // Higher quality for mini images
        .toBuffer();
      
      // Create a descriptive filename that clearly indicates type and book ID
      const miniFilename = `mini-${bookId}-${Date.now().toString(36)}.webp`;
      
      // Create a file object for the mini image
      const miniFile: UploadedFile = {
        ...fullResolutionFile,
        buffer: miniBuffer,
        size: miniBuffer.length,
        originalname: miniFilename,
        mimetype: 'image/webp'
      };
      
      console.log(`Creating mini image '${miniFilename}' for book ID: ${bookId}`);
      console.log(`Will be stored in directory: ${this.directories['mini']}`);
      
      // Upload the mini image
      const miniStorageKey = await this.uploadBookImage(miniFile, 'mini', bookId);
      const miniPublicUrl = this.getPublicUrl(miniStorageKey);
      
      // Verify the path contains the correct directory
      if (!miniStorageKey.includes(this.directories['mini'])) {
        console.error(`WARNING: Mini image storage key does not contain expected directory path.
          Expected: ${this.directories['mini']}
          Actual: ${miniStorageKey}`);
      }
      
      console.log(`Mini image saved at storage key: ${miniStorageKey}`);
      console.log(`Mini public URL: ${miniPublicUrl}`);
      
      result.mini = {
        storageKey: miniStorageKey,
        publicUrl: miniPublicUrl
      };
      
      console.log(`Successfully generated additional images for book ID ${bookId}`);
      return result;
    } catch (error) {
      console.error(`Error generating additional images for book ID ${bookId}:`, error);
      
      // Return partial results if any were successfully generated
      return result;
    }
  }
}

// Create singleton instance
export const sirenedImageBucket = new SirenedImageBucket();