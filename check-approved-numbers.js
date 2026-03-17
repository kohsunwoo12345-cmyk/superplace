const fetch = require('node-fetch');

async function checkApprovedNumbers() {
  console.log('🔍 승인된 발신번호 확인\n');
  
  // 1. User 테이블 확인
  const userRes = await fetch('https://superplacestudy.pages.dev/api/debug-users?table=User&limit=5');
  const userData = await userRes.json();
  
  if (userData.data && userData.data.users && userData.data.users.results) {
    console.log('📊 User 테이블 (대문자):');
    userData.data.users.results.forEach(u => {
      console.log(`  ID: ${u.id} | Email: ${u.email}`);
      console.log(`  approved_sender_numbers: ${u.approved_sender_numbers || '(없음)'}`);
      console.log('');
    });
  }
  
  // 2. users 테이블 확인
  const usersRes = await fetch('https://superplacestudy.pages.dev/api/debug-users?table=users&limit=5');
  const usersData = await usersRes.json();
  
  if (usersData.data && usersData.data.users && usersData.data.users.results) {
    console.log('\n📊 users 테이블 (소문자):');
    usersData.data.users.results.forEach(u => {
      console.log(`  ID: ${u.id} | Email: ${u.email}`);
      console.log(`  approved_sender_numbers: ${u.approved_sender_numbers || '(없음)'}`);
      console.log('');
    });
  }
  
  // 3. SMSSender 테이블 확인
  const smsRes = await fetch('https://superplacestudy.pages.dev/api/debug-users?table=SMSSender&limit=10');
  const smsText = await smsRes.text();
  
  console.log('\n📱 SMSSender 테이블:');
  try {
    const smsData = JSON.parse(smsText);
    if (smsData.data && smsData.data.users && smsData.data.users.results) {
      smsData.data.users.results.forEach(s => {
        console.log(`  ID: ${s.id} | userId: ${s.userId} | phoneNumber: ${s.phoneNumber} | status: ${s.status}`);
      });
    }
  } catch (e) {
    console.log('  (조회 실패 또는 데이터 없음)');
  }
}

checkApprovedNumbers().catch(console.error);
