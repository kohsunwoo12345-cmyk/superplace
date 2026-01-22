const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = 'AIzaSyAAu9N0kySmg_AAQZ6huNqIuc-aCykYSaw';

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
