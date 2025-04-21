/**
 * Test script to verify object storage functionality
 * Run using: npx tsx test-object-storage.ts
 */

import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { Readable } from 'stream';
// Using undici's FormData which is available in modern Node.js
import { FormData } from 'undici';

async function testObjectStorage() {
  try {
    console.log('Testing Object Storage functionality...');
    
    // Upload a test profile image
    console.log('Uploading a test profile image...');
    
    // Read a test image file (using the default bookshelf cover as test data)
    const testImagePath = './public/images/default-bookshelf-cover.svg';
    const fileBuffer = fs.readFileSync(testImagePath);
    
    // Create form data for upload
    const formData = new FormData();
    formData.append('profileImage', fileBuffer, {
      filename: 'test-profile.svg',
      contentType: 'image/svg+xml'
    });
    
    // Upload the image using the user profile image endpoint
    const uploadResponse = await fetch('http://localhost:3000/api/user/profile-image', {
      method: 'POST',
      body: formData as any,
      headers: {
        // Add any necessary auth cookies if needed for authenticated endpoints
      }
    });
    
    if (!uploadResponse.ok) {
      console.error('Error uploading test image:', await uploadResponse.text());
      return;
    }
    
    const uploadResult = await uploadResponse.json();
    console.log('Upload successful:', uploadResult);
    
    // Test retrieving the image
    if (uploadResult.profileImageUrl) {
      console.log('Testing image retrieval from:', uploadResult.profileImageUrl);
      const retrieveResponse = await fetch(`http://localhost:3000${uploadResult.profileImageUrl}`);
      
      if (!retrieveResponse.ok) {
        console.error('Error retrieving image:', await retrieveResponse.text());
        return;
      }
      
      console.log('Image retrieval successful!');
      console.log('Content-Type:', retrieveResponse.headers.get('content-type'));
      console.log('Content-Length:', retrieveResponse.headers.get('content-length'));
      
      // Save the retrieved image for comparison
      const retrievedImageBuffer = await retrieveResponse.arrayBuffer();
      fs.writeFileSync('./test-retrieved-image.svg', Buffer.from(retrievedImageBuffer));
      console.log('Retrieved image saved to ./test-retrieved-image.svg');
      
      // Compare original and retrieved images
      const originalSize = fileBuffer.length;
      const retrievedSize = Buffer.from(retrievedImageBuffer).length;
      console.log('Original image size:', originalSize);
      console.log('Retrieved image size:', retrievedSize);
      
      if (originalSize === retrievedSize) {
        console.log('✅ Images match in size!');
      } else {
        console.log('⚠️ Images differ in size!');
      }
    }
    
    console.log('Object Storage test completed!');
  } catch (error) {
    console.error('Error testing object storage:', error);
  }
}

// Run the test
testObjectStorage();