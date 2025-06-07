const axios = require('axios');

async function testRegistration() {
  try {
    const response = await axios.post('http://localhost:4000/api/auth/register', {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Test123!@#'
    });
    
    console.log('Registration successful:', response.data);
  } catch (error) {
    console.error('Registration failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Wait a bit for server to start, then test
setTimeout(testRegistration, 2000);