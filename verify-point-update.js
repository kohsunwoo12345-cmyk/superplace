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
          resolve({ status: res.statusCode, data: data });
        }
      });
    }).on('error', reject);
  });
}

async function checkData() {
  console.log('=== 포인트 충전 요청 조회 ===');
  
  // 1. Point charge requests 조회
  const requests = await httpsGet('https://superplacestudy.pages.dev/api/admin/point-charge-requests?status=ALL');
  console.log('Status:', requests.status);
  
  if (requests.status === 200 && requests.data.success) {
    const allRequests = requests.data.data.requests;
    console.log(`\n총 ${allRequests.length}개의 충전 요청`);
    
    allRequests.forEach((req, idx) => {
      console.log(`\n[${idx + 1}] 요청 ID: ${req.id}`);
      console.log(`   학원: ${req.academyName} (${req.academyId})`);
      console.log(`   금액: ${req.amount || req.requestedPoints}P`);
      console.log(`   상태: ${req.status}`);
      console.log(`   요청일: ${req.createdAt}`);
      if (req.status === 'APPROVED') {
        console.log(`   승인일: ${req.approvedAt}`);
        console.log(`   승인자: ${req.approvedBy}`);
      }
    });
    
    // 2. 각 학원의 실제 포인트 조회
    console.log('\n\n=== 학원별 SMS 포인트 현황 ===');
    const academyIds = [...new Set(allRequests.map(r => r.academyId))];
    
    for (const academyId of academyIds) {
      if (!academyId) continue;
      const academy = await httpsGet(`https://superplacestudy.pages.dev/api/admin/academies/${academyId}`);
      if (academy.status === 200 && academy.data.success) {
        const acad = academy.data.data;
        console.log(`\n학원: ${acad.name} (${acad.id})`);
        console.log(`   SMS 포인트: ${acad.smsPoints || 0}P`);
        
        // 이 학원의 APPROVED 요청 합계
        const approvedSum = allRequests
          .filter(r => r.academyId === academyId && r.status === 'APPROVED')
          .reduce((sum, r) => sum + (r.amount || r.requestedPoints || 0), 0);
        console.log(`   승인된 요청 합계: ${approvedSum}P`);
        console.log(`   ⚠️ 차이: ${(acad.smsPoints || 0) - approvedSum}P`);
      }
    }
  } else {
    console.log('요청 조회 실패:', requests.data);
  }
}

checkData().catch(console.error);
