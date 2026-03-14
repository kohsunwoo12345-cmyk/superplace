async function runMigration() {
  const API_BASE = 'https://superplacestudy.pages.dev';
  
  console.log('\n🔧 Running Bot Migration\n');
  
  try {
    const response = await fetch(`${API_BASE}/api/admin/migrate-missing-bots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    
    if (response.ok) {
      console.log('\n✅ Migration completed successfully!');
      console.log(`\nResults:`);
      console.log(`  - Created: ${data.created} bots`);
      console.log(`  - Skipped (already exists): ${data.skipped} bots`);
      console.log(`  - Total products with botId: ${data.total}`);
    } else {
      console.log('\n❌ Migration failed:');
      console.log(data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

runMigration();
