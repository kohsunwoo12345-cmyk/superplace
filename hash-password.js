// 비밀번호 해시 생성

async function hashPassword(password) {
  const salt = 'superplace-salt-2024';
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function testPasswords() {
  const passwords = [
    'admin1234!',
    '12341234',
    'Test1234!'
  ];
  
  console.log('=== 비밀번호 해시 생성 ===\n');
  
  for (const pw of passwords) {
    const hash = await hashPassword(pw);
    console.log(`원본: ${pw}`);
    console.log(`해시: ${hash}`);
    console.log('');
  }
}

testPasswords();
