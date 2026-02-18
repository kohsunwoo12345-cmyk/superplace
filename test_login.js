// D1 로그인 테스트 스크립트

// Simple password hashing using Node.js crypto
const crypto = require('crypto');

function hashPassword(password) {
  const hash = crypto.createHash('sha256');
  hash.update(password + 'superplace-salt-2024');
  return hash.digest('hex');
}

// 테스트할 계정 정보
const testAccounts = [
  { email: 'admin@superplace.com', password: 'admin1234' },
  { email: 'director@superplace.com', password: 'director1234' },
  { email: 'teacher@superplace.com', password: 'teacher1234' },
  { email: 'test@test.com', password: 'test1234' },
];

console.log('=== D1 로그인 테스트 - 비밀번호 해시 ===\n');

testAccounts.forEach(account => {
  const hashed = hashPassword(account.password);
  console.log(`이메일: ${account.email}`);
  console.log(`원본 비밀번호: ${account.password}`);
  console.log(`해시된 비밀번호: ${hashed}`);
  console.log('---');
});

console.log('\n=== D1에서 실행할 SQL ===');
console.log('-- 사용자 확인 쿼리:');
testAccounts.forEach(account => {
  const hashed = hashPassword(account.password);
  console.log(`SELECT * FROM User WHERE email = '${account.email}' AND password = '${hashed}';`);
});
