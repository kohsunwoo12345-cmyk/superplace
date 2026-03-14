async function testAdminLogin() {
  const API_BASE = 'https://superplacestudy.pages.dev';
  
  console.log('\n🔐 Testing Admin Login\n');
  
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@superplace.com',
        password: 'admin123'
      })
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    
    if (response.ok) {
      console.log('\n✅ Login successful!');
      console.log('User ID:', data.user.id);
      console.log('Email:', data.user.email);
      console.log('Role:', data.user.role);
      console.log('Token:', data.token);
      
      // Test user detail with real token
      console.log('\n📋 Testing user detail API...\n');
      
      const detailResponse = await fetch(`${API_BASE}/api/admin/users/${data.user.id}/detail`, {
        headers: {
          'Authorization': `Bearer ${data.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Detail response status:', detailResponse.status);
      const detailData = await detailResponse.json();
      
      if (detailResponse.ok) {
        console.log('✅ User detail retrieved successfully!');
        console.log('User:', detailData.data.user.name || detailData.data.user.email);
      } else {
        console.log('❌ User detail error:', detailData);
      }
      
    } else {
      console.log('❌ Login failed:', data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAdminLogin();
