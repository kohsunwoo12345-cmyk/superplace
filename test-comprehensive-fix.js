const BASE_URL = 'https://superplacestudy.pages.dev';

async function runTests() {
  console.log('🧪 Comprehensive System Test\n');
  
  // Login
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@superplace.com',
      password: 'admin1234'
    })
  });
  const { token } = await loginRes.json();
  console.log('✅ Logged in\n');
  
  // TEST 1: Subscription with usage counts
  console.log('📊 TEST 1: Subscription & Usage Counts');
  console.log('═══════════════════════════════════════');
  
  const subRes = await fetch(`${BASE_URL}/api/subscription/check?academyId=academy-1771479246368-5viyubmqk`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const subData = await subRes.json();
  console.log('Status:', subRes.status);
  console.log('Has Subscription:', subData.hasSubscription);
  
  if (subData.subscription) {
    console.log('Plan:', subData.subscription.planName);
    console.log('Status:', subData.subscription.status);
    console.log('\nUsage:');
    const usage = subData.subscription.usage || {};
    console.log('  Students:', usage.students || '❌ Missing');
    console.log('  Homework:', usage.homeworkChecks || '❌ Missing');
    console.log('  AI Analysis:', usage.aiAnalysis || '❌ Missing');
    console.log('  Landing Pages:', usage.landingPages || '❌ Missing');
    
    if (usage.students) {
      console.log('\n✅ Usage counts working');
    } else {
      console.log('\n❌ Usage counts missing');
    }
  } else {
    console.log('❌ No subscription found');
  }
  
  // TEST 2: SMS Sender Numbers
  console.log('\n\n📞 TEST 2: SMS Sender Numbers');
  console.log('═══════════════════════════════════════');
  
  const sendersRes = await fetch(`${BASE_URL}/api/admin/sms/senders`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  console.log('Status:', sendersRes.status);
  
  if (sendersRes.status === 200) {
    const sendersData = await sendersRes.json();
    console.log('Approved Senders:', sendersData.senders?.length || 0);
    console.log('\n✅ SMS senders API working');
  } else {
    const errorData = await sendersRes.json();
    console.log('Error:', errorData);
    console.log('\n❌ SMS senders API failing');
  }
  
  // TEST 3: Point Approval Status
  console.log('\n\n💰 TEST 3: Point System');
  console.log('═══════════════════════════════════════');
  
  // Check academy points
  const acadRes = await fetch(`${BASE_URL}/api/admin/academies?id=academy-1771479246368-5viyubmqk`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const acadData = await acadRes.json();
  console.log('Academy:', acadData.name);
  console.log('SMS Points:', acadData.smsPoints);
  
  if (typeof acadData.smsPoints === 'number') {
    console.log('\n✅ Points system working');
  } else {
    console.log('\n❌ Points system broken');
  }
  
  // Summary
  console.log('\n\n═══════════════════════════════════════');
  console.log('📋 SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log('1. Usage Counts:', subData.subscription?.usage ? '✅' : '❌');
  console.log('2. SMS Senders:', sendersRes.status === 200 ? '✅' : '❌');
  console.log('3. Points System:', typeof acadData.smsPoints === 'number' ? '✅' : '❌');
}

runTests().catch(console.error);
