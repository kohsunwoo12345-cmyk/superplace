// 관리자 비밀번호 업데이트 (해시로)

async function hashPassword(password) {
  const salt = 'superplace-salt-2024';
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function updatePassword() {
  const hash = await hashPassword('admin1234!');
  
  console.log('=== 관리자 비밀번호 업데이트 ===\n');
  console.log('해시:', hash);
  console.log('\nDB 업데이트 쿼리:');
  console.log(`UPDATE users SET password = '${hash}' WHERE email = 'admin@superplace.co.kr';`);
  
  // API로 업데이트 (admin API 있다면)
  // 또는 직접 SQL 실행
}

updatePassword();
