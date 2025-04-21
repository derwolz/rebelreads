/**
 * Test script to verify Replit Object Storage functionality
 * Run with: npx tsx test-replit-storage.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { objectStorage } from './server/services/object-storage.js';

// Get current file's directory (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testReplitObjectStorage() {
  try {
    console.log('Starting Replit Object Storage test...');
    
    // Test file path
    const testFilePath = path.join(__dirname, 'package.json');
    
    // Read test file
    console.log(`Reading test file: ${testFilePath}`);
    const fileBuffer = fs.readFileSync(testFilePath);
    
    // Upload to storage
    console.log('Uploading test file to storage...');
    const storageKey = await objectStorage.uploadBuffer(fileBuffer, 'test-file.json', 'test');
    console.log(`File uploaded with storage key: ${storageKey}`);
    
    // Get public URL
    const publicUrl = objectStorage.getPublicUrl(storageKey);
    console.log(`Public URL: ${publicUrl}`);
    
    // Check if file exists
    const exists = await objectStorage.fileExists(storageKey);
    console.log(`File exists in storage: ${exists}`);
    
    // Test completed
    console.log('Replit Object Storage test completed successfully!');
  } catch (error) {
    console.error('Error in object storage test:', error);
  }
}

// Run the test
testReplitObjectStorage();