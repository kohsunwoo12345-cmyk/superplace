async function testUserDetailDebug() {
  console.log('\n🔍 User Detail API Debug\n');
  
  const USER_ID = 'user-1771479246368-du957iw33';
  
  // Login as admin
  const loginRes = await fetch('https://superplacestudy.pages.dev/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@superplace.com',
      password: 'admin1234'
    })
  });
  
  const loginData = await loginRes.json();
  const TOKEN = loginData.token;
  
  console.log(`Token: ${TOKEN}`);
  console.log(`Target User ID: ${USER_ID}`);
  
  // Test API
  console.log(`\nCalling: /api/admin/users/${USER_ID}/detail`);
  
  const res = await fetch(`https://superplacestudy.pages.dev/api/admin/users/${USER_ID}/detail`, {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  
  console.log(`\nResponse Status: ${res.status}`);
  console.log(`Response Headers:`, Object.fromEntries(res.headers.entries()));
  
  const data = await res.text();
  console.log(`\nResponse Body:`, data);
  
  try {
    const jsonData = JSON.parse(data);
    console.log(`\nParsed JSON:`, JSON.stringify(jsonData, null, 2));
  } catch (e) {
    console.log(`\n❌ Not valid JSON`);
  }
}

testUserDetailDebug().catch(console.error);
