// Test user detail API
async function testUserDetailAPI() {
  const API_BASE = 'https://superplacestudy.pages.dev';
  
  // Get token from localStorage simulation
  const token = 'admin-001|admin@superplace.kr|SUPER_ADMIN|academy-1771479246368-5viyubmqk';
  const userId = 'user-1771479230301-6y6omq1ci';
  
  console.log('\n🔍 Testing User Detail API\n');
  console.log('Token:', token);
  console.log('User ID:', userId);
  
  try {
    const response = await fetch(`${API_BASE}/api/admin/users/${userId}/detail`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\nResponse status:', response.status);
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testUserDetailAPI();
