const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('Testing API...');
    const response = await fetch('https://superplace-study.vercel.app/api/admin/bots-unified?search=&folderId=all&sortBy=createdAt&sortOrder=desc', {
      headers: {
        'Cookie': 'next-auth.session-token=YOUR_SESSION_TOKEN'
      }
    });
    
    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response:', text.substring(0, 500));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
