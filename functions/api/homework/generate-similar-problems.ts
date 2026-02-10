interface Env {
  DB: D1Database;
  GOOGLE_GEMINI_API_KEY: string;
}

interface ProblemCategory {
  basic: string;
  variation: string;
  advanced: string;
}

/**
 * POST /api/homework/generate-similar-problems
 * 학생의 약점 유형을 분석하여 유사문제 생성 (기본/변형/심화)
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB, GOOGLE_GEMINI_API_KEY } = context.env;
    const body = await context.request.json();
    const { studentId, weaknessTypes, studentName } = body;

    if (!GOOGLE_GEMINI_API_KEY) {
      console.error('❌ GOOGLE_GEMINI_API_KEY environment variable not configured');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "GOOGLE_GEMINI_API_KEY environment variable not configured" 
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
    console.log(`📋 약점 유형: ${weaknessTypes.join(', ')}`);

    // Gemini API를 사용하여 유사문제 생성 (기본/변형/심화 구분)
    const prompt = `당신은 수학 교육 전문가입니다. 다음 약점 유형을 가진 학생을 위한 맞춤형 유사문제를 생성해주세요.

학생 정보:
- 이름: ${studentName}
- 약점 유형: ${weaknessTypes.join(', ')}

요구사항:
1. 각 약점 유형마다 **3가지 난이도**의 문제를 생성하세요:
   - **기본 유형 문제**: 개념 이해를 위한 기초 문제 (쉬움)
   - **변형 문제**: 유사하지만 약간 변형된 문제 (보통)
   - **심화 문제**: 개념을 응용한 고난도 문제 (어려움)

2. 각 문제는 다음 형식을 따르세요:
   - 명확한 문제 설명
   - 💡 힌트 제공
   - ✅ 정답 및 상세 풀이

3. HTML 형식으로 작성하세요 (아래 형식 엄수)

출력 형식 (정확히 이 구조를 따르세요):

<div class="problem-section">
  <h2 class="weakness-title">🎯 약점: [약점 유형]</h2>
  
  <div class="difficulty-group">
    <h3 class="difficulty-level basic">📌 기본 유형 문제</h3>
    <div class="problem">
      <div class="problem-content">
        <p><strong>문제:</strong> [기본 문제 내용]</p>
      </div>
      <details class="hint">
        <summary>💡 힌트</summary>
        <p>[힌트 내용]</p>
      </details>
      <details class="solution">
        <summary>✅ 정답 및 풀이</summary>
        <p><strong>정답:</strong> [정답]</p>
        <div class="solution-steps">
          <p><strong>풀이:</strong></p>
          <ol>
            <li>[단계 1]</li>
            <li>[단계 2]</li>
            <li>[단계 3]</li>
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
        <p>[힌트 내용]</p>
      </details>
      <details class="solution">
        <summary>✅ 정답 및 풀이</summary>
        <p><strong>정답:</strong> [정답]</p>
        <div class="solution-steps">
          <p><strong>풀이:</strong></p>
          <ol>
            <li>[단계 1]</li>
            <li>[단계 2]</li>
            <li>[단계 3]</li>
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
        <p>[힌트 내용]</p>
      </details>
      <details class="solution">
        <summary>✅ 정답 및 풀이</summary>
        <p><strong>정답:</strong> [정답]</p>
        <div class="solution-steps">
          <p><strong>풀이:</strong></p>
          <ol>
            <li>[단계 1]</li>
            <li>[단계 2]</li>
            <li>[단계 3]</li>
          </ol>
        </div>
      </details>
    </div>
  </div>
</div>

각 약점 유형에 대해 위 형식으로 기본/변형/심화 문제를 모두 생성해주세요.`;

    console.log('🔄 Calling Gemini API for similar problem generation...');
    console.log(`📍 Using endpoint: gemini-1.5-flash`);

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
      throw new Error(`Gemini API failed: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!generatedText) {
      throw new Error('No content generated from Gemini API');
    }

    console.log('✅ 유사문제 생성 완료');
    console.log(`📊 생성된 문제 길이: ${generatedText.length} characters`);

    return new Response(
      JSON.stringify({
        success: true,
        problems: generatedText,
        weaknessTypes,
        studentName,
        generatedAt: new Date().toISOString()
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
