async function testAcademyInfo() {
  console.log('\n🏫 Testing Academy Information\n');
  
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
  
  // Get specific academy
  const ACADEMY_ID = 'academy-1771479246368-5viyubmqk';
  
  const academyRes = await fetch(`https://superplacestudy.pages.dev/api/admin/academies/${ACADEMY_ID}`, {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  
  if (academyRes.ok) {
    const academyData = await academyRes.json();
    console.log('Academy Details:');
    console.log(JSON.stringify(academyData, null, 2));
  } else {
    console.log(`Failed: ${academyRes.status}`);
    
    // Try list all academies
    console.log('\nTrying to list all academies...');
    const allAcademiesRes = await fetch('https://superplacestudy.pages.dev/api/admin/academies', {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    
    if (allAcademiesRes.ok) {
      const allData = await allAcademiesRes.json();
      const target = allData.academies.find(a => a.id === ACADEMY_ID);
      
      if (target) {
        console.log('\nFound Academy:');
        console.log(`   Name: ${target.name}`);
        console.log(`   Points: ${target.smsPoints || target.points || 0}`);
        console.log(`   Sender Number: ${target.senderNumber || 'Not set'}`);
        console.log(`   Full Data:`, target);
      }
    }
  }
}

testAcademyInfo().catch(console.error);
