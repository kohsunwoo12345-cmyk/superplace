async function testSubscription() {
  console.log('\n🔍 Testing Subscription Data\n');
  
  // Login
  const loginRes = await fetch('https://superplacestudy.pages.dev/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@superplace.com',
      password: 'admin1234'
    })
  });
  
  const loginData = await loginRes.json();
  console.log(`✅ Login: ${loginData.user.role}`);
  console.log(`   User ID: ${loginData.user.id}`);
  console.log(`   Academy ID: ${loginData.user.academyId || 'null'}`);
  
  // Check subscription
  console.log('\n📊 Checking Subscription...');
  const subRes = await fetch(`https://superplacestudy.pages.dev/api/subscription/check?userId=${loginData.user.id}`);
  const subData = await subRes.json();
  
  console.log(`Status: ${subRes.status}`);
  console.log(`Has Subscription: ${subData.hasSubscription}`);
  
  if (subData.subscription) {
    console.log('\n📋 Subscription Details:');
    console.log(`   Plan: ${subData.subscription.planName}`);
    console.log(`   Start: ${subData.subscription.startDate || subData.subscription.createdAt}`);
    console.log(`   End: ${subData.subscription.endDate}`);
    
    console.log('\n📊 Usage:');
    console.log(`   Students: ${subData.subscription.usage?.students || 0} / ${subData.subscription.limits?.maxStudents || 0}`);
    console.log(`   Homework Checks: ${subData.subscription.usage?.homeworkChecks || 0} / ${subData.subscription.limits?.maxHomeworkChecks || 0}`);
    console.log(`   AI Analysis: ${subData.subscription.usage?.aiAnalysis || 0} / ${subData.subscription.limits?.maxAIAnalysis || 0}`);
    console.log(`   Similar Problems: ${subData.subscription.usage?.similarProblems || 0} / ${subData.subscription.limits?.maxSimilarProblems || 0}`);
    console.log(`   Landing Pages: ${subData.subscription.usage?.landingPages || 0} / ${subData.subscription.limits?.maxLandingPages || 0}`);
  } else {
    console.log('\n❌ No subscription data returned');
    console.log('Response:', JSON.stringify(subData, null, 2));
  }
}

testSubscription().catch(console.error);
