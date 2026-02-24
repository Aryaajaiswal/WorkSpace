const axios = require('axios');

async function testAPI() {
  const baseURL = 'http://localhost:5000/api';
  
  try {
    // Test login
    console.log('Testing login...');
    const loginRes = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@wissen.com',
      password: 'admin123'
    });
    console.log('Login success:', loginRes.data);
    
    const token = loginRes.data.token;
    
    // Test settings with auth
    console.log('\nTesting settings (with auth)...');
    const settingsRes = await axios.get(`${baseURL}/settings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Settings:', settingsRes.data);
    
    // Test bulk update
    console.log('\nTesting bulk update...');
    const updateRes = await axios.post(`${baseURL}/settings/bulk`, {
      settings: {
        company_name: 'Test Company',
        floater_booking_hour: '16'
      }
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Update success:', updateRes.data);
    
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
}

testAPI();
