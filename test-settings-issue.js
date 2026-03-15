const BASE_URL = 'https://superplacestudy.pages.dev';

// Test with the academy that has subscription
async function testKkumeAcademy() {
  console.log('🔍 Testing 꾸메땅학원 (academy-1771479246368-5viyubmqk)');
  
  // Login as admin
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@superplace.com',
      password: 'admin1234'
    })
  });
  const { token } = await loginRes.json();
  
  // Check subscription
  const subRes = await fetch(`${BASE_URL}/api/subscription/check?academyId=academy-1771479246368-5viyubmqk`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  console.log('Subscription API Status:', subRes.status);
  const subData = await subRes.json();
  
  console.log('\n📊 Subscription Data:');
  console.log(JSON.stringify(subData, null, 2));
  
  // Check academy data
  const acadRes = await fetch(`${BASE_URL}/api/admin/academies?id=academy-1771479246368-5viyubmqk`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const acadData = await acadRes.json();
  
  console.log('\n🏫 Academy Data:');
  console.log('SMS Points:', acadData.smsPoints);
  console.log('Sender Number:', acadData.senderNumber || 'Not set');
  console.log('Registered Sender Numbers:', acadData.registeredSenderNumbers || 'None');
}

testKkumeAcademy().catch(console.error);
