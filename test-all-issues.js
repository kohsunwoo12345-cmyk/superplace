const https = require('https');

const BASE_URL = 'https://superplacestudy.pages.dev';

// Admin login
async function login() {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@superplace.com',
      password: 'admin1234'
    })
  });
  
  const data = await res.json();
  console.log('✅ Login:', data.user.role);
  return data.token;
}

// Test 1: Check subscription/usage
async function testSubscription(token) {
  console.log('\n📊 Test 1: Subscription & Usage');
  
  // Find a director
  const usersRes = await fetch(`${BASE_URL}/api/admin/users?role=DIRECTOR&limit=1`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const usersData = await usersRes.json();
  
  if (!usersData.users || usersData.users.length === 0) {
    console.log('❌ No directors found');
    return;
  }
  
  const director = usersData.users[0];
  console.log(`Testing with: ${director.name} (${director.email})`);
  console.log(`Academy ID: ${director.academyId}`);
  
  // Check subscription
  const subRes = await fetch(`${BASE_URL}/api/subscription/check?academyId=${director.academyId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const subData = await subRes.json();
  
  console.log('Subscription Plan:', subData.subscription?.planName || 'None');
  console.log('Usage:', JSON.stringify(subData.subscription?.usage || {}, null, 2));
  
  if (!subData.subscription?.usage?.students) {
    console.log('❌ Student count missing');
  } else {
    console.log('✅ Student count:', subData.subscription.usage.students);
  }
}

// Test 2: Check sender numbers
async function testSenderNumbers(token) {
  console.log('\n📞 Test 2: Sender Numbers');
  
  const res = await fetch(`${BASE_URL}/api/admin/sms/senders`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Response:', JSON.stringify(data, null, 2));
  
  if (data.senders && data.senders.length > 0) {
    console.log('✅ Approved senders:', data.senders.length);
  } else {
    console.log('❌ No approved sender numbers');
  }
}

// Test 3: Check point approval system
async function testPointApproval(token) {
  console.log('\n💰 Test 3: Point Approval');
  
  // Check point charge requests
  const res = await fetch(`${BASE_URL}/api/admin/point-charge-requests`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Response:', JSON.stringify(data, null, 2));
  
  if (data.requests) {
    console.log(`Found ${data.requests.length} point charge requests`);
    
    // Check if any are pending
    const pending = data.requests.filter(r => r.status === 'PENDING');
    console.log(`Pending requests: ${pending.length}`);
    
    if (pending.length > 0) {
      console.log('First pending request:', JSON.stringify(pending[0], null, 2));
    }
  }
}

// Run all tests
(async () => {
  try {
    const token = await login();
    await testSubscription(token);
    await testSenderNumbers(token);
    await testPointApproval(token);
    
    console.log('\n✅ All tests completed');
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
})();
