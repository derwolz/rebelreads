/**
 * Utility for processing and resizing images on the client-side
 */

/**
 * Create a canvas element for image processing
 */
function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * Resize an image file to the specified dimensions
 * @param sourceFile The source image file to resize
 * @param targetWidth The target width
 * @param targetHeight The target height
 * @param quality The JPEG quality (0-1)
 * @param mimeType The output mime type (default: 'image/jpeg')
 * @returns A promise that resolves to the resized image as a Blob
 */
export async function resizeImage(
  sourceFile: File,
  targetWidth: number,
  targetHeight: number,
  quality = 0.9,
  mimeType = 'image/jpeg'
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        // Create a canvas with the desired dimensions
        const canvas = createCanvas(targetWidth, targetHeight);
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Optional: set background to white (for transparent images)
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        
        // Calculate scaling to fit within canvas while maintaining aspect ratio
        const sourceWidth = img.naturalWidth;
        const sourceHeight = img.naturalHeight;
        
        // Target aspect ratio
        const targetRatio = targetWidth / targetHeight;
        // Source aspect ratio
        const sourceRatio = sourceWidth / sourceHeight;
        
        let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
        
        // Determine how to fit the image
        if (sourceRatio > targetRatio) {
          // Source is wider than target
          drawHeight = targetHeight;
          drawWidth = sourceWidth * (targetHeight / sourceHeight);
          offsetX = (targetWidth - drawWidth) / 2;
        } else {
          // Source is taller than target
          drawWidth = targetWidth;
          drawHeight = sourceHeight * (targetWidth / sourceWidth);
          offsetY = (targetHeight - drawHeight) / 2;
        }
        
        // Draw the image on the canvas
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        
        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert canvas to blob'));
            }
          },
          mimeType,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    // Load the image
    img.src = URL.createObjectURL(sourceFile);
  });
}

/**
 * Convert a Blob to a File object
 * @param blob The blob to convert
 * @param fileName The name for the new file
 * @param mimeType The mime type of the file
 * @returns A File object
 */
export function blobToFile(blob: Blob, fileName: string, mimeType: string): File {
  return new File([blob], fileName, { type: mimeType });
}

/**
 * Generate derived images (mini, book-card) from a full-size image
 * @param fullSizeFile The full-size image file
 * @returns A promise that resolves to an object containing the derived image files
 */
export async function generateDerivedImages(fullSizeFile: File): Promise<{
  mini: File;
  bookCard: File;
}> {
  try {
    // Generate book-card image (256x412)
    const bookCardBlob = await resizeImage(
      fullSizeFile,
      256,
      412,
      0.9,
      'image/jpeg'
    );
    
    // Generate mini image (96x60) with higher quality
    const miniBlob = await resizeImage(
      fullSizeFile,
      96,
      60,
      0.95,
      'image/jpeg'
    );
    
    // Convert blobs to files
    const bookCardFile = blobToFile(
      bookCardBlob,
      `book-card-${Date.now()}.jpg`,
      'image/jpeg'
    );
    
    const miniFile = blobToFile(
      miniBlob,
      `mini-${Date.now()}.jpg`,
      'image/jpeg'
    );
    
    return {
      mini: miniFile,
      bookCard: bookCardFile
    };
  } catch (error) {
    console.error('Error generating derived images:', error);
    throw error;
  }
}