// Gemini 2.5 Flash Lite 모델 API 가용성 테스트

const testModels = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash-lite-preview-09-2025',
  'gemini-2.5-flash',
  'gemini-flash-lite-latest',
];

console.log('=== Gemini 2.5 Flash Lite 모델 테스트 ===\n');
console.log('📝 공식 문서 조사 결과:\n');
console.log('1. Vertex AI (Google Cloud):');
console.log('   ✅ gemini-2.5-flash-lite (GA 버전)');
console.log('   ✅ gemini-2.5-flash-lite-preview-09-2025 (Preview 버전)');
console.log('\n2. Google Gemini API:');
console.log('   ❓ 문서에 명시 안됨 - 테스트 필요\n');

console.log('=== 가능한 해결책 ===\n');
console.log('옵션 1: gemini-2.5-flash 사용 (더 빠르고 안정적)');
console.log('옵션 2: gemini-2.5-flash-lite-preview-09-2025 (Preview 버전)');
console.log('옵션 3: 현재 모델명이 DB에 정확히 저장되어있는지 확인');

console.log('\n=== 다음 단계 ===');
console.log('1. DB에서 봇 설정 모델명 확인');
console.log('2. Gemini API 공식 모델 리스트 확인');
console.log('3. 필요시 모델명 수정');
