const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testAvailableModels() {
  const API_KEY = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!API_KEY) {
    console.error('❌ API 키가 설정되지 않았습니다.');
    console.log('\n사용법:');
    console.log('GOOGLE_GEMINI_API_KEY=your_key node test-models-detailed.js');
    return;
  }
  
  console.log('🔑 API 키:', API_KEY.substring(0, 15) + '...');
  console.log('');
  
  const genAI = new GoogleGenerativeAI(API_KEY);
  
  // 테스트할 모델 목록 (최신 모델부터)
  const modelsToTest = [
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash-002',
    'gemini-1.5-flash-001',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash',
    'gemini-1.5-pro-002',
    'gemini-1.5-pro-001',
    'gemini-1.5-pro-latest',
    'gemini-1.5-pro',
    'gemini-pro',
    'gemini-1.0-pro',
  ];
  
  console.log('🧪 Google Gemini 모델 테스트 시작...\n');
  
  let workingModel = null;
  
  for (const modelName of modelsToTest) {
    try {
      console.log(`테스트 중: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent('Say "Hello" in one word');
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ ${modelName} 작동!`);
      console.log(`   응답: ${text.substring(0, 50)}`);
      console.log('');
      
      workingModel = modelName;
      break; // 첫 번째 작동하는 모델 찾으면 종료
    } catch (error) {
      const errorMsg = error.message.split('\n')[0];
      if (errorMsg.includes('404') || errorMsg.includes('not found')) {
        console.log(`❌ ${modelName}: 모델을 찾을 수 없음`);
      } else if (errorMsg.includes('API key')) {
        console.log(`❌ ${modelName}: API 키 오류`);
        console.log(`   상세: ${errorMsg}`);
        break; // API 키 자체가 문제면 종료
      } else if (errorMsg.includes('quota')) {
        console.log(`❌ ${modelName}: 할당량 초과`);
      } else {
        console.log(`❌ ${modelName}: ${errorMsg.substring(0, 80)}`);
      }
    }
  }
  
  console.log('\n========================================');
  if (workingModel) {
    console.log(`✅ 사용 가능한 모델: ${workingModel}`);
    console.log('');
    console.log('📝 코드 수정 필요:');
    console.log('src/app/api/ai/chat/route.ts 파일에서');
    console.log(`model: '${workingModel}'`);
    console.log('로 변경하세요.');
  } else {
    console.log('❌ 사용 가능한 모델을 찾을 수 없습니다.');
    console.log('');
    console.log('가능한 원인:');
    console.log('1. API 키가 유효하지 않음');
    console.log('2. Generative Language API가 활성화되지 않음');
    console.log('3. 할당량 초과');
    console.log('');
    console.log('확인 방법:');
    console.log('1. https://aistudio.google.com/app/apikey');
    console.log('2. https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com');
  }
  console.log('========================================');
}

testAvailableModels().catch(console.error);
