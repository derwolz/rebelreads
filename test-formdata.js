/**
 * A simple test script to verify that FormData works correctly
 * Run with: node --experimental-fetch test-formdata.js
 */

async function testFormData() {
  try {
    console.log('Testing FormData API...');
    
    // Check if FormData is available
    console.log('FormData available in global context:', typeof globalThis.FormData);
    
    // Create a simple FormData object
    const formData = new FormData();
    formData.append('text', 'Hello World');
    
    // Create a simple Blob and add it to FormData
    const blob = new Blob(['Test content'], { type: 'text/plain' });
    formData.append('file', blob, 'test.txt');
    
    console.log('FormData created successfully with:');
    console.log('- Text field');
    console.log('- File field (from Blob)');
    
    console.log('\nFormData test completed successfully!');
  } catch (error) {
    console.error('Error testing FormData:', error);
  }
}

// Run the test
testFormData().catch(console.error);