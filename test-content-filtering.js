/**
 * Test script to verify content filtering in search and recommendations
 * 
 * This script:
 * 1. Creates a test user block
 * 2. Searches for books to verify filtering
 * 3. Gets recommendations to verify filtering
 * 4. Removes the test block
 */

import fetch from 'node-fetch';

async function testContentFiltering() {
  try {
    
    
    // Step 1: Get some books to choose one to block
    
    const booksResponse = await fetch('http://localhost:5000/api/search?q=the');
    const booksData = await booksResponse.json();
    
    if (!booksData.books || booksData.books.length === 0) {
      console.error("No books found to test with.");
      return;
    }
    
    const testBook = booksData.books[0];
    
    
    // Step 2: Create a user block for the selected book
    
    const createBlockResponse = await fetch('http://localhost:5000/api/filters', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        blockType: 'book',
        blockId: testBook.id,
        blockName: testBook.title
      })
    });
    
    if (!createBlockResponse.ok) {
      const errorText = await createBlockResponse.text();
      console.error(`Failed to create block: ${errorText}`);
      return;
    }
    
    const blockData = await createBlockResponse.json();
    
    
    // Step 3: Verify that the book is blocked in search results
    
    const filteredSearchResponse = await fetch('http://localhost:5000/api/search?q=the');
    const filteredSearchData = await filteredSearchResponse.json();
    
    const bookStillInResults = filteredSearchData.books.some(book => book.id === testBook.id);
    
    if (!bookStillInResults) {
      
      
      
    } else {
      console.error("❌ Failed: Blocked book still appears in search results");
    }
    
    // Step 4: Verify that book is blocked in recommendations
    
    const recommendationsResponse = await fetch('http://localhost:5000/api/recommendations');
    const recommendationsData = await recommendationsResponse.json();
    
    // Check if blocked book is in recommendations
    const bookInRecommendations = recommendationsData.some(book => book.id === testBook.id);
    
    if (!bookInRecommendations) {
      
    } else {
      console.error("❌ Failed: Blocked book still appears in recommendations");
    }
    
    // Step 5: Cleanup - Remove the test block
    
    const deleteResponse = await fetch(`http://localhost:5000/api/filters/${blockData.id}`, {
      method: 'DELETE'
    });
    
    if (deleteResponse.ok) {
      
    } else {
      console.error("❌ Failed to remove test block");
    }
    
    
  } catch (error) {
    console.error("Error during content filtering test:", error);
  }
}

testContentFiltering();