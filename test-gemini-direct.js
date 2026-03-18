// Gemini API 직접 테스트 (topK 없이)
const GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY || 'YOUR_API_KEY';

const testGeminiAPI = async () => {
  const model = 'gemini-2.5-flash-lite';
  const apiVersion = 'v1beta';
  const endpoint = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${GOOGLE_GEMINI_API_KEY}`;
  
  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: "안녕하세요"
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 1,
      maxOutputTokens: 4096,
      topP: 0.95
    },
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      }
    ]
  };

  console.log('🧪 Gemini API 직접 테스트 시작...\n');
  console.log('📤 요청 URL:', endpoint.replace(/key=.+/, 'key=[HIDDEN]'));
  console.log('📤 요청 Body:', JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('\n📡 응답 상태:', response.status, response.statusText);
    
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('❌ 에러 응답:', responseText);
      try {
        const errorJson = JSON.parse(responseText);
        console.error('❌ 파싱된 에러:', JSON.stringify(errorJson, null, 2));
      } catch (e) {
        console.error('❌ JSON 파싱 실패');
      }
    } else {
      console.log('✅ 성공 응답:', responseText.substring(0, 500));
      try {
        const successJson = JSON.parse(responseText);
        const text = successJson.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log('✅ AI 응답:', text);
      } catch (e) {
        console.error('❌ 응답 파싱 실패');
      }
    }
  } catch (error) {
    console.error('❌ 네트워크 에러:', error.message);
  }
};

testGeminiAPI();
