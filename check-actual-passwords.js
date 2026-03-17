// 실제 DB에서 사용자별 비밀번호 형식 확인

const fetch = require('node-fetch');

async function checkPasswords() {
  console.log('🔍 실제 DB 사용자 비밀번호 확인\n');
  
  const res = await fetch('https://superplacestudy.pages.dev/api/debug-users?table=users&limit=20');
  const data = await res.json();
  
  if (data.users && data.users.length > 0) {
    console.log('📋 사용자 목록 (이메일 + 비밀번호 형식):\n');
    
    data.users.forEach(user => {
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
      
      console.log(`${user.id.toString().padEnd(5)} | ${user.email.padEnd(30)} | ${pwType}`);
      if (pwType.includes('평문')) {
        console.log(`       비밀번호: "${pw}"`);
      } else if (pw) {
        console.log(`       해시: ${pw.substring(0, 40)}...`);
      }
      console.log('');
    });
  } else {
    console.log('❌ 사용자 정보 조회 실패');
  }
}

checkPasswords().catch(console.error);
