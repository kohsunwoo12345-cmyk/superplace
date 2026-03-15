async function findRealUser() {
  console.log('\n🔍 Finding Real User in Database\n');
  
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
  
  // Get all users
  const usersRes = await fetch('https://superplacestudy.pages.dev/api/admin/users', {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  
  const usersData = await usersRes.json();
  console.log(`Total users: ${usersData.users.length}`);
  
  // Find first 5 students
  const students = usersData.users.filter(u => u.role === 'STUDENT').slice(0, 5);
  
  console.log('\nFirst 5 students:');
  students.forEach((s, i) => {
    console.log(`${i+1}. ${s.name || 'Unnamed'} - ID: ${s.id} - Email: ${s.email}`);
  });
  
  if (students.length > 0) {
    const testUserId = students[0].id;
    console.log(`\n📝 Testing with user ID: ${testUserId}`);
    
    const detailRes = await fetch(`https://superplacestudy.pages.dev/api/admin/users/${testUserId}/detail`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    
    console.log(`Response: ${detailRes.status}`);
    
    if (detailRes.ok) {
      const detailData = await detailRes.json();
      console.log(`✅ Success! User: ${detailData.data?.user?.name}`);
    } else {
      const errorData = await detailRes.json();
      console.log(`❌ Error: ${errorData.error}`);
    }
  }
}

findRealUser().catch(console.error);
