#!/usr/bin/env node

/**
 * AI 쇼핑몰 구매 → 승인 → 봇 사용 전체 플로우 테스트
 * 
 * 테스트 시나리오:
 * 1. 외부 사용자가 쇼핑몰에서 구매 신청 (토큰 없이)
 * 2. 관리자가 승인 페이지에서 구매 신청 확인
 * 3. 관리자가 승인 처리 (academyId 지정)
 * 4. 학원에 AcademyBotSubscription 생성 확인
 * 5. 학원장이 학생에게 봇 할당
 * 6. 학생이 AI 채팅에서 봇 사용 가능 확인
 */

const BASE_URL = 'https://superplacestudy.pages.dev';

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║   AI 쇼핑몰 구매 → 승인 → 봇 사용 전체 플로우 테스트         ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// 테스트 데이터
const testData = {
  // 구매 정보
  purchase: {
    productId: 'bot-1772458232285-1zgtygvh1', // 실제 봇 ID로 변경 필요
    productName: '수학 PDF 테스트 봇',
    studentCount: 10,
    months: 12,
    pricePerStudent: 1000,
    totalPrice: 120000,
    email: 'customer@test.com',
    name: '테스트 구매자',
    academyName: '슈퍼플레이스 테스트 학원',
    phoneNumber: '010-9999-8888',
    requestMessage: '빠른 승인 부탁드립니다'
  },
  
  // 테스트 학원 ID
  academyId: 'academy-1771479246368-5viyubmqk',
  
  // 테스트 학생 ID
  studentId: 'user-1771479246368-du957iw33'
};

async function runTests() {
  console.log('📋 테스트 1: 외부 사용자 구매 신청 (토큰 없이)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('🔍 요청 URL:', `${BASE_URL}/api/bot-purchase-requests/create`);
  console.log('📦 요청 데이터:', JSON.stringify(testData.purchase, null, 2));
  console.log('\n⚠️  NOTE: 이 요청은 Authorization 헤더 없이 전송됩니다 (외부 사용자)');
  
  try {
    const response = await fetch(`${BASE_URL}/api/bot-purchase-requests/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // Authorization 헤더 없음!
      },
      body: JSON.stringify(testData.purchase)
    });
    
    console.log(`\n📡 응답 상태: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    console.log('📦 응답 데이터:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('\n✅ 구매 신청 성공!');
      console.log(`📋 요청 ID: ${data.requestId}`);
      console.log('\n📝 다음 단계:');
      console.log(`   1. 관리자 로그인: ${BASE_URL}/login`);
      console.log(`   2. 승인 페이지 이동: ${BASE_URL}/dashboard/admin/bot-shop-approvals`);
      console.log(`   3. 방금 생성된 요청을 찾아서 "상세" 버튼 클릭`);
      console.log(`   4. academyId를 "${testData.academyId}"로 설정 (또는 실제 학원 선택)`);
      console.log(`   5. "승인" 버튼 클릭`);
      
      return { success: true, requestId: data.requestId };
    } else {
      console.error('\n❌ 구매 신청 실패!');
      console.error('에러:', data.error || data.message);
      
      if (data.error === 'Unauthorized') {
        console.error('\n🔧 문제: 토큰 없이 구매 신청을 할 수 없습니다');
        console.error('해결: functions/api/bot-purchase-requests/create.ts 수정 필요');
      }
      
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('\n💥 네트워크 오류:', error.message);
    return { success: false, error: error.message };
  }
}

async function testStep2_CheckApprovalPage() {
  console.log('\n\n📋 테스트 2: 승인 페이지에서 구매 신청 확인');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('⚠️  이 단계는 수동으로 진행해야 합니다:');
  console.log('\n1️⃣  관리자 계정으로 로그인:');
  console.log(`   URL: ${BASE_URL}/login`);
  console.log('   이메일: (관리자 이메일)');
  console.log('   비밀번호: (관리자 비밀번호)');
  
  console.log('\n2️⃣  승인 페이지 이동:');
  console.log(`   URL: ${BASE_URL}/dashboard/admin/bot-shop-approvals`);
  console.log('   왼쪽 사이드바 → "쇼핑몰 승인 관리" 클릭');
  
  console.log('\n3️⃣  구매 신청 확인:');
  console.log('   - 상태: 🟡 대기중');
  console.log(`   - 신청자: ${testData.purchase.name}`);
  console.log(`   - 이메일: ${testData.purchase.email}`);
  console.log(`   - 학원: ${testData.purchase.academyName}`);
  console.log(`   - 연락처: ${testData.purchase.phoneNumber}`);
  console.log(`   - 학생 수: ${testData.purchase.studentCount}명`);
  console.log(`   - 기간: ${testData.purchase.months}개월`);
  
  console.log('\n4️⃣  "상세" 버튼 클릭하여 모든 정보 확인');
}

async function testStep3_ApproveRequest() {
  console.log('\n\n📋 테스트 3: 구매 신청 승인');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('⚠️  이 단계는 수동으로 진행해야 합니다:');
  console.log('\n1️⃣  상세 모달에서 학원 선택:');
  console.log('   ⚠️ IMPORTANT: 외부 사용자 구매이므로 academyId를 지정해야 합니다');
  console.log(`   추천 academyId: ${testData.academyId}`);
  
  console.log('\n2️⃣  학생 수 확인/수정:');
  console.log(`   신청 학생 수: ${testData.purchase.studentCount}명`);
  console.log('   승인 학생 수: (필요시 수정, 예: 10명 → 8명)');
  
  console.log('\n3️⃣  "승인" 버튼 클릭');
  console.log('   → 확인 다이얼로그: "N명으로 승인하시겠습니까?"');
  console.log('   → "확인" 클릭');
  
  console.log('\n4️⃣  성공 메시지 확인:');
  console.log('   ✅ "승인되었습니다!"');
}

async function testStep4_VerifySubscription() {
  console.log('\n\n📋 테스트 4: AcademyBotSubscription 생성 확인');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('Cloudflare 대시보드 → D1 Database에서 확인:');
  console.log('\n```sql');
  console.log('SELECT ');
  console.log('  id,');
  console.log('  academyId,');
  console.log('  productId,');
  console.log('  productName,');
  console.log('  totalStudentSlots,');
  console.log('  usedStudentSlots,');
  console.log('  remainingStudentSlots,');
  console.log('  subscriptionStart,');
  console.log('  subscriptionEnd,');
  console.log('  createdAt');
  console.log('FROM AcademyBotSubscription');
  console.log(`WHERE academyId = '${testData.academyId}'`);
  console.log(`AND productId = '${testData.purchase.productId}'`);
  console.log('ORDER BY createdAt DESC');
  console.log('LIMIT 1;');
  console.log('```');
  
  console.log('\n✅ 예상 결과:');
  console.log(`   - academyId: ${testData.academyId}`);
  console.log(`   - productId: ${testData.purchase.productId}`);
  console.log(`   - totalStudentSlots: ${testData.purchase.studentCount} (또는 관리자가 수정한 값)`);
  console.log('   - usedStudentSlots: 0');
  console.log(`   - remainingStudentSlots: ${testData.purchase.studentCount}`);
  console.log('   - subscriptionEnd: 현재 날짜 + 12개월');
}

async function testStep5_AssignToStudent() {
  console.log('\n\n📋 테스트 5: 학원장이 학생에게 봇 할당');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('1️⃣  학원장 계정으로 로그인:');
  console.log(`   URL: ${BASE_URL}/login`);
  console.log(`   학원: ${testData.academyId}`);
  
  console.log('\n2️⃣  봇 할당 페이지 이동:');
  console.log(`   URL: ${BASE_URL}/dashboard/admin/ai-bots/assign`);
  console.log('   왼쪽 사이드바 → "AI 봇 할당하기" 클릭');
  
  console.log('\n3️⃣  봇 할당:');
  console.log(`   - 봇 선택: ${testData.purchase.productName}`);
  console.log(`   - 학생 선택: ${testData.studentId} (또는 실제 학생)`);
  console.log('   - ⚠️ 기간 입력 필드는 표시되지 않아야 함 (자동으로 학원 구독 기간 사용)');
  console.log('   - "할당" 버튼 클릭');
  
  console.log('\n4️⃣  성공 메시지 확인:');
  console.log('   ✅ "AI 봇이 성공적으로 할당되었습니다"');
  console.log(`   ✅ "학원 구독 기간: ~ YYYY-MM-DD"`);
}

async function testStep6_StudentAccessBot() {
  console.log('\n\n📋 테스트 6: 학생이 AI 채팅에서 봇 사용');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('1️⃣  학생 계정으로 로그인:');
  console.log(`   URL: ${BASE_URL}/student-login`);
  console.log(`   학생 ID: ${testData.studentId}`);
  
  console.log('\n2️⃣  AI 채팅 페이지 이동:');
  console.log(`   URL: ${BASE_URL}/ai-chat`);
  
  console.log('\n3️⃣  봇 목록 확인:');
  console.log(`   ✅ "${testData.purchase.productName}" 봇이 표시되어야 함`);
  console.log('   ❌ 할당되지 않은 봇은 표시되지 않아야 함');
  
  console.log('\n4️⃣  봇 선택 및 메시지 전송:');
  console.log('   - 봇 선택');
  console.log('   - 메시지 입력: "안녕하세요"');
  console.log('   - 전송 버튼 클릭');
  
  console.log('\n5️⃣  응답 확인:');
  console.log('   ✅ 봇이 정상적으로 응답해야 함');
  console.log('   ❌ 권한 오류가 발생하면 안 됨');
}

async function testStep7_AccessDeniedAfterExpiry() {
  console.log('\n\n📋 테스트 7: 구독 만료 후 접근 차단 확인 (선택)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('Cloudflare D1 Database에서 구독 만료일을 과거로 변경:');
  console.log('\n```sql');
  console.log('UPDATE AcademyBotSubscription');
  console.log("SET subscriptionEnd = '2025-01-01T00:00:00Z'");
  console.log(`WHERE academyId = '${testData.academyId}'`);
  console.log(`AND productId = '${testData.purchase.productId}';`);
  console.log('```');
  
  console.log('\n학생 계정으로 AI 채팅 접속:');
  console.log(`   URL: ${BASE_URL}/ai-chat`);
  
  console.log('\n✅ 예상 결과:');
  console.log('   ❌ 봇 목록에 표시되지 않아야 함');
  console.log('   ❌ 메시지 전송 시 "구독이 만료되었습니다" 오류');
}

// 메인 실행
(async () => {
  console.log(`🕐 테스트 시작 시간: ${new Date().toLocaleString('ko-KR')}\n`);
  
  // Step 1: 구매 신청
  const result1 = await runTests();
  
  if (!result1.success) {
    console.log('\n\n⚠️  테스트 1이 실패하여 후속 테스트를 진행할 수 없습니다.');
    console.log('먼저 구매 신청 API 문제를 해결해주세요.');
    process.exit(1);
  }
  
  // Step 2-7: 수동 테스트 가이드
  await testStep2_CheckApprovalPage();
  await testStep3_ApproveRequest();
  await testStep4_VerifySubscription();
  await testStep5_AssignToStudent();
  await testStep6_StudentAccessBot();
  await testStep7_AccessDeniedAfterExpiry();
  
  console.log('\n\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║   테스트 요약                                                 ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  console.log('✅ 자동 테스트 완료:');
  console.log('   1. 외부 사용자 구매 신청');
  
  console.log('\n⏳ 수동 테스트 필요:');
  console.log('   2. 승인 페이지에서 신청 확인');
  console.log('   3. 구매 신청 승인');
  console.log('   4. AcademyBotSubscription 생성 확인');
  console.log('   5. 학생에게 봇 할당');
  console.log('   6. 학생이 봇 사용');
  console.log('   7. 구독 만료 후 접근 차단 확인');
  
  console.log('\n📝 다음 단계:');
  console.log('   위의 수동 테스트를 순서대로 진행해주세요.');
  console.log('   각 단계마다 예상 결과와 실제 결과를 비교하세요.');
  
  console.log(`\n🕐 테스트 종료 시간: ${new Date().toLocaleString('ko-KR')}`);
})();
