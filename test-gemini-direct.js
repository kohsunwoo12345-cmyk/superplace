const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
    console.log('API Key:', process.env.GOOGLE_GEMINI_API_KEY?.substring(0, 10) + '...');
    
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    console.log('Model initialized');
    
    const result = await model.generateContent('안녕하세요! 간단히 자기소개해주세요.');
    const response = await result.response;
    const text = response.text();
    
    console.log('\nAI 응답:');
    console.log(text);
    console.log('\n✅ 테스트 성공!');
  } catch (error) {
    console.error('❌ 오류:', error.message);
    if (error.response) {
      console.error('상태:', error.response.status);
      console.error('상태 텍스트:', error.response.statusText);
    }
  }
}

testGemini();
