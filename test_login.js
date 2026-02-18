const fetch = require('node-fetch');

async function testLogin() {
  console.log('🔐 Testing login...\n');
  
  try {
    const response = await fetch('https://superplacestudy.pages.dev/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@superplace.com',
        password: 'admin1234'
      })
    });
    
    console.log('📡 Response Status:', response.status);
    console.log('📡 Response Headers:', response.headers.raw());
    
    const data = await response.json();
    console.log('📦 Response Data:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n✅ 로그인 성공!');
    } else {
      console.log('\n❌ 로그인 실패:', data.message);
    }
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

testLogin();
