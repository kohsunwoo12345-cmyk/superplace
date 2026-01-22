const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('❌ 오류: GOOGLE_GEMINI_API_KEY 또는 GEMINI_API_KEY 환경 변수를 설정해주세요.');
  process.exit(1);
}

async function test() {
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'models/gemini-pro' });
    
    console.log('Testing Gemini API...');
    const result = await model.generateContent('안녕하세요! 2+2는 얼마인가요?');
    const response = await result.response;
    const text = response.text();
    
    console.log('\n✅ 응답:');
    console.log(text);
  } catch (error) {
    console.error('\n❌ 오류:', error.message);
  }
}

test();
