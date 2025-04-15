import fetch from 'node-fetch';

async function testAuthentication() {
  try {
    // Step 1: Login to get a session
    const loginResponse = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'der.wolz@gmail.com',
        password: '1cbe1492AB'
      }),
      credentials: 'include'
    });
    
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('Login response status:', loginResponse.status);
    console.log('Cookies:', cookies);
    
    // Step 2: Try to access the protected publisher genres endpoint
    const publisherGenresResponse = await fetch('http://localhost:5000/api/catalogue/genres/publisher', {
      headers: {
        Cookie: cookies
      },
      credentials: 'include'
    });
    
    console.log('Publisher genres response status:', publisherGenresResponse.status);
    
    // Also test the author genres endpoint
    const authorGenresResponse = await fetch('http://localhost:5000/api/catalogue/genres/author', {
      headers: {
        Cookie: cookies
      },
      credentials: 'include'
    });
    
    console.log('Author genres response status:', authorGenresResponse.status);
    
    if (publisherGenresResponse.ok) {
      const data = await publisherGenresResponse.json();
      console.log('Publisher genres data:', JSON.stringify(data, null, 2));
    } else {
      console.log('Publisher genres error:', await publisherGenresResponse.text());
    }
    
    if (authorGenresResponse.ok) {
      const data = await authorGenresResponse.json();
      console.log('Author genres data:', JSON.stringify(data, null, 2));
    } else {
      console.log('Author genres error:', await authorGenresResponse.text());
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testAuthentication();