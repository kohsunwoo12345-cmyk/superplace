interface Env {
  DB: D1Database;
  GOOGLE_GEMINI_API_KEY: string;
}

/**
 * POST /api/homework/generate-similar-problems
 * 학생의 약점 유형을 분석하여 Gemini API로 유사문제 생성 (기본/변형/심화)
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { GOOGLE_GEMINI_API_KEY } = context.env;
    const body = await context.request.json();
    const { studentId, weaknessTypes, studentName } = body;

    // API 키 검증
    if (!GOOGLE_GEMINI_API_KEY) {
      console.error('❌ GOOGLE_GEMINI_API_KEY environment variable not configured');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "GOOGLE_GEMINI_API_KEY가 설정되지 않았습니다. Cloudflare 환경 변수를 확인해주세요." 
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!studentId || !weaknessTypes || weaknessTypes.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "studentId and weaknessTypes are required" 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`🎯 유사문제 생성 요청: ${studentName} (ID: ${studentId})`);
    console.log(`📋 약점 유형 (${weaknessTypes.length}개): ${weaknessTypes.join(', ')}`);

    // Gemini API 프롬프트 생성
    const prompt = `당신은 수학 교육 전문가입니다. 다음 약점 유형을 가진 학생을 위한 맞춤형 유사문제를 생성해주세요.

학생 정보:
- 이름: ${studentName}
- 약점 유형: ${weaknessTypes.join(', ')}

요구사항:
1. 각 약점 유형마다 **반드시 3가지 난이도**의 문제를 생성하세요:
   - **📌 기본 유형 문제**: 개념 이해를 위한 기초 문제 (쉬움)
   - **🔄 변형 문제**: 유사하지만 약간 변형된 문제 (보통)
   - **🚀 심화 문제**: 개념을 응용한 고난도 문제 (어려움)

2. 각 문제는 다음을 포함해야 합니다:
   - 명확한 문제 설명
   - 💡 힌트 제공
   - ✅ 정답 및 단계별 풀이

3. **반드시 아래 HTML 형식을 정확히 따르세요**:

<div class="problem-section">
  <h2 class="weakness-title">🎯 약점: [약점 유형명]</h2>
  
  <div class="difficulty-group">
    <h3 class="difficulty-level basic">📌 기본 유형 문제</h3>
    <div class="problem">
      <div class="problem-content">
        <p><strong>문제:</strong> [구체적인 문제 내용을 여기에 작성]</p>
      </div>
      <details class="hint">
        <summary>💡 힌트</summary>
        <p>[학생이 문제를 풀 수 있도록 도움이 되는 힌트]</p>
      </details>
      <details class="solution">
        <summary>✅ 정답 및 풀이</summary>
        <p><strong>정답:</strong> [정답]</p>
        <div class="solution-steps">
          <p><strong>풀이:</strong></p>
          <ol>
            <li>[풀이 단계 1]</li>
            <li>[풀이 단계 2]</li>
            <li>[풀이 단계 3]</li>
          </ol>
        </div>
      </details>
    </div>
  </div>

  <div class="difficulty-group">
    <h3 class="difficulty-level variation">🔄 변형 문제</h3>
    <div class="problem">
      <div class="problem-content">
        <p><strong>문제:</strong> [변형 문제 내용]</p>
      </div>
      <details class="hint">
        <summary>💡 힌트</summary>
        <p>[힌트]</p>
      </details>
      <details class="solution">
        <summary>✅ 정답 및 풀이</summary>
        <p><strong>정답:</strong> [정답]</p>
        <div class="solution-steps">
          <p><strong>풀이:</strong></p>
          <ol>
            <li>[풀이 단계 1]</li>
            <li>[풀이 단계 2]</li>
            <li>[풀이 단계 3]</li>
          </ol>
        </div>
      </details>
    </div>
  </div>

  <div class="difficulty-group">
    <h3 class="difficulty-level advanced">🚀 심화 문제</h3>
    <div class="problem">
      <div class="problem-content">
        <p><strong>문제:</strong> [심화 문제 내용]</p>
      </div>
      <details class="hint">
        <summary>💡 힌트</summary>
        <p>[힌트]</p>
      </details>
      <details class="solution">
        <summary>✅ 정답 및 풀이</summary>
        <p><strong>정답:</strong> [정답]</p>
        <div class="solution-steps">
          <p><strong>풀이:</strong></p>
          <ol>
            <li>[풀이 단계 1]</li>
            <li>[풀이 단계 2]</li>
            <li>[풀이 단계 3]</li>
          </ol>
        </div>
      </details>
    </div>
  </div>
</div>

중요: 
- 각 약점 유형마다 위 구조를 정확히 따라 작성하세요
- 대괄호 [...] 부분을 실제 내용으로 채우세요
- HTML 태그와 클래스명을 정확히 사용하세요
- 수학 기호는 유니코드로 표현하세요 (예: ², ³, ×, ÷, ≠, ≤, ≥)

약점 유형별 문제 예시:
- "문자 곱셈 시 지수 처리": x × x = x², 3x × 2x = 6x², (2x)² × 3x = 12x³
- "다항식의 완전한 분배": 2(x+3), (x+2)(x+3), (x+1)(x²-x+1)
- "완전 제곱 공식": (x+2)², (x-3)², (x+1)²-(x-1)²
- "계수 계산": 2x+3x, 5x-2x+3, 3(2x+1)-2(x-3)
- "지수법칙": x²×x³, (x²)³, (2x²)³×x⁴

각 약점 유형에 대해 위 HTML 형식으로 문제를 생성해주세요.`;

    console.log('🔄 Calling Gemini API for similar problem generation...');
    console.log(`📍 Using model: gemini-1.5-flash`);
    console.log(`📍 API Key length: ${GOOGLE_GEMINI_API_KEY.length} characters`);

    // Gemini API 호출
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_GEMINI_API_KEY}`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Gemini API failed: ${response.status}`, errorText);
      
      // 에러 상세 정보 제공
      let errorMessage = `Gemini API 호출 실패 (${response.status})`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        }
      } catch (e) {
        errorMessage = errorText.substring(0, 200);
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('📦 Gemini API response received');
    
    // 응답 파싱
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!generatedText) {
      console.error('❌ No content generated from Gemini API');
      console.error('Response structure:', JSON.stringify(data, null, 2));
      throw new Error('Gemini API에서 문제를 생성하지 못했습니다.');
    }

    console.log('✅ 유사문제 생성 완료');
    console.log(`📊 생성된 문제 길이: ${generatedText.length} characters`);

    // HTML 정리 (불필요한 마크다운 코드 블록 제거)
    let cleanedHTML = generatedText;
    if (cleanedHTML.includes('```html')) {
      cleanedHTML = cleanedHTML.replace(/```html\n?/g, '').replace(/```\n?/g, '');
    }
    if (cleanedHTML.includes('```')) {
      cleanedHTML = cleanedHTML.replace(/```\n?/g, '');
    }

    return new Response(
      JSON.stringify({
        success: true,
        problems: cleanedHTML,
        weaknessTypes,
        studentName,
        generatedAt: new Date().toISOString(),
        model: 'gemini-1.5-flash'
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      }
    );

  } catch (error: any) {
    console.error("❌ 유사문제 생성 오류:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "유사문제 생성 중 오류가 발생했습니다"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
