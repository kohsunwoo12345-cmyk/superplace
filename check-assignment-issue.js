// 학생 봇 할당 문제 진단 스크립트

console.log("🔍 학생 봇 할당 문제 진단");
console.log("=" .repeat(60));

console.log("\n📋 확인 사항:");
console.log("1. 학원장이 학생에게 봇을 할당했는가?");
console.log("   - /dashboard/admin/ai-bots/assign/ 에서 할당");
console.log("   - '개별 사용자에게 할당' 선택");
console.log("   - 학생 선택 + 봇 선택 + '할당' 클릭");

console.log("\n2. ai_bot_assignments 테이블에 데이터가 있는가?");
console.log("   Cloudflare D1 콘솔에서 확인:");
console.log(`
   SELECT * FROM ai_bot_assignments 
   WHERE userId = 'student-1773655529913-mreqe9a5qf'
   ORDER BY createdAt DESC 
   LIMIT 5;
`);

console.log("\n3. 할당 데이터 필수 필드:");
console.log("   - botId: 봇 ID (예: bot-xxx)");
console.log("   - userId: 학생 ID");
console.log("   - status: 'ACTIVE' 또는 'active'");
console.log("   - endDate: 만료일 (미래 날짜여야 함)");

console.log("\n4. /api/user/ai-bots API 호출 확인:");
console.log("   학생 로그인 후 F12 콘솔에서:");
console.log("   - API 호출: /api/user/ai-bots?academyId=xxx&userId=yyy");
console.log("   - 응답: { success: true, bots: [...], count: N }");

console.log("\n5. status 필드 대소문자 문제 가능성:");
console.log("   - 현재 API: WHERE status = 'ACTIVE'");
console.log("   - 실제 DB: status = 'active' (소문자)?");
console.log("   → 대소문자 불일치 시 조회 안 됨!");

console.log("\n" + "=".repeat(60));
console.log("🔧 해결 방법:");
console.log("1. D1 콘솔에서 실제 데이터 확인");
console.log("2. status 필드 값 확인 (ACTIVE vs active)");
console.log("3. endDate가 미래 날짜인지 확인");
console.log("4. F12 콘솔에서 API 응답 확인");
