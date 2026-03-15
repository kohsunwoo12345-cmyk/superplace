const https = require('https');

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, data: data.substring(0, 500) });
        }
      });
    }).on('error', reject);
  });
}

async function testHomeworkAPI() {
  console.log('🔍 숙제 결과 API 테스트\n');
  
  // 1. 인증 없이 호출 (401 예상)
  console.log('1️⃣ 인증 없이 호출 테스트...');
  const noAuth = await httpsGet('https://superplacestudy.pages.dev/api/homework/results');
  console.log('   상태:', noAuth.status);
  console.log('   응답:', JSON.stringify(noAuth.data).substring(0, 200));
  console.log('');
  
  // 2. 테이블 존재 확인을 위한 디버그 엔드포인트 호출
  console.log('2️⃣ 데이터베이스 테이블 상태 확인...');
  const dbStatus = await httpsGet('https://superplacestudy.pages.dev/api/admin/database-status');
  console.log('   상태:', dbStatus.status);
  
  if (dbStatus.status === 200 && dbStatus.data.success) {
    const tables = dbStatus.data.data.tables || [];
    const homeworkTables = tables.filter(t => 
      t.name.toLowerCase().includes('homework')
    );
    
    console.log(`   ✅ 숙제 관련 테이블 (${homeworkTables.length}개):`);
    homeworkTables.forEach(t => {
      console.log(`      - ${t.name} (${t.rowCount || 0}행)`);
    });
  } else {
    console.log('   ⚠️ 데이터베이스 상태 조회 실패');
  }
  console.log('');
  
  // 3. 샘플 데이터 확인
  console.log('3️⃣ homework_submissions_v2 테이블 샘플 데이터 확인 필요');
  console.log('   → Cloudflare D1 대시보드에서 직접 확인:');
  console.log('   SELECT COUNT(*) FROM homework_submissions_v2;');
  console.log('   SELECT * FROM homework_submissions_v2 ORDER BY submittedAt DESC LIMIT 5;');
}

testHomeworkAPI().catch(console.error);
