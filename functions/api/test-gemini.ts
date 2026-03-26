// TEST API: Gemini API 키 및 연결 테스트
// GET /api/test-gemini

interface Env {
  GOOGLE_GEMINI_API_KEY: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const apiKey = context.env.GOOGLE_GEMINI_API_KEY;
  
  const result: any = {
    timestamp: new Date().toISOString(),
    apiKeyExists: !!apiKey,
    apiKeyLength: apiKey?.length || 0,
    apiKeyPrefix: apiKey?.substring(0, 10) || 'N/A',
  };
  
  // Gemini API 테스트 호출
  if (apiKey) {
    try {
      const testModel = 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${testModel}:generateContent?key=${apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: '안녕하세요' }]
          }]
        })
      });
      
      result.geminiTest = {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      };
      
      if (response.ok) {
        const data = await response.json();
        result.geminiTest.responseLength = JSON.stringify(data).length;
        result.geminiTest.hasText = !!data.candidates?.[0]?.content?.parts?.[0]?.text;
        result.geminiTest.text = data.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 100);
      } else {
        const errorText = await response.text();
        result.geminiTest.error = errorText.substring(0, 500);
      }
      
    } catch (error: any) {
      result.geminiTest = {
        error: error.message,
        stack: error.stack?.substring(0, 500),
      };
    }
  }
  
  return new Response(JSON.stringify(result, null, 2), {
    status: 200,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  });
};
