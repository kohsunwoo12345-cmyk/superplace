// 실제 Gemini API 직접 테스ト
const fetch = require('node-fetch');

const testGemini = async () => {
  const model = 'gemini-2.5-flash-lite';
  const apiVersion = 'v1beta';
  
  // 테스트용 API 키 (실제 키는 환경 변수에서)
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || 'TEST_KEY';
  
  const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: "안녕하세요" }]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2000,
      topP: 0.95
    }
  };
  
  console.log('🧪 Gemini API 직접 테스트');
  console.log('==========================');
  console.log(`📤 모델: ${model}`);
  console.log(`📤 API 버전: ${apiVersion}`);
  console.log(`📤 URL: ${url.replace(/key=.+/, 'key=[HIDDEN]')}`);
  console.log(`📤 Payload:`, JSON.stringify(payload, null, 2));
  console.log('');
  
  try {
    console.log('⏳ API 호출 중...');
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const responseText = await response.text();
    
    console.log(`📡 응답 상태: ${response.status} ${response.statusText}`);
    console.log('📡 응답 본문:');
    console.log(responseText);
    
    if (response.ok) {
      try {
        const json = JSON.parse(responseText);
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log('\n✅ AI 응답:', text);
      } catch (e) {
        console.error('❌ JSON 파싱 실패');
      }
    } else {
      console.error('\n❌ API 오류 발생');
    }
  } catch (error) {
    console.error('❌ 네트워크 오류:', error.message);
  }
};

testGemini();
