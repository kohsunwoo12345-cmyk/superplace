#!/usr/bin/env node

/**
 * 🚀 Vercel 사용자 데이터베이스 즉시 수정 도구
 * 
 * Vercel Dashboard에서 DATABASE_URL을 복사하여 사용하세요.
 */

const readline = require('readline');
const { spawn } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('='.repeat(70));
console.log('🔧 Vercel 사용자 데이터베이스 즉시 수정 도구');
console.log('='.repeat(70));
console.log('');
console.log('이 도구는 다음을 자동으로 수행합니다:');
console.log('  1. 첫 번째 사용자를 SUPER_ADMIN으로 설정');
console.log('  2. 모든 사용자 승인 (approved: true)');
console.log('  3. SUPER_ADMIN이 없으면 새로 생성');
console.log('');
console.log('='.repeat(70));
console.log('');

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log('📋 Vercel Dashboard에서 DATABASE_URL을 가져오세요:');
  console.log('');
  console.log('  1. https://vercel.com/dashboard 접속');
  console.log('  2. superplace 프로젝트 선택');
  console.log('  3. Settings > Environment Variables');
  console.log('  4. DATABASE_URL 찾기 → 👁️ Show 클릭 → 전체 복사');
  console.log('');
  console.log('='.repeat(70));
  console.log('');

  const databaseUrl = await askQuestion('DATABASE_URL을 붙여넣으세요:\n');
  
  if (!databaseUrl || !databaseUrl.startsWith('postgres://')) {
    console.error('\n❌ 올바른 DATABASE_URL이 아닙니다.');
    console.error('   형식: postgres://user:pass@host:port/database');
    rl.close();
    process.exit(1);
  }

  console.log('');
  console.log('✅ DATABASE_URL 확인됨');
  console.log('');
  
  const confirm = await askQuestion('계속하시겠습니까? (y/n): ');
  
  if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
    console.log('\n❌ 취소되었습니다.');
    rl.close();
    process.exit(0);
  }

  console.log('');
  console.log('🔧 데이터베이스 수정 중...');
  console.log('');
  
  rl.close();

  // fix-admin.js 실행
  const child = spawn('node', ['fix-admin.js', databaseUrl], {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl }
  });

  child.on('close', (code) => {
    if (code === 0) {
      console.log('');
      console.log('='.repeat(70));
      console.log('✨ 모든 작업이 완료되었습니다!');
      console.log('='.repeat(70));
      console.log('');
      console.log('🌐 다음 페이지로 이동하세요:');
      console.log('   https://superplace-study.vercel.app/auth/signin');
      console.log('');
    }
    process.exit(code);
  });
}

main().catch((error) => {
  console.error('❌ 오류:', error);
  rl.close();
  process.exit(1);
});
