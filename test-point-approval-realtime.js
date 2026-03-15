#!/usr/bin/env node

const https = require('https');

console.log('\n========== 포인트 승인 실시간 테스트 ==========\n');

// 환경 설정
const BASE_URL = 'https://superplacestudy.pages.dev';

// HTTPS GET 요청
function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data: data });
        }
      });
    }).on('error', reject);
  });
}

// HTTPS POST 요청
function httpsPost(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function runTest() {
  console.log('⚠️ 이 테스트는 관리자 계정으로 로그인한 후 실행해야 합니다.');
  console.log('⚠️ 브라우저에서 로그인 후 콘솔에서 localStorage.getItem("token")을 실행하여 토큰을 복사하세요.\n');
  
  // 여기에 실제 토큰을 입력하세요
  const token = process.env.ADMIN_TOKEN || '';
  
  if (!token) {
    console.log('❌ 토큰이 없습니다!');
    console.log('\n사용 방법:');
    console.log('1. 브라우저에서 https://superplacestudy.pages.dev 로그인');
    console.log('2. F12 → 콘솔에서 localStorage.getItem("token") 실행');
    console.log('3. 토큰 복사');
    console.log('4. ADMIN_TOKEN=토큰 node test-point-approval-realtime.js\n');
    return;
  }

  try {
    // Step 1: 포인트 요청 목록 조회
    console.log('📋 Step 1: 포인트 충전 요청 목록 조회...\n');
    const requestsRes = await httpsGet(`${BASE_URL}/api/admin/point-charge-requests`, {
      'Authorization': `Bearer ${token}`
    });

    console.log(`✅ 응답 상태: ${requestsRes.status}`);
    
    if (requestsRes.status !== 200) {
      console.log('❌ 요청 목록 조회 실패:', requestsRes.data);
      return;
    }

    const requests = requestsRes.data.requests || [];
    console.log(`📦 총 요청 개수: ${requests.length}\n`);

    // PENDING 요청 찾기
    const pendingRequests = requests.filter(r => r.status === 'PENDING');
    console.log(`⏳ PENDING 요청: ${pendingRequests.length}개\n`);

    if (pendingRequests.length === 0) {
      console.log('⚠️ 승인할 PENDING 요청이 없습니다.');
      console.log('원장이 먼저 포인트 충전을 신청해야 합니다.\n');
      return;
    }

    // 첫 번째 PENDING 요청 선택
    const targetRequest = pendingRequests[0];
    console.log('🎯 승인할 요청:');
    console.log(`   ID: ${targetRequest.id}`);
    console.log(`   사용자: ${targetRequest.userName} (${targetRequest.userEmail})`);
    console.log(`   학원: ${targetRequest.academyName}`);
    console.log(`   학원 ID: ${targetRequest.academyId}`);
    console.log(`   요청 포인트: ${targetRequest.requestedPoints?.toLocaleString() || targetRequest.amount?.toLocaleString()}P`);
    console.log(`   신청일: ${new Date(targetRequest.createdAt).toLocaleString('ko-KR')}\n`);

    // Step 2: 승인 전 학원 포인트 확인
    console.log('📋 Step 2: 승인 전 학원 포인트 확인...\n');
    const beforeStatsRes = await httpsGet(`${BASE_URL}/api/admin/sms/stats`, {
      'Authorization': `Bearer ${token}`
    });

    if (beforeStatsRes.status === 200) {
      const beforeBalance = beforeStatsRes.data?.stats?.balance || 0;
      console.log(`💰 승인 전 포인트: ${beforeBalance.toLocaleString()}P\n`);
    } else {
      console.log('⚠️ 승인 전 포인트 조회 실패\n');
    }

    // Step 3: 포인트 승인 실행
    console.log('📋 Step 3: 포인트 승인 실행...\n');
    const approveRes = await httpsPost(
      `${BASE_URL}/api/admin/point-charge-requests/approve`,
      JSON.stringify({ requestId: targetRequest.id }),
      { 'Authorization': `Bearer ${token}` }
    );

    console.log(`✅ 승인 응답 상태: ${approveRes.status}`);
    console.log('📦 승인 응답 데이터:', JSON.stringify(approveRes.data, null, 2), '\n');

    if (approveRes.status !== 200) {
      console.log('❌ 승인 실패!');
      return;
    }

    // Step 4: 승인 후 학원 포인트 확인 (2초 대기)
    console.log('📋 Step 4: 승인 후 학원 포인트 확인 (2초 대기)...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const afterStatsRes = await httpsGet(`${BASE_URL}/api/admin/sms/stats`, {
      'Authorization': `Bearer ${token}`
    });

    if (afterStatsRes.status === 200) {
      const afterBalance = afterStatsRes.data?.stats?.balance || 0;
      console.log(`💰 승인 후 포인트: ${afterBalance.toLocaleString()}P\n`);

      // Step 5: 포인트 증가 확인
      const beforeBalance = beforeStatsRes.data?.stats?.balance || 0;
      const expectedIncrease = targetRequest.requestedPoints || targetRequest.amount;
      const actualIncrease = afterBalance - beforeBalance;

      console.log('========== 검증 결과 ==========\n');
      console.log(`승인 전: ${beforeBalance.toLocaleString()}P`);
      console.log(`승인 후: ${afterBalance.toLocaleString()}P`);
      console.log(`예상 증가: ${expectedIncrease?.toLocaleString() || '?'}P`);
      console.log(`실제 증가: ${actualIncrease.toLocaleString()}P`);
      
      if (actualIncrease === expectedIncrease) {
        console.log('\n✅ 성공! 포인트가 정상적으로 증가했습니다!\n');
      } else if (actualIncrease === 0) {
        console.log('\n❌ 실패! 포인트가 증가하지 않았습니다!\n');
        console.log('🔍 가능한 원인:');
        console.log('   1. 승인 API가 실제로 포인트를 업데이트하지 않음');
        console.log('   2. SMS stats API가 잘못된 academyId를 조회함');
        console.log('   3. Academy.smsPoints 컬럼이 업데이트되지 않음');
        console.log('   4. 캐시 문제\n');
      } else {
        console.log('\n⚠️ 경고! 증가량이 예상과 다릅니다!\n');
      }
    } else {
      console.log('❌ 승인 후 포인트 조회 실패\n');
    }

    // Step 6: 요청 목록 다시 조회 (상태 변경 확인)
    console.log('📋 Step 6: 요청 상태 변경 확인...\n');
    const afterRequestsRes = await httpsGet(`${BASE_URL}/api/admin/point-charge-requests`, {
      'Authorization': `Bearer ${token}`
    });

    if (afterRequestsRes.status === 200) {
      const afterRequests = afterRequestsRes.data.requests || [];
      const approvedRequest = afterRequests.find(r => r.id === targetRequest.id);
      
      if (approvedRequest) {
        console.log(`📝 요청 상태: ${approvedRequest.status}`);
        console.log(`👤 승인자: ${approvedRequest.approvedByEmail || '(없음)'}`);
        console.log(`📅 승인 시각: ${approvedRequest.approvedAt ? new Date(approvedRequest.approvedAt).toLocaleString('ko-KR') : '(없음)'}\n`);
        
        if (approvedRequest.status === 'APPROVED') {
          console.log('✅ 요청 상태가 APPROVED로 변경되었습니다!\n');
        } else {
          console.log('⚠️ 요청 상태가 변경되지 않았습니다.\n');
        }
      }
    }

  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
  }
}

console.log('💡 실행 방법:');
console.log('   ADMIN_TOKEN=토큰값 node test-point-approval-realtime.js\n');
console.log('또는 브라우저 콘솔(F12)에서:');
console.log('   const token = localStorage.getItem("token");');
console.log('   // 아래 코드를 실행하여 승인 전후 포인트 확인\n');

runTest();
