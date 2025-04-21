/**
 * This script prepares the uploads directory for production deployment
 * 
 * It should be run during the build process to ensure that uploaded files
 * are correctly included in the production build and properly served.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Convert ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Define paths
const srcUploadsDir = path.join(rootDir, 'uploads');
const distDir = path.join(rootDir, 'dist');
const distUploadsDir = path.join(distDir, 'uploads');

console.log('Preparing uploads directory for production...');
console.log(`Source uploads: ${srcUploadsDir}`);
console.log(`Destination: ${distUploadsDir}`);

// Check if source uploads directory exists
if (!fs.existsSync(srcUploadsDir)) {
  console.log('Source uploads directory does not exist, creating empty directory');
  fs.mkdirSync(srcUploadsDir, { recursive: true });
}

// Create dist/uploads directory if it doesn't exist
if (!fs.existsSync(distUploadsDir)) {
  console.log('Creating dist/uploads directory');
  fs.mkdirSync(distUploadsDir, { recursive: true });
}

// Copy all subdirectories from uploads to dist/uploads
try {
  // Read the uploads directory
  const items = fs.readdirSync(srcUploadsDir);
  console.log(`Found ${items.length} items in uploads directory`);
  
  // Copy each item
  for (const item of items) {
    const srcPath = path.join(srcUploadsDir, item);
    const destPath = path.join(distUploadsDir, item);
    
    const stats = fs.statSync(srcPath);
    if (stats.isDirectory()) {
      console.log(`Copying directory: ${item}`);
      // Copy entire directory recursively
      copyDirectory(srcPath, destPath);
    } else {
      console.log(`Copying file: ${item}`);
      fs.copyFileSync(srcPath, destPath);
    }
  }
  
  console.log('✅ Successfully prepared uploads directory for production');
} catch (error) {
  console.error('Error preparing uploads directory:', error);
  process.exit(1);
}

/**
 * Recursively copy a directory and its contents
 */
function copyDirectory(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  // Read source directory
  const items = fs.readdirSync(src);
  
  // Copy each item
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    const stats = fs.statSync(srcPath);
    if (stats.isDirectory()) {
      // Recursively copy subdirectory
      copyDirectory(srcPath, destPath);
    } else {
      // Copy file
      fs.copyFileSync(srcPath, destPath);
    }
  }
}