async function findDirector() {
  console.log('\n🔍 Finding Director Account\n');
  
  // Login as admin first
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
  
  // Get all users
  const usersRes = await fetch('https://superplacestudy.pages.dev/api/admin/users', {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  
  const usersData = await usersRes.json();
  
  // Find directors
  const directors = usersData.users.filter(u => u.role === 'DIRECTOR');
  
  console.log(`Found ${directors.length} directors:\n`);
  
  directors.forEach((dir, i) => {
    console.log(`${i+1}. ${dir.name || 'Unnamed'}`);
    console.log(`   Email: ${dir.email}`);
    console.log(`   ID: ${dir.id}`);
    console.log(`   Academy ID: ${dir.academyId || 'null'}`);
    console.log('');
  });
  
  // Test subscription for first director
  if (directors.length > 0) {
    const director = directors[0];
    console.log(`\n📊 Testing subscription for: ${director.name || director.email}`);
    
    const subRes = await fetch(`https://superplacestudy.pages.dev/api/subscription/check?userId=${director.id}`);
    const subData = await subRes.json();
    
    console.log(`   Has Subscription: ${subData.hasSubscription}`);
    
    if (subData.subscription) {
      console.log(`   Plan: ${subData.subscription.planName}`);
      console.log(`   Students: ${subData.subscription.usage?.students || 0}`);
      console.log(`   Landing Pages: ${subData.subscription.usage?.landingPages || 0}`);
    }
  }
}

findDirector().catch(console.error);
