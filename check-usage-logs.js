const fetch = require('node-fetch');

async function checkUsageLogs() {
  // usage_logs에서 homework 관련 type 확인
  console.log('=== usage_logs 테이블 ===');
  
  // 1. 전체 개수
  const countUrl = 'https://superplacestudy.pages.dev/api/debug-users?sql=' + 
    encodeURIComponent('SELECT COUNT(*) as count FROM usage_logs');
  const countRes = await fetch(countUrl);
  const countData = await countRes.json();
  console.log('총 usage_logs:', countData.users?.results?.[0]?.count || 0);
  
  // 2. type 별 개수
  const typeCountUrl = 'https://superplacestudy.pages.dev/api/debug-users?sql=' + 
    encodeURIComponent('SELECT type, COUNT(*) as count FROM usage_logs GROUP BY type');
  const typeCountRes = await fetch(typeCountUrl);
  const typeCountData = await typeCountRes.json();
  console.log('\ntype 별 개수:');
  console.log(JSON.stringify(typeCountData.users?.results || [], null, 2));
  
  // 3. homework 관련 샘플
  const homeworkUrl = 'https://superplacestudy.pages.dev/api/debug-users?sql=' + 
    encodeURIComponent("SELECT * FROM usage_logs WHERE type LIKE '%homework%' OR type LIKE '%grading%' LIMIT 5");
  const homeworkRes = await fetch(homeworkUrl);
  const homeworkData = await homeworkRes.json();
  console.log('\nhomework 관련 로그 샘플:');
  console.log(JSON.stringify(homeworkData.users?.results || [], null, 2));
}

checkUsageLogs();
