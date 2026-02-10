interface Env {
  DB: D1Database;
  GOOGLE_GEMINI_API_KEY: string;
}

/**
 * POST /api/homework/generate-similar-problems
 * 학생의 약점 유형을 분석하여 유사문제 생성
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB, GOOGLE_GEMINI_API_KEY } = context.env;
    const body = await context.request.json();
    const { studentId, weaknessTypes, studentName } = body;

    if (!DB || !GOOGLE_GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!studentId || !weaknessTypes || weaknessTypes.length === 0) {
      return new Response(
        JSON.stringify({ error: "studentId and weaknessTypes are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`🎯 유사문제 생성 요청: ${studentName} (ID: ${studentId})`);
    console.log(`📋 약점 유형: ${weaknessTypes.join(', ')}`);

    // Gemini API를 사용하여 유사문제 생성
    const prompt = `당신은 수학 교육 전문가입니다. 다음 약점 유형을 가진 학생을 위한 맞춤형 유사문제를 생성해주세요.

학생 정보:
- 이름: ${studentName}
- 약점 유형: ${weaknessTypes.join(', ')}

요구사항:
1. 각 약점 유형마다 2-3개의 문제를 생성하세요
2. 문제는 학생의 수준에 맞춰 점진적으로 난이도를 높이세요
3. 문제마다 힌트를 제공하세요
4. 정답과 상세한 풀이를 포함하세요
5. HTML 형식으로 작성하세요 (div.problem 클래스 사용)

출력 형식:
<div class="problem">
  <h3>문제 1: [약점 유형]</h3>
  <p>[문제 내용]</p>
  <details>
    <summary>💡 힌트</summary>
    <p>[힌트 내용]</p>
  </details>
  <details>
    <summary>✅ 정답 및 풀이</summary>
    <p><strong>정답:</strong> [정답]</p>
    <pre>[풀이 과정]</pre>
  </details>
</div>

각 약점 유형에 대해 위 형식으로 문제를 생성해주세요.`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_GEMINI_API_KEY}`;
    
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
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!generatedText) {
      throw new Error('No content generated from Gemini API');
    }

    console.log('✅ 유사문제 생성 완료');

    return new Response(
      JSON.stringify({
        success: true,
        problems: generatedText,
        weaknessTypes,
        studentName
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
