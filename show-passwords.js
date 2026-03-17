const fetch = require('node-fetch');

async function showPasswords() {
  const res = await fetch('https://superplacestudy.pages.dev/api/debug-users?table=users&limit=15');
  const json = await res.json();
  
  if (json.success && json.data && json.data.users) {
    const users = json.data.users;
    console.log(`\n🔐 DB 사용자 비밀번호 현황 (총 ${users.length}명)\n`);
    console.log('='.repeat(80) + '\n');
    
    users.forEach(user => {
      const pw = user.password || '';
      let pwType = '';
      let pwDisplay = '';
      
      if (!pw) {
        pwType = '❌ 없음';
        pwDisplay = '(비밀번호 필드 없음)';
      } else if (pw.startsWith('$2a$') || pw.startsWith('$2b$')) {
        pwType = '🔐 bcrypt';
        pwDisplay = pw.substring(0, 30) + '...';
      } else if (pw.length === 64 && /^[a-f0-9]+$/.test(pw)) {
        pwType = '🔑 SHA-256';
        pwDisplay = pw.substring(0, 30) + '...';
      } else {
        pwType = '📝 평문';
        pwDisplay = `"${pw}"`;
      }
      
      console.log(`ID: ${user.id.toString().padEnd(4)} | ${user.email.padEnd(32)} | ${user.role || '없음'}`);
      console.log(`       형식: ${pwType.padEnd(12)} | ${pwDisplay}`);
      console.log('');
    });
    
    const plainCount = users.filter(u => u.password && u.password.length < 64 && !u.password.startsWith('$2')).length;
    const hashCount = users.filter(u => u.password && (u.password.startsWith('$2') || u.password.length === 64)).length;
    const noCount = users.filter(u => !u.password).length;
    
    console.log('='.repeat(80));
    console.log(`\n📊 요약:`);
    console.log(`   📝 평문 비밀번호: ${plainCount}명`);
    console.log(`   🔐 해시된 비밀번호: ${hashCount}명`);
    console.log(`   ❌ 비밀번호 없음: ${noCount}명`);
    console.log('');
  } else {
    console.log('❌ 사용자 데이터를 가져올 수 없습니다');
  }
}

showPasswords().catch(console.error);
