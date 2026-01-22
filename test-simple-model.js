const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = 'AIzaSyAAu9N0kySmg_AAQZ6huNqIuc-aCykYSaw';

async function test() {
  const models = ['gemini-pro', 'gemini-1.0-pro', 'gemini-1.5-flash-latest', 'gemini-1.5-pro-latest'];
  
  for (const modelName of models) {
    try {
      console.log(`\nTesting: ${modelName}...`);
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent('Say hello in Korean');
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ ${modelName} works!`);
      console.log('Response:', text.substring(0, 100));
      break;
    } catch (error) {
      console.log(`❌ ${modelName} failed:`, error.message.split('\n')[0]);
    }
  }
}

test();
