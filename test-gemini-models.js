// Gemini 모델 테스트 스크립트

const models = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-1.0-pro'
];

console.log('🧪 Gemini 모델 API 버전 테스트\n');

models.forEach(model => {
  let apiVersion = 'v1beta';
  if (model.includes('1.0') || model.includes('2.0')) {
    apiVersion = 'v1';
  }
  
  const endpoint = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent`;
  
  console.log(`📌 ${model}`);
  console.log(`   API 버전: ${apiVersion}`);
  console.log(`   엔드포인트: ${endpoint}`);
  console.log('');
});

console.log('❓ 문제 분석:');
console.log('- gemini-2.0-flash-exp는 v1을 사용하지만 실제로는 v1beta를 사용해야 함');
console.log('- gemini-2.5-flash-lite는 v1beta 사용 (정상)');
console.log('- gemini-1.0-pro는 v1 사용 (정상)');
