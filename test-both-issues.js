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
          resolve({ status: res.statusCode, error: 'JSON parse error', raw: data.substring(0, 200) });
        }
      });
    }).on('error', reject);
  });
}

async function testBothIssues() {
  console.log('⏳ 배포 대기 중 (2분)...\n');
  await new Promise(resolve => setTimeout(resolve, 120000));
  
  console.log('=== 1️⃣ 숙제 데이터 확인 ===\n');
  
  const homeworkDebug = await httpsGet('https://superplacestudy.pages.dev/api/debug/homework-data');
  console.log('디버그 API 상태:', homeworkDebug.status);
  
  if (homeworkDebug.status === 200 && homeworkDebug.data.success) {
    const tables = homeworkDebug.data.data.tables;
    
    console.log('\n📊 숙제 테이블 상태:');
    console.log(`  homework_submissions_v2: ${tables.homework_submissions_v2?.exists ? '✅' : '❌'} (${tables.homework_submissions_v2?.totalCount || 0}건)`);
    console.log(`  homework_gradings_v2: ${tables.homework_gradings_v2?.exists ? '✅' : '❌'} (${tables.homework_gradings_v2?.totalCount || 0}건)`);
    console.log(`  오늘 제출: ${homeworkDebug.data.data.todaySubmissions?.count || 0}건`);
    
    if (tables.homework_submissions_v2?.recentRecords?.length > 0) {
      console.log('\n최근 제출 샘플:');
      tables.homework_submissions_v2.recentRecords.slice(0, 3).forEach((r, i) => {
        console.log(`  ${i+1}. ID: ${r.id}, 상태: ${r.status}, 제출: ${r.submittedAt}`);
      });
    }
  } else {
    console.log('❌ 디버그 API 실패:', homeworkDebug.error || homeworkDebug.raw);
  }
  
  console.log('\n\n=== 2️⃣ 포인트 데이터 확인 ===\n');
  
  // 포인트 충전 요청 확인
  const pointDebug = await httpsGet('https://superplacestudy.pages.dev/api/debug/point-requests');
  console.log('포인트 디버그 API 상태:', pointDebug.status);
  
  if (pointDebug.status === 200 && pointDebug.data.success) {
    const requests = pointDebug.data.data.requests || [];
    const academies = pointDebug.data.data.academies || [];
    
    console.log(`\n포인트 충전 요청: ${requests.length}건`);
    
    const approved = requests.filter(r => r.status === 'APPROVED');
    console.log(`승인된 요청: ${approved.length}건`);
    
    if (approved.length > 0) {
      console.log('\n승인된 요청 샘플:');
      approved.slice(0, 3).forEach((r, i) => {
        console.log(`  ${i+1}. 학원: ${r.academyName}, 금액: ${r.amount || r.requestedPoints}P, 승인: ${r.approvedAt}`);
      });
    }
    
    console.log(`\n학원 포인트 현황: ${academies.length}개 학원`);
    academies.forEach((a, i) => {
      console.log(`  ${i+1}. ${a.name}: ${a.smsPoints || 0}P`);
    });
    
    // 불일치 검사
    academies.forEach(academy => {
      const approvedForAcademy = approved
        .filter(r => r.academyId === academy.id)
        .reduce((sum, r) => sum + (r.amount || r.requestedPoints || 0), 0);
      
      const actualPoints = academy.smsPoints || 0;
      
      if (approvedForAcademy !== actualPoints) {
        console.log(`\n⚠️ 포인트 불일치 발견!`);
        console.log(`   학원: ${academy.name}`);
        console.log(`   승인 합계: ${approvedForAcademy}P`);
        console.log(`   실제 포인트: ${actualPoints}P`);
        console.log(`   차이: ${actualPoints - approvedForAcademy}P`);
      }
    });
  } else {
    console.log('❌ 포인트 디버그 API 실패');
  }
  
  console.log('\n\n=== 3️⃣ SMS 통계 API 확인 ===\n');
  
  const smsStats = await httpsGet('https://superplacestudy.pages.dev/api/admin/sms/stats');
  console.log('SMS 통계 API 상태:', smsStats.status);
  
  if (smsStats.status === 200 && smsStats.data.success) {
    console.log('SMS 포인트 잔액:', smsStats.data.stats.balance, 'P');
  } else {
    console.log('❌ SMS 통계 API 실패 (인증 필요)');
  }
  
  console.log('\n\n=== 📋 진단 결과 ===\n');
  
  // 숙제 진단
  if (homeworkDebug.status === 200) {
    const subCount = homeworkDebug.data.data.tables.homework_submissions_v2?.totalCount || 0;
    if (subCount === 0) {
      console.log('⚠️ 숙제: 제출 데이터가 없습니다. 학생이 숙제를 제출해야 합니다.');
    } else {
      console.log(`✅ 숙제: ${subCount}건의 제출이 있습니다.`);
    }
  }
  
  // 포인트 진단
  if (pointDebug.status === 200) {
    const hasApproved = pointDebug.data.data.requests?.some(r => r.status === 'APPROVED');
    if (!hasApproved) {
      console.log('⚠️ 포인트: 승인된 요청이 없습니다.');
    } else {
      console.log('✅ 포인트: 승인된 요청이 있습니다.');
      console.log('   → SMS 페이지에서 포인트 확인 필요');
    }
  }
}

testBothIssues().catch(console.error);
