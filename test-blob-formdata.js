/**
 * A test script that verifies FormData and Blob functionality
 * Run with: node --experimental-fetch test-blob-formdata.js
 */

import fs from 'fs';
import path from 'path';

// Test file path
const TEST_IMAGE_PATH = './public/images/default-bookshelf-cover.svg';

async function testBlobFormData() {
  try {
    console.log('\n========= Blob and FormData Test =========\n');
    
    // Check if test file exists
    console.log('Checking if test file exists...');
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      console.error(`Test file not found at: ${TEST_IMAGE_PATH}`);
      return;
    }
    
    // Read file content
    const fileBuffer = fs.readFileSync(TEST_IMAGE_PATH);
    console.log(`✓ Loaded file: ${TEST_IMAGE_PATH} (size: ${fileBuffer.length} bytes)`);
    
    // Test Blob creation
    console.log('\nCreating a Blob from the file...');
    const blob = new Blob([fileBuffer], { type: 'image/svg+xml' });
    console.log(`✓ Created Blob (size: ${blob.size} bytes, type: ${blob.type})`);
    
    // Test FormData creation and file append
    console.log('\nCreating FormData and appending the Blob...');
    const formData = new FormData();
    formData.append('file', blob, path.basename(TEST_IMAGE_PATH));
    formData.append('textField', 'This is a text field');
    console.log('✓ Created FormData with file and text field');
    
    // Verify FormData entries
    console.log('\nEnumerating FormData entries:');
    if (typeof formData[Symbol.iterator] === 'function') {
      for (const [fieldName, value] of formData.entries()) {
        if (value instanceof Blob) {
          console.log(`- Field: ${fieldName}, Type: Blob, Size: ${value.size} bytes, Content-Type: ${value.type}`);
        } else {
          console.log(`- Field: ${fieldName}, Value: ${value}`);
        }
      }
    } else {
      console.log('FormData is not iterable in this environment');
    }
    
    console.log('\n✓ Blob and FormData test completed successfully\n');
  } catch (error) {
    console.error('\n❌ Error during Blob/FormData test:', error);
  }
}

// Run the test
testBlobFormData().catch(console.error);