const BASE_URL = 'https://superplacestudy.pages.dev';

async function testRealIssue() {
  console.log('=== 실제 문제 직접 확인 ===\n');
  
  // 1. 포인트 목록 API 직접 호출 (인증 없이)
  console.log('1. 포인트 충전 테이블 구조 확인...\n');
  
  const tableCheckRes = await fetch(`${BASE_URL}/api/admin/fix-point-charge-table`);
  const tableData = await tableCheckRes.json();
  
  console.log('테이블 구조:', JSON.stringify(tableData, null, 2));
  
  if (tableData.sampleData && tableData.sampleData.length > 0) {
    console.log('\n샘플 요청 데이터:');
    tableData.sampleData.forEach(req => {
      console.log(`  - ID: ${req.id}`);
      console.log(`    academyId: ${req.academyId || 'NULL!!!'}`);
      console.log(`    userId: ${req.userId}`);
      console.log(`    requestedPoints: ${req.requestedPoints}`);
      console.log(`    status: ${req.status}\n`);
    });
  }
  
  // 2. 실제 승인 API 호출해보기 (에러 메시지 확인)
  console.log('2. 승인 API 직접 호출 (에러 확인)...\n');
  
  // 가짜 토큰으로 시도
  const fakeToken = 'test|test@test.com|SUPER_ADMIN|academy-test|123456';
  const testReqId = tableData.sampleData?.[0]?.id || 'test-id';
  
  const approveRes = await fetch(`${BASE_URL}/api/admin/point-charge-requests/approve`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${fakeToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ requestId: testReqId })
  });
  
  console.log(`승인 API 응답 상태: ${approveRes.status}`);
  
  const approveText = await approveRes.text();
  try {
    const approveData = JSON.parse(approveText);
    console.log('승인 API 응답:', JSON.stringify(approveData, null, 2));
  } catch (e) {
    console.log('Raw 응답:', approveText.substring(0, 500));
  }
}

testRealIssue().catch(console.error);
