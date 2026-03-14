async function fixNullBotIds() {
  console.log('\n🔧 Running botId Fix Migration\n');
  
  const res = await fetch('https://superplacestudy.pages.dev/api/admin/fix-null-botids', {
    method: 'POST'
  });
  
  const data = await res.json();
  console.log(`Status: ${res.status}`);
  console.log(`Result:`, data);
  console.log(`\n✅ Fixed: ${data.fixed || 0}`);
  console.log(`❌ Failed: ${data.failed || 0}`);
  console.log(`📊 Total: ${data.total || 0}\n`);
}

fixNullBotIds().catch(console.error);
