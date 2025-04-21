/**
 * Test script to verify object storage functionality
 * Run using: node test-object-storage.js
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

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
    formData.append('profileImage', new Blob([fileBuffer]), 'test-profile.svg');
    
    // Upload the image using the user profile image endpoint
    const uploadResponse = await fetch('http://localhost:3000/api/user/profile-image', {
      method: 'POST',
      body: formData,
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
      const retrievedImageBuffer = await retrieveResponse.buffer();
      fs.writeFileSync('./test-retrieved-image.svg', retrievedImageBuffer);
      console.log('Retrieved image saved to ./test-retrieved-image.svg');
      
      // Compare original and retrieved images
      const originalSize = fileBuffer.length;
      const retrievedSize = retrievedImageBuffer.length;
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