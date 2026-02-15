// Test script to check students table data

async function testQuery() {
  const response = await fetch('https://superplacestudy.pages.dev/api/admin/users/157', {
    headers: {
      'Authorization': 'Bearer test'
    }
  });
  
  const data = await response.json();
  console.log('Student data:', JSON.stringify(data, null, 2));
}

testQuery();
