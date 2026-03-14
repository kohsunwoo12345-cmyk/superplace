async function checkUsers() {
  const API_BASE = 'https://superplacestudy.pages.dev';
  const token = 'admin-001|admin@superplace.kr|SUPER_ADMIN';
  
  console.log('\n📋 Checking users in database\n');
  
  try {
    // Try to get all users
    const response = await fetch(`${API_BASE}/api/admin/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Total users:', data.users?.length || 0);
      
      if (data.users && data.users.length > 0) {
        console.log('\nFirst 5 users:');
        data.users.slice(0, 5).forEach((user, i) => {
          console.log(`${i+1}. ${user.email} (${user.id}) - Role: ${user.role}`);
        });
        
        // Check for admin user
        const adminUser = data.users.find(u => u.email === 'admin@superplace.kr');
        if (adminUser) {
          console.log('\n✅ Found admin user:', adminUser);
        } else {
          console.log('\n❌ Admin user (admin@superplace.kr) not found');
        }
      }
    } else {
      const errorData = await response.json();
      console.log('Error:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUsers();
