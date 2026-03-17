const fetch = require('node-fetch');

async function checkAllTables() {
  // 1. homework_gradings (v1) 확인
  console.log('=== homework_gradings (v1) ===');
  const v1GradingUrl = 'https://superplacestudy.pages.dev/api/debug-users?sql=' + 
    encodeURIComponent('SELECT COUNT(*) as count FROM homework_gradings');
  const v1GradingRes = await fetch(v1GradingUrl);
  const v1GradingData = await v1GradingRes.json();
  console.log('총 개수:', v1GradingData.users?.results?.[0]?.count || 0);
  
  // 샘플 데이터
  const v1SampleUrl = 'https://superplacestudy.pages.dev/api/debug-users?sql=' + 
    encodeURIComponent('SELECT * FROM homework_gradings LIMIT 3');
  const v1SampleRes = await fetch(v1SampleUrl);
  const v1SampleData = await v1SampleRes.json();
  console.log('샘플:', JSON.stringify(v1SampleData.users?.results || [], null, 2));
  
  // 2. homework_submissions (v1) 확인
  console.log('\n=== homework_submissions (v1) ===');
  const v1SubUrl = 'https://superplacestudy.pages.dev/api/debug-users?sql=' + 
    encodeURIComponent('SELECT COUNT(*) as count FROM homework_submissions');
  const v1SubRes = await fetch(v1SubUrl);
  const v1SubData = await v1SubRes.json();
  console.log('총 개수:', v1SubData.users?.results?.[0]?.count || 0);
  
  // 샘플 데이터
  const v1SubSampleUrl = 'https://superplacestudy.pages.dev/api/debug-users?sql=' + 
    encodeURIComponent('SELECT * FROM homework_submissions LIMIT 3');
  const v1SubSampleRes = await fetch(v1SubSampleUrl);
  const v1SubSampleData = await v1SubSampleRes.json();
  console.log('샘플:', JSON.stringify(v1SubSampleData.users?.results || [], null, 2));
}

checkAllTables();
