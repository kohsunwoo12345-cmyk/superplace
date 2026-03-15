async function testAcademy() {
  console.log('\n🔍 Testing Specific Academy: academy-1771479246368-5viyubmqk (고희준)\n');
  
  const ACADEMY_ID = 'academy-1771479246368-5viyubmqk';
  const USER_ID = 'user-1771479246368-du957iw33';
  
  // Test subscription
  const subRes = await fetch(`https://superplacestudy.pages.dev/api/subscription/check?userId=${USER_ID}&academyId=${ACADEMY_ID}`);
  const subData = await subRes.json();
  
  console.log('📊 Subscription Status:');
  console.log(`   Has Subscription: ${subData.hasSubscription}`);
  
  if (subData.subscription) {
    console.log(`\n📋 Plan: ${subData.subscription.planName}`);
    console.log(`   Status: ${subData.subscription.status}`);
    console.log(`   Start: ${subData.subscription.startDate || subData.subscription.createdAt}`);
    console.log(`   End: ${subData.subscription.endDate}`);
    
    console.log('\n📊 Usage (from API):');
    console.log(`   Students: ${subData.subscription.usage?.students || 0} / ${subData.subscription.limits?.maxStudents || 0}`);
    console.log(`   Homework: ${subData.subscription.usage?.homeworkChecks || 0} / ${subData.subscription.limits?.maxHomeworkChecks || 0}`);
    console.log(`   AI Analysis: ${subData.subscription.usage?.aiAnalysis || 0} / ${subData.subscription.limits?.maxAIAnalysis || 0}`);
    console.log(`   Similar Problems: ${subData.subscription.usage?.similarProblems || 0} / ${subData.subscription.limits?.maxSimilarProblems || 0}`);
    console.log(`   Landing Pages: ${subData.subscription.usage?.landingPages || 0} / ${subData.subscription.limits?.maxLandingPages || 0}`);
  }
}

testAcademy().catch(console.error);
