const fetch = require('node-fetch');

async function checkBackupTables() {
  // 1. homework_gradings_v2_backup_20260314
  console.log('=== homework_gradings_v2_backup_20260314 ===');
  const backupGradingUrl = 'https://superplacestudy.pages.dev/api/debug-users?sql=' + 
    encodeURIComponent('SELECT COUNT(*) as count FROM homework_gradings_v2_backup_20260314');
  const backupGradingRes = await fetch(backupGradingUrl);
  const backupGradingData = await backupGradingRes.json();
  console.log('총 개수:', backupGradingData.users?.results?.[0]?.count || 0);
  
  // 샘플
  const sampleUrl = 'https://superplacestudy.pages.dev/api/debug-users?sql=' + 
    encodeURIComponent('SELECT * FROM homework_gradings_v2_backup_20260314 LIMIT 3');
  const sampleRes = await fetch(sampleUrl);
  const sampleData = await sampleRes.json();
  console.log('샘플:', JSON.stringify(sampleData.users?.results || [], null, 2));
  
  // 2. homework_submissions_v2_backup_20260314
  console.log('\n=== homework_submissions_v2_backup_20260314 ===');
  const backupSubUrl = 'https://superplacestudy.pages.dev/api/debug-users?sql=' + 
    encodeURIComponent('SELECT COUNT(*) as count FROM homework_submissions_v2_backup_20260314');
  const backupSubRes = await fetch(backupSubUrl);
  const backupSubData = await backupSubRes.json();
  console.log('총 개수:', backupSubData.users?.results?.[0]?.count || 0);
  
  // 샘플
  const subSampleUrl = 'https://superplacestudy.pages.dev/api/debug-users?sql=' + 
    encodeURIComponent('SELECT * FROM homework_submissions_v2_backup_20260314 LIMIT 3');
  const subSampleRes = await fetch(subSampleUrl);
  const subSampleData = await subSampleRes.json();
  console.log('샘플:', JSON.stringify(subSampleData.users?.results || [], null, 2));
}

checkBackupTables();
