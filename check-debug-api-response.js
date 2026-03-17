const fetch = require('node-fetch');

async function check() {
  const res = await fetch('https://superplacestudy.pages.dev/api/debug-users?table=users&limit=5');
  const text = await res.text();
  
  console.log('Status:', res.status);
  console.log('Response length:', text.length);
  console.log('\nFirst 2000 chars:');
  console.log(text.substring(0, 2000));
  
  try {
    const json = JSON.parse(text);
    if (json.users) {
      console.log('\n✅ users 필드 존재, 개수:', json.users.length);
    }
    if (json.result) {
      console.log('✅ result 필드 존재, 개수:', json.result.length);
    }
  } catch (e) {
    console.log('❌ JSON 파싱 실패:', e.message);
  }
}

check().catch(console.error);
