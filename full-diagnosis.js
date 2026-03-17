console.log('🔍 전체 진단 시작\n');

console.log('📋 현재 상황:');
console.log('1. 관리자가 학원장에게 AI 봇 할당 ✅');
console.log('2. 할당 받은 목록에도 나옴 ✅');
console.log('3. AI 챗봇 페이지에 봇이 안 보임 ❌');
console.log('4. 학생에게 봇 할당 불가 ❌\n');

console.log('🔍 확인해야 할 파일들:');
console.log('\n[1단계] 학원장이 할당받은 봇 목록 조회');
console.log('   - 파일: functions/api/admin/ai-bots/assignments.ts (GET)');
console.log('   - 역할: 학원장의 할당받은 봇 목록 반환');

console.log('\n[2단계] AI 챗봇 페이지에서 봇 목록 표시');
console.log('   - 파일: src/app/dashboard/ai-chatbot/page.tsx');
console.log('   - API: /api/admin/ai-bots/assignments');
console.log('   - 역할: 할당받은 봇들을 화면에 표시');

console.log('\n[3단계] 학생에게 봇 할당');
console.log('   - 파일: functions/api/admin/ai-bots/assign.ts (POST)');
console.log('   - 역할: 학원장이 학생에게 봇 할당');

console.log('\n🎯 검증 필요 항목:');
console.log('   ✓ assignments.ts: academyId로 구독 조회하는가?');
console.log('   ✓ page.tsx: API 응답을 제대로 파싱하는가?');
console.log('   ✓ assign.ts: 학생 할당 시 구독 확인하는가?');
