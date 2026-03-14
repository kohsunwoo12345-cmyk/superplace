async function checkDeployment() {
  console.log('\n🔍 Checking Deployment Status\n');
  
  try {
    const res = await fetch('https://superplacestudy.pages.dev/api/admin/fix-null-botids');
    console.log(`Status: ${res.status}`);
    
    if (res.ok) {
      const data = await res.json();
      console.log('Response:', data);
      console.log('\n✅ API is ready!');
      return true;
    } else {
      console.log('❌ API not ready yet');
      return false;
    }
  } catch (e) {
    console.log('❌ Error:', e.message);
    return false;
  }
}

checkDeployment().catch(console.error);
