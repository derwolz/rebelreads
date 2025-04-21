/**
 * Sirened Book Bucket Service
 * 
 * This service provides specialized book file handling for the Sirened platform
 * using the @replit/object-storage package. It handles different book formats
 * and maintains a consistent naming convention.
 */
import { objectStorage } from './object-storage';
import { nanoid } from 'nanoid';
import path from 'path';

// Define interface for file objects (like Express multer files)
interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

// Book format types
type BookFormatType = 'softback' | 'hardback' | 'digital' | 'audiobook';

class SirenedBookBucket {
  // Directory structure for different book formats
  private directories = {
    'softback': 'books/softback',
    'hardback': 'books/hardback',
    'digital': 'books/digital',
    'audiobook': 'books/audiobook',
  };
  
  /**
   * Upload a book file
   * @param file The uploaded file (from multer)
   * @param formatType Type of book format (determines storage path)
   * @param bookId Optional book ID for organization
   * @returns The storage key (path) of the uploaded file
   */
  async uploadBookFile(file: UploadedFile, formatType: BookFormatType, bookId?: number): Promise<string> {
    try {
      // Validate file type based on format
      this.validateFileType(file, formatType);
      
      // Get the appropriate directory for this format type
      const directory = this.directories[formatType];
      
      // Create a more specific path if bookId is provided
      const filePath = bookId 
        ? `${directory}/book_${bookId}` 
        : directory;
        
      // Upload to object storage
      const storageKey = await objectStorage.uploadFile(file, filePath);
      
      return storageKey;
    } catch (error) {
      console.error('Error uploading book to Sirened bucket:', error);
      throw new Error('Failed to upload book file');
    }
  }
  
  /**
   * Validate file type based on format
   * @param file The uploaded file
   * @param formatType Book format type
   */
  private validateFileType(file: UploadedFile, formatType: BookFormatType): void {
    // Check file type based on format
    switch (formatType) {
      case 'digital':
        // For digital books, allow PDF, EPUB, MOBI
        if (!['application/pdf', 'application/epub+zip', 'application/x-mobipocket-ebook'].includes(file.mimetype) &&
            !file.originalname.endsWith('.epub') && 
            !file.originalname.endsWith('.mobi')) {
          throw new Error('Digital book must be a PDF, EPUB, or MOBI file');
        }
        break;
        
      case 'audiobook':
        // For audiobooks, allow audio files
        if (!file.mimetype.startsWith('audio/') && 
            !['application/x-zip-compressed', 'application/zip'].includes(file.mimetype)) {
          throw new Error('Audiobook must be an audio file or zip of audio files');
        }
        break;
        
      default:
        // For other formats, we're more flexible, but prefer PDF
        break;
    }
  }
  
  /**
   * List book files by format type
   * @param formatType The format type to list files for
   * @param bookId Optional book ID to filter by
   * @returns Array of file keys
   */
  async listBookFiles(formatType: BookFormatType, bookId?: number): Promise<string[]> {
    try {
      const directory = this.directories[formatType];
      
      // If bookId is provided, filter to that specific book
      const prefix = bookId 
        ? `${directory}/book_${bookId}/` 
        : `${directory}/`;
      
      return await objectStorage.listFiles(prefix);
    } catch (error) {
      console.error('Error listing book files:', error);
      return [];
    }
  }
  
  /**
   * Delete a book file
   * @param storageKey The storage key of the file to delete
   * @returns Whether the deletion was successful
   */
  async deleteBookFile(storageKey: string): Promise<boolean> {
    try {
      return await objectStorage.deleteFile(storageKey);
    } catch (error) {
      console.error('Error deleting book file:', error);
      return false;
    }
  }
  
  /**
   * Get the public URL for a file
   * @param storageKey The key (path) to the file
   * @returns The public URL
   */
  getPublicUrl(storageKey: string): string {
    return objectStorage.getPublicUrl(storageKey);
  }
}

// Create singleton instance
export const sirenedBookBucket = new SirenedBookBucket();