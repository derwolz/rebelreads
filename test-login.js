import fetch from 'node-fetch';

async function testAuthentication() {
  try {
    // Step 1: Login to get a session
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
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
    
    // Step 2: Try to access the protected endpoint with the session cookie
    const bookGenresResponse = await fetch('http://localhost:5000/api/catalogue/book-genres', {
      headers: {
        Cookie: cookies
      },
      credentials: 'include'
    });
    
    console.log('Book genres response status:', bookGenresResponse.status);
    
    const data = await bookGenresResponse.json();
    console.log('Book genres data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testAuthentication();