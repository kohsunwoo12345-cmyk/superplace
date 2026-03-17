const fetch = require('node-fetch');

async function getUsers() {
  const res = await fetch('https://superplacestudy.pages.dev/api/debug-users?table=users&limit=10');
  const data = await res.json();
  
  console.log('🔍 실제 DB 사용자 비밀번호 확인\n');
  
  // data.users가 있는지 확인
  let userList = [];
  if (data.users) {
    userList = data.users;
  } else if (data.data && data.data.result) {
    userList = data.data.result;
  } else if (data.result) {
    userList = data.result;
  }
  
  if (userList.length === 0) {
    console.log('❌ 사용자 목록을 찾을 수 없습니다');
    console.log('전체 응답 구조:', Object.keys(data));
    return;
  }
  
  console.log(`📋 총 ${userList.length}명의 사용자 발견\n`);
  
  userList.forEach(user => {
    const pw = user.password || '';
    let pwType = '';
    
    if (!pw) {
      pwType = '❌ 없음';
    } else if (pw.startsWith('$2a$') || pw.startsWith('$2b$')) {
      pwType = '🔐 bcrypt';
    } else if (pw.length === 64 && /^[a-f0-9]+$/.test(pw)) {
      pwType = '🔑 SHA-256 hash';
    } else {
      pwType = `📝 평문 (길이: ${pw.length})`;
    }
    
    console.log(`ID: ${user.id} | ${user.email}`);
    console.log(`   타입: ${pwType}`);
    if (pwType.includes('평문')) {
      console.log(`   비밀번호: "${pw}"`);
    } else if (pw && pw.length < 100) {
      console.log(`   값: ${pw}`);
    }
    console.log('');
  });
}

getUsers().catch(console.error);
