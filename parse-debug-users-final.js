const fetch = require('node-fetch');

async function getUsers() {
  const res = await fetch('https://superplacestudy.pages.dev/api/debug-users?table=users&limit=10');
  const json = await res.json();
  
  console.log('🔍 DB API 응답 분석\n');
  console.log('success:', json.success);
  console.log('data 타입:', typeof json.data);
  
  if (json.data) {
    console.log('data의 키:', Object.keys(json.data));
    
    // data 안에 result가 있는지 확인
    if (json.data.result) {
      const users = json.data.result;
      console.log(`\n✅ ${users.length}명의 사용자 발견\n`);
      
      users.forEach(user => {
        const pw = user.password || '';
        let pwInfo = '';
        
        if (!pw) {
          pwInfo = '❌ 비밀번호 없음';
        } else if (pw.startsWith('$2')) {
          pwInfo = `🔐 bcrypt (${pw.substring(0, 20)}...)`;
        } else if (pw.length === 64 && /^[a-f0-9]+$/.test(pw)) {
          pwInfo = `🔑 SHA-256`;
        } else {
          pwInfo = `📝 평문: "${pw}"`;
        }
        
        console.log(`${user.id}. ${user.email}`);
        console.log(`   ${pwInfo}`);
        console.log(`   Role: ${user.role || '(없음)'}`);
        console.log('');
      });
    } else {
      console.log('\n❌ result 필드가 없습니다');
      console.log('data 내용:', JSON.stringify(json.data).substring(0, 500));
    }
  }
}

getUsers().catch(console.error);
