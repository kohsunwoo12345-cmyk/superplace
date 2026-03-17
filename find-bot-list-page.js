console.log('🔍 학원장이 보는 AI 봇 목록 페이지 찾기\n');

const fs = require('fs');
const path = require('path');

// 가능한 페이지들
const candidates = [
  'src/app/dashboard/ai-bots/page.tsx',
  'src/app/dashboard/bots/page.tsx',
  'src/app/dashboard/my-bots/page.tsx',
  'src/app/dashboard/academy-bots/page.tsx',
  'src/app/dashboard/admin/ai-bots/assign/page.tsx'
];

console.log('📋 확인할 페이지들:');
candidates.forEach((file, i) => {
  const exists = fs.existsSync(file);
  console.log(`  ${i+1}. ${file} ${exists ? '✅' : '❌'}`);
});

console.log('\n🔍 학생에게 봇 할당하는 페이지는:');
console.log('  - src/app/dashboard/admin/ai-bots/assign/page.tsx');
console.log('  - 이 페이지에서 학원장이 할당받은 봇 목록을 보여줘야 함');
