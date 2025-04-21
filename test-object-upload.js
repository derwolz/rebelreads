/**
 * Simple test script for the object storage service.
 * Run with: node test-object-upload.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ObjectStorageService } from './server/services/object-storage';

// Get current file's directory (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testObjectStorage() {
  try {
    console.log('Starting object storage test...');
    
    // Create a test storage service
    const storage = new ObjectStorageService();
    
    // Test file path
    const testFilePath = path.join(__dirname, 'package.json');
    
    // Read test file
    console.log(`Reading test file: ${testFilePath}`);
    const fileBuffer = fs.readFileSync(testFilePath);
    
    // Upload to storage
    console.log('Uploading test file to storage...');
    const storageKey = await storage.uploadBuffer(fileBuffer, 'test-file.json', 'test');
    console.log(`File uploaded with storage key: ${storageKey}`);
    
    // Get public URL
    const publicUrl = storage.getPublicUrl(storageKey);
    console.log(`Public URL: ${publicUrl}`);
    
    // Check if file exists
    const exists = await storage.fileExists(storageKey);
    console.log(`File exists in storage: ${exists}`);
    
    // List all files in the test directory
    const files = await storage.listFiles('test');
    console.log('Files in test directory:');
    console.log(files);
    
    // Get file
    console.log('Reading file from storage...');
    const { contentType, stream } = await storage.getFile(storageKey);
    console.log(`Content type: ${contentType}`);
    
    // Read the stream into a buffer
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    console.log(`Retrieved file size: ${buffer.length} bytes`);
    
    // Compare sizes
    console.log(`Original file size: ${fileBuffer.length} bytes`);
    console.log(`Storage file size: ${buffer.length} bytes`);
    console.log(`Files match: ${fileBuffer.length === buffer.length}`);
    
    // Clean up
    console.log('Deleting test file...');
    const deleteResult = await storage.deleteFile(storageKey);
    console.log(`File deletion result: ${deleteResult}`);
    
    console.log('Object storage test completed successfully!');
  } catch (error) {
    console.error('Error in object storage test:', error);
  }
}

// Run the test
testObjectStorage();