const fetch = require('node-fetch');

async function testBotAssign() {
  console.log('=== AI 봇 할당 디버깅 시작 ===\n');
  
  // 1. AcademyBotSubscription 테이블 전체 조회
  console.log('1. AcademyBotSubscription 테이블 확인:');
  const subUrl = 'https://superplacestudy.pages.dev/api/debug-users?sql=' + 
    encodeURIComponent('SELECT * FROM AcademyBotSubscription LIMIT 10');
  const subRes = await fetch(subUrl);
  const subData = await subRes.json();
  console.log(JSON.stringify(subData.users?.results || [], null, 2));
  
  // 2. User 테이블에서 학원장 확인
  console.log('\n2. User 테이블 학원장 확인:');
  const directorUrl = 'https://superplacestudy.pages.dev/api/debug-users?sql=' + 
    encodeURIComponent("SELECT id, email, role, academyId FROM User WHERE role = 'DIRECTOR' LIMIT 5");
  const directorRes = await fetch(directorUrl);
  const directorData = await directorRes.json();
  console.log(JSON.stringify(directorData.users?.results || [], null, 2));
  
  // 3. users 테이블에서 학원장 확인
  console.log('\n3. users 테이블 학원장 확인:');
  const usersDirectorUrl = 'https://superplacestudy.pages.dev/api/debug-users?sql=' + 
    encodeURIComponent("SELECT id, email, role, academyId FROM users WHERE role = 'DIRECTOR' LIMIT 5");
  const usersDirectorRes = await fetch(usersDirectorUrl);
  const usersDirectorData = await usersDirectorRes.json();
  console.log(JSON.stringify(usersDirectorData.users?.results || [], null, 2));
  
  // 4. ai_bots 테이블 확인
  console.log('\n4. ai_bots 테이블 확인:');
  const botsUrl = 'https://superplacestudy.pages.dev/api/debug-users?sql=' + 
    encodeURIComponent("SELECT id, name FROM ai_bots LIMIT 5");
  const botsRes = await fetch(botsUrl);
  const botsData = await botsRes.json();
  console.log(JSON.stringify(botsData.users?.results || [], null, 2));
}

testBotAssign();
