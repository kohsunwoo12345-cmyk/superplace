interface Env {
  DB: D1Database;
  GOOGLE_GEMINI_API_KEY: string;
}

/**
 * 디버깅용 엔드포인트 - 환경 변수 및 시스템 상태 확인
 * GET /api/homework/debug
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB, GOOGLE_GEMINI_API_KEY } = context.env;

    // 환경 변수 체크
    const hasDB = !!DB;
    const hasGeminiKey = !!GOOGLE_GEMINI_API_KEY;
    const geminiKeyLength = GOOGLE_GEMINI_API_KEY ? GOOGLE_GEMINI_API_KEY.length : 0;
    const geminiKeyPrefix = GOOGLE_GEMINI_API_KEY 
      ? GOOGLE_GEMINI_API_KEY.substring(0, 10) + '...' 
      : 'NOT_SET';

    // DB 테스트
    let dbTest = { success: false, error: '' };
    if (DB) {
      try {
        const result = await DB.prepare('SELECT 1 as test').first();
        dbTest = { success: true, error: '' };
      } catch (error: any) {
        dbTest = { success: false, error: error.message };
      }
    }

    // Gemini API 테스트 (간단한 요청)
    let geminiTest = { success: false, error: '', statusCode: 0 };
    if (GOOGLE_GEMINI_API_KEY) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: 'Hello, this is a test.' }]
              }]
            })
          }
        );

        geminiTest.statusCode = response.status;
        
        if (response.ok) {
          const data = await response.json();
          geminiTest.success = !!data.candidates;
          geminiTest.error = geminiTest.success ? '' : 'Invalid response structure';
        } else {
          const errorData = await response.text();
          geminiTest.error = `HTTP ${response.status}: ${errorData.substring(0, 200)}`;
        }
      } catch (error: any) {
        geminiTest.error = error.message;
      }
    }

    // 환경 정보
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {
        hasDatabase: hasDB,
        hasGeminiApiKey: hasGeminiKey,
        geminiKeyLength: geminiKeyLength,
        geminiKeyPrefix: geminiKeyPrefix,
      },
      tests: {
        database: dbTest,
        geminiApi: geminiTest,
      },
      recommendations: []
    };

    // 권장 사항
    if (!hasDB) {
      diagnostics.recommendations.push('❌ DB가 바인딩되지 않았습니다. Cloudflare D1 데이터베이스 바인딩을 확인하세요.');
    }
    if (!hasGeminiKey) {
      diagnostics.recommendations.push('❌ GOOGLE_GEMINI_API_KEY가 설정되지 않았습니다. Cloudflare 환경 변수를 확인하세요.');
    }
    if (hasGeminiKey && geminiKeyLength < 30) {
      diagnostics.recommendations.push('⚠️ GOOGLE_GEMINI_API_KEY의 길이가 너무 짧습니다. 올바른 API 키인지 확인하세요.');
    }
    if (!dbTest.success) {
      diagnostics.recommendations.push(`❌ DB 테스트 실패: ${dbTest.error}`);
    }
    if (!geminiTest.success && hasGeminiKey) {
      diagnostics.recommendations.push(`❌ Gemini API 테스트 실패: ${geminiTest.error}`);
    }
    if (dbTest.success && geminiTest.success) {
      diagnostics.recommendations.push('✅ 모든 시스템이 정상입니다!');
    }

    return new Response(
      JSON.stringify(diagnostics, null, 2),
      { 
        status: 200, 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        } 
      }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: 'Debug endpoint error',
        message: error.message,
        stack: error.stack
      }, null, 2),
      { 
        status: 500, 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        } 
      }
    );
  }
};
