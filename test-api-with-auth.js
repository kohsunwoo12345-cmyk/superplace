const fetch = require('node-fetch');

async function testAPI() {
  // 1. 로그인
  console.log('1. 로그인 시도...');
  const loginRes = await fetch('https://superplace-study.vercel.app/api/auth/callback/credentials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'admin@superplace.com',
      password: 'SuperAdmin2024!',
    }),
  });
  
  console.log('로그인 상태:', loginRes.status);
  const cookies = loginRes.headers.raw()['set-cookie'];
  console.log('쿠키:', cookies);
  
  // 2. 세션 쿠키로 API 호출
  if (cookies) {
    console.log('\n2. API 호출 (인증됨)...');
    const apiRes = await fetch('https://superplace-study.vercel.app/api/admin/users', {
      headers: {
        'Cookie': cookies.join('; '),
      },
    });
    
    console.log('API 상태:', apiRes.status);
    const data = await apiRes.json();
    console.log('API 응답:', JSON.stringify(data, null, 2));
  }
}

testAPI().catch(console.error);
