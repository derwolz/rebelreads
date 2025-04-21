/**
 * Test script to verify object storage functionality
 * Run using: node --experimental-fetch test-object-storage.js
 */

import fs from 'fs';
import path from 'path';
// Use built-in Fetch API with global FormData
// Note: Must run with --experimental-fetch flag

// URL constants for testing
const API_URL = 'http://localhost:3000';
const PROFILE_IMAGE_UPLOAD_URL = `${API_URL}/api/user/profile-image`;
const BOOK_IMAGE_UPLOAD_URL = `${API_URL}/api/books/update-image`;
const TEST_IMAGE_PATH = './public/images/default-bookshelf-cover.svg';

async function testObjectStorage() {
  try {
    console.log('\n========= Object Storage Test =========\n');
    
    console.log('Checking if test image exists...');
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      console.error(`Test image not found at: ${TEST_IMAGE_PATH}`);
      return;
    }
    console.log('✓ Test image found');
    
    // Test 1: Upload a profile image
    console.log('\nTEST 1: Upload a profile image');
    console.log('-----------------------------------');
    const profileImageResult = await uploadProfileImage(TEST_IMAGE_PATH);
    console.log('Profile image uploaded:');
    console.log(`  URL: ${profileImageResult.profileImageUrl}`);
    
    // Test 2: Upload a book cover image
    console.log('\nTEST 2: Upload a book cover image');
    console.log('-----------------------------------');
    const bookImageResult = await uploadBookImage(TEST_IMAGE_PATH, 'book-detail', 1);
    console.log('Book image uploaded:');
    console.log(`  URL: ${bookImageResult.imageUrl}`);
    console.log(`  Type: ${bookImageResult.imageType}`);
    
    // Test 3: Verify images are accessible
    console.log('\nTEST 3: Verify images are accessible');
    console.log('-----------------------------------');
    await verifyImageAccess(profileImageResult.profileImageUrl, 'Profile image');
    await verifyImageAccess(bookImageResult.imageUrl, 'Book image');
    
    console.log('\n✓ Object storage tests completed successfully\n');
  } catch (error) {
    console.error('\n❌ Error during object storage test:', error.message);
  }
}

async function uploadProfileImage(imagePath) {
  console.log(`Uploading profile image from: ${imagePath}`);
  
  // Create a FormData instance
  const formData = new FormData();
  // Read the file and create a Blob from it
  const fileBuffer = fs.readFileSync(imagePath);
  const blob = new Blob([fileBuffer], { type: 'image/svg+xml' });
  formData.append('profileImage', blob, path.basename(imagePath));
  
  // Send the request
  const response = await fetch(PROFILE_IMAGE_UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to upload profile image: ${response.status} ${response.statusText} - ${text}`);
  }
  
  return response.json();
}

async function uploadBookImage(imagePath, imageType, bookId) {
  console.log(`Uploading book image (${imageType}) from: ${imagePath}`);
  
  // Create a FormData instance
  const formData = new FormData();
  formData.append(`bookImage_${imageType}`, fs.createReadStream(imagePath));
  formData.append('bookId', bookId);
  
  // Send the request
  const response = await fetch(BOOK_IMAGE_UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to upload book image: ${response.status} ${response.statusText} - ${text}`);
  }
  
  return response.json();
}

async function verifyImageAccess(imageUrl, description) {
  console.log(`Verifying access to ${description}: ${imageUrl}`);
  
  // Check if the URL is accessible
  const response = await fetch(imageUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to access ${description}: ${response.status} ${response.statusText}`);
  }
  
  const contentType = response.headers.get('content-type') || 'unknown';
  const contentLength = response.headers.get('content-length') || 'unknown';
  
  console.log(`✓ ${description} is accessible`);
  console.log(`  Content-Type: ${contentType}`);
  console.log(`  Content-Length: ${contentLength} bytes`);
  
  return true;
}

// Run the tests
testObjectStorage().catch(console.error);