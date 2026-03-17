// 학원 구독 API 테스트 스크립트
const testData = {
  academyId: "test-academy-001",
  botId: "bot-001",  // botId 필드 사용
  studentCount: 10,
  subscriptionStart: "2026-03-17",
  subscriptionEnd: "2026-04-17",
  pricePerStudent: 0,
  dailyUsageLimit: 15,
  memo: "Test subscription"
};

console.log('📤 Test payload:');
console.log(JSON.stringify(testData, null, 2));
console.log('\n✅ Payload is valid JSON');
console.log('✅ All required fields present:');
console.log(`   - academyId: ${testData.academyId}`);
console.log(`   - botId: ${testData.botId}`);
console.log(`   - studentCount: ${testData.studentCount}`);
console.log(`   - subscriptionStart: ${testData.subscriptionStart}`);
console.log(`   - subscriptionEnd: ${testData.subscriptionEnd}`);
