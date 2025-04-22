/**
 * Script to upload Sirened logo to SirenedImageBucket
 * 
 * This script uploads the logo to be used in email templates
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sirenedImageBucket } from '../server/services/sirened-image-bucket';

// Get current file directory (ES module equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function uploadLogo() {
  try {
    // Path to the logo file
    const logoPath = path.join(__dirname, '../client/src/public/images/sirenedlogo2.png');
    
    // Read the file
    const fileBuffer = fs.readFileSync(logoPath);
    
    // Create a file object similar to what multer would create
    const file = {
      fieldname: 'image',
      originalname: 'sirenedlogo2.png',
      encoding: '7bit',
      mimetype: 'image/png',
      buffer: fileBuffer,
      size: fileBuffer.length
    };
    
    // Upload to SirenedImageBucket using 'custom' type
    const storageKey = await sirenedImageBucket.uploadBookImage(file, 'custom');
    
    // Get the public URL
    const publicUrl = sirenedImageBucket.getPublicUrl(storageKey);
    
    console.log('Logo uploaded successfully!');
    console.log('Storage Key:', storageKey);
    console.log('Public URL:', publicUrl);
    
    return { storageKey, publicUrl };
  } catch (error) {
    console.error('Error uploading logo:', error);
    throw error;
  }
}

// Self-invoke function for direct execution
uploadLogo()
  .then(result => {
    console.log('Upload completed.');
  })
  .catch(error => {
    console.error('Upload failed:', error);
    process.exit(1);
  });

export { uploadLogo };