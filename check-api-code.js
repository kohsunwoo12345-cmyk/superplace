// API 코드 확인
const fs = require('fs');
const content = fs.readFileSync('src/app/api/students/[id]/route.ts', 'utf8');

console.log('🔍 API 코드에서 필드명 검색...\n');

// studentId 검색
const studentIdMatches = content.match(/studentId:\s*studentId/g);
console.log('❌ 잘못된 패턴 (studentId: studentId):');
if (studentIdMatches) {
  console.log(`   발견됨: ${studentIdMatches.length}개`);
  studentIdMatches.forEach(m => console.log(`   - ${m}`));
} else {
  console.log('   발견 안 됨 ✅');
}

console.log('\n');

// userId 검색
const userIdMatches = content.match(/userId:\s*studentId/g);
console.log('✅ 올바른 패턴 (userId: studentId):');
if (userIdMatches) {
  console.log(`   발견됨: ${userIdMatches.length}개`);
  userIdMatches.forEach(m => console.log(`   - ${m}`));
} else {
  console.log('   발견 안 됨 ❌');
}

// 전체 where 절 확인
console.log('\n📋 모든 where 절:');
const whereMatches = content.match(/where:\s*\{[^}]+\}/g);
if (whereMatches) {
  whereMatches.forEach((match, i) => {
    console.log(`\n${i + 1}. ${match}`);
  });
}
