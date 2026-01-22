require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  try {
    console.log('API Key:', process.env.GOOGLE_GEMINI_API_KEY?.substring(0, 10) + '...');
    
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      throw new Error('API 키가 설정되지 않았습니다');
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
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
  }
}

testGemini();
