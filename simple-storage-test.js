// Simple script to test object storage functionality
import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

// Simple implementation to test basic file operations
async function testStorage() {
  try {
    console.log('Starting simple storage test...');
    
    // Create test directories if they don't exist
    const storageDir = './uploads/object-storage';
    const testDir = path.join(storageDir, 'test');
    
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
      console.log(`Created storage directory: ${storageDir}`);
    }
    
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
      console.log(`Created test directory: ${testDir}`);
    }
    
    // Create a test file
    const testData = JSON.stringify({ test: "data", timestamp: new Date().toISOString() }, null, 2);
    const uniqueId = nanoid(8);
    const filename = `test-${uniqueId}.json`;
    const filePath = path.join(testDir, filename);
    
    console.log(`Writing test file to: ${filePath}`);
    fs.writeFileSync(filePath, testData);
    
    // Read the file back
    console.log(`Reading file: ${filePath}`);
    const readData = fs.readFileSync(filePath, 'utf8');
    console.log('File content:', readData);
    
    // List files in the test directory
    console.log(`Listing files in ${testDir}:`);
    const files = fs.readdirSync(testDir);
    console.log(files);
    
    // Delete the file
    console.log(`Deleting file: ${filePath}`);
    fs.unlinkSync(filePath);
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error in storage test:', error);
  }
}

// Run the test
testStorage();