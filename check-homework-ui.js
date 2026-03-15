const https = require('https');

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: headers
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, error: 'JSON parse error', raw: data.substring(0, 300) });
        }
      });
    }).on('error', reject);
  });
}

async function checkHomeworkUI() {
  console.log('🔍 숙제 검사 결과 UI 문제 진단\n');
  
  // 1. 디버그 API로 데이터 확인
  console.log('1️⃣ 데이터베이스 데이터 확인...');
  const debugRes = await httpsGet('https://superplacestudy.pages.dev/api/debug/homework-data');
  
  if (debugRes.status === 200 && debugRes.data?.success) {
    const tables = debugRes.data.data.tables;
    const subCount = tables.homework_submissions_v2?.totalCount || 0;
    const gradeCount = tables.homework_gradings_v2?.totalCount || 0;
    
    console.log(`   homework_submissions_v2: ${subCount}건`);
    console.log(`   homework_gradings_v2: ${gradeCount}건`);
    
    if (subCount > 0) {
      console.log('   ✅ 데이터베이스에 숙제 데이터 존재\n');
      
      // 최근 제출 샘플 표시
      if (tables.homework_submissions_v2.recentRecords?.length > 0) {
        console.log('   최근 제출 샘플 3건:');
        tables.homework_submissions_v2.recentRecords.slice(0, 3).forEach((r, i) => {
          console.log(`   ${i+1}. ID: ${r.id}`);
          console.log(`      상태: ${r.status}`);
          console.log(`      제출: ${r.submittedAt}`);
          console.log(`      사용자: ${r.userId}`);
        });
      }
    } else {
      console.log('   ❌ 데이터베이스에 숙제 데이터 없음\n');
      return;
    }
  } else {
    console.log('   ⚠️ 디버그 API 호출 실패\n');
  }
  
  console.log('\n2️⃣ API 응답 구조 확인 (인증 없이)...');
  console.log('   ⚠️ 401 Unauthorized 예상 (정상)\n');
  
  const noAuthRes = await httpsGet('https://superplacestudy.pages.dev/api/homework/results');
  console.log(`   응답 상태: ${noAuthRes.status}`);
  if (noAuthRes.status === 401) {
    console.log('   ✅ API 인증 필요 (정상)\n');
  }
  
  console.log('\n3️⃣ 프론트엔드 문제 진단...\n');
  console.log('   가능한 원인:');
  console.log('   1. API 응답 구조와 프론트엔드 파싱 불일치');
  console.log('   2. 날짜 필터 문제 (오늘 데이터만 조회)');
  console.log('   3. 로딩 상태에서 멈춤');
  console.log('   4. 빈 배열 처리 문제');
  console.log('   5. 렌더링 에러\n');
  
  console.log('\n📋 확인해야 할 사항:\n');
  console.log('   1. 브라우저 콘솔에 에러가 있는가?');
  console.log('   2. Network 탭에서 API 호출이 성공했는가?');
  console.log('   3. API 응답 데이터가 비어있는가?');
  console.log('   4. 날짜 필터가 오늘만 조회하고 있는가?');
  console.log('   5. 로딩 인디케이터가 계속 표시되는가?\n');
  
  console.log('\n💡 브라우저 콘솔에서 실행할 스크립트:\n');
  console.log(`
const token = localStorage.getItem('token');

// 최근 30일 데이터 조회
const end = new Date().toISOString().split('T')[0];
const start = new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0];

console.log('조회 기간:', start, '~', end);

fetch(\`/api/homework/results?startDate=\${start}&endDate=\${end}\`, {
  headers: { 'Authorization': \`Bearer \${token}\` }
})
.then(r => {
  console.log('응답 상태:', r.status);
  return r.json();
})
.then(data => {
  console.log('응답 데이터:', data);
  console.log('results 타입:', typeof data.results, Array.isArray(data.results));
  console.log('results 길이:', data.results?.length);
  
  if (data.success && data.results?.length > 0) {
    console.log('✅ 데이터 있음:', data.results.length, '건');
    console.table(data.results.slice(0, 3).map(r => ({
      ID: r.submission?.id,
      학생: r.submission?.userName,
      상태: r.submission?.status,
      점수: r.grading?.score,
      제출일: r.submission?.submittedAt
    })));
  } else if (data.success && data.results?.length === 0) {
    console.log('⚠️ 데이터는 있지만 results 배열이 비어있음');
  } else {
    console.log('❌ API 오류:', data.error);
  }
})
.catch(e => console.error('네트워크 오류:', e));
  `);
}

checkHomeworkUI().catch(console.error);
