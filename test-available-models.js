const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testModels() {
  const API_KEY = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!API_KEY) {
    console.error('❌ API 키가 설정되지 않았습니다.');
    return;
  }
  
  console.log('🔑 API 키:', API_KEY.substring(0, 10) + '...');
  console.log('');
  
  const genAI = new GoogleGenerativeAI(API_KEY);
  
  const modelsToTest = [
    'gemini-pro',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-1.5-pro-latest',
    'gemini-1.5-flash-latest',
  ];
  
  for (const modelName of modelsToTest) {
    try {
      console.log(`\n🧪 테스트 중: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent('Say "Hello" in Korean (one word only)');
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ ${modelName} 작동!`);
      console.log(`응답: ${text}`);
      console.log(`\n🎯 사용할 모델: ${modelName}`);
      break; // 첫 번째 작동하는 모델 찾으면 종료
    } catch (error) {
      console.log(`❌ ${modelName} 실패: ${error.message.split('\n')[0]}`);
    }
  }
}

testModels();
