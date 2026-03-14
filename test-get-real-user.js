async function getRealUser() {
  const API_BASE = 'https://superplacestudy.pages.dev';
  
  // Try to login and get real user data
  try {
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@superplace.kr',
        password: 'admin123'
      })
    });
    
    console.log('Login response:', loginResponse.status);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('\n✅ Login successful!');
      console.log('User:', loginData.user);
      console.log('Token:', loginData.token);
      
      // Now try to get user detail
      const userDetailResponse = await fetch(`${API_BASE}/api/admin/users/${loginData.user.id}/detail`, {
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('\nUser detail response:', userDetailResponse.status);
      const detailData = await userDetailResponse.json();
      console.log('Detail data:', JSON.stringify(detailData, null, 2));
    } else {
      const errorData = await loginResponse.json();
      console.log('Login error:', errorData);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

getRealUser();
