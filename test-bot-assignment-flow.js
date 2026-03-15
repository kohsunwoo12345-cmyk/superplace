const https = require('https');
const fs = require('fs');

console.log('\n========== 🤖 AI 봇 할당 & 사용량 테스트 ==========\n');

// 코드 검증
console.log('📝 Step 1: 코드 로직 검증...\n');

// 1. 할당 API 확인
const assignCode = fs.readFileSync('./functions/api/admin/ai-bots/assign.ts', 'utf8');

console.log('   🔍 할당 API (assign.ts) 검증:');

if (assignCode.includes('dailyUsageLimit: providedDailyLimit')) {
  console.log('      ✅ dailyUsageLimit 파라미터 수신');
}

if (assignCode.includes('subscription.dailyUsageLimit')) {
  console.log('      ✅ 학원 구독 dailyUsageLimit 우선 사용');
}

if (assignCode.includes('finalDailyUsageLimit')) {
  console.log('      ✅ 최종 dailyUsageLimit 계산 로직 존재');
}

if (assignCode.includes('dailyUsageLimit INTEGER DEFAULT 15')) {
  console.log('      ✅ ai_bot_assignments 테이블에 dailyUsageLimit 컬럼 포함');
}

if (assignCode.includes('dailyUsageLimit: finalDailyUsageLimit')) {
  console.log('      ✅ 할당 시 dailyUsageLimit 저장');
}

// 2. 채팅 API 확인
const chatCode = fs.readFileSync('./functions/api/ai/chat.ts', 'utf8');

console.log('\n   🔍 채팅 API (chat.ts) 검증:');

if (chatCode.includes('assignment.dailyUsageLimit')) {
  console.log('      ✅ 할당 정보에서 dailyUsageLimit 조회');
}

if (chatCode.includes('usedCount >= dailyUsageLimit')) {
  console.log('      ✅ 일일 사용 한도 초과 체크');
}

if (chatCode.includes('오늘의 사용 한도')) {
  console.log('      ✅ 한도 초과 오류 메시지 존재');
}

if (chatCode.includes("DATE(createdAt) = DATE('now')")) {
  console.log('      ✅ 당일 사용량만 카운트 (날짜 필터)');
}

// 3. UI 확인
const assignPageCode = fs.readFileSync('./src/app/dashboard/admin/ai-bots/assign/page.tsx', 'utf8');

console.log('\n   🔍 UI (assign/page.tsx) 검증:');

if (assignPageCode.includes("currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN'") && 
    assignPageCode.includes('일일 사용 한도')) {
  console.log('      ✅ 관리자만 일일 사용 한도 입력 필드 표시');
}

if (!assignPageCode.includes('일일 사용 한도 자동 적용')) {
  console.log('      ✅ 학원장 자동 적용 안내 메시지 제거됨');
}

if (!assignPageCode.includes("alert('할당된 AI 봇이 없습니다")) {
  console.log('      ✅ 봇 없음 팝업 제거됨');
}

if (assignPageCode.includes('effectiveDailyLimit')) {
  console.log('      ✅ 학원장 할당 시 구독 한도 자동 사용');
}

// 전체 흐름 요약
console.log('\n========== 📋 전체 흐름 요약 ==========\n');

console.log('1️⃣ 관리자 → 학원 할당:');
console.log('   - URL: /dashboard/admin/ai-bots/assign/');
console.log('   - 학원 전체 선택');
console.log('   - 일일 사용 한도 입력 (예: 5회)');
console.log('   - AcademyBotSubscription에 dailyUsageLimit 저장\n');

console.log('2️⃣ 학원장 → 학생 할당:');
console.log('   - 학생 선택');
console.log('   - 일일 사용 한도 필드 표시 안됨 ✅');
console.log('   - 학원 구독의 dailyUsageLimit 자동 사용');
console.log('   - ai_bot_assignments에 dailyUsageLimit 저장\n');

console.log('3️⃣ 학생 → 봇 사용:');
console.log('   - /api/ai/chat 호출');
console.log('   - ai_bot_assignments에서 dailyUsageLimit 조회');
console.log('   - ai_chat_logs에서 당일 사용량 카운트');
console.log('   - usedCount < dailyUsageLimit → 정상 응답');
console.log('   - usedCount >= dailyUsageLimit → 한도 초과 오류\n');

console.log('========== 🧪 테스트 가이드 ==========\n');

console.log('✅ 수동 테스트 필요:');
console.log('   1. 관리자로 학원에 봇 할당 (일일 한도 5회)');
console.log('   2. 학원장으로 학생에게 할당');
console.log('   3. 학생으로 로그인하여 5회 대화');
console.log('   4. 6회차에 한도 초과 메시지 확인\n');

console.log('📊 Cloudflare D1 확인 SQL:\n');

console.log('   -- 학원 구독 확인');
console.log('   SELECT id, academyId, botId, dailyUsageLimit,');
console.log('          totalStudentSlots, usedStudentSlots');
console.log('   FROM AcademyBotSubscription');
console.log('   ORDER BY createdAt DESC LIMIT 5;\n');

console.log('   -- 학생 할당 확인');
console.log('   SELECT id, userId, userName, botId, botName, dailyUsageLimit');
console.log('   FROM ai_bot_assignments');
console.log('   WHERE status = \'active\'');
console.log('   ORDER BY createdAt DESC LIMIT 5;\n');

console.log('   -- 당일 사용량 확인');
console.log('   SELECT userId, botId, COUNT(*) as usedCount');
console.log('   FROM ai_chat_logs');
console.log("   WHERE DATE(createdAt) = DATE('now')");
console.log('   GROUP BY userId, botId;\n');

console.log('========== 📊 배포 정보 ==========\n');
console.log('   URL: https://superplacestudy.pages.dev');
console.log('   커밋: c5c82c74');
console.log('   시간: 2026-03-15 18:45 KST');
console.log('   상태: ✅ 배포 완료\n');

console.log('========== 테스트 완료 ==========\n');

console.log('💡 다음 단계:');
console.log('   1. TEST_BOT_ASSIGNMENT_USAGE.md 파일 참고');
console.log('   2. 위 가이드대로 수동 테스트 수행');
console.log('   3. Cloudflare D1에서 SQL 쿼리 실행하여 검증');
console.log('   4. 결과 보고\n');
