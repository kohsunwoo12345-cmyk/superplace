const fetch = require('node-fetch');

async function checkGradingData() {
  // 1. homework_gradings_v2 테이블 확인
  console.log('=== homework_gradings_v2 테이블 샘플 ===');
  const gradingUrl = 'https://superplacestudy.pages.dev/api/debug-users?sql=' + 
    encodeURIComponent('SELECT * FROM homework_gradings_v2 LIMIT 5');
  const gradingRes = await fetch(gradingUrl);
  const gradingData = await gradingRes.json();
  console.log(JSON.stringify(gradingData.users?.results || [], null, 2));
  
  // 2. homework_submissions_v2 테이블 확인
  console.log('\n=== homework_submissions_v2 테이블 샘플 ===');
  const submissionUrl = 'https://superplacestudy.pages.dev/api/debug-users?sql=' + 
    encodeURIComponent('SELECT * FROM homework_submissions_v2 LIMIT 5');
  const submissionRes = await fetch(submissionUrl);
  const submissionData = await submissionRes.json();
  console.log(JSON.stringify(submissionData.users?.results || [], null, 2));
  
  // 3. homework_images 개수 확인
  console.log('\n=== homework_images 개수 ===');
  const countUrl = 'https://superplacestudy.pages.dev/api/debug-users?sql=' + 
    encodeURIComponent('SELECT COUNT(*) as count FROM homework_images');
  const countRes = await fetch(countUrl);
  const countData = await countRes.json();
  console.log('총 homework_images:', countData.users?.results?.[0]?.count || 0);
  
  // 4. 채점 완료된 건수 확인
  console.log('\n=== 채점 완료된 homework_gradings_v2 개수 ===');
  const gradedCountUrl = 'https://superplacestudy.pages.dev/api/debug-users?sql=' + 
    encodeURIComponent("SELECT COUNT(*) as count FROM homework_gradings_v2 WHERE status = 'completed'");
  const gradedCountRes = await fetch(gradedCountUrl);
  const gradedCountData = await gradedCountRes.json();
  console.log('채점 완료:', gradedCountData.users?.results?.[0]?.count || 0);
}

checkGradingData();
