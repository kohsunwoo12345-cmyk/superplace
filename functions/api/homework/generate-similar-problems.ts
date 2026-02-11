interface Env {
  DB: D1Database;
  GOOGLE_GEMINI_API_KEY?: string;
}

/**
 * 약점 유형별 문제 템플릿
 */
const PROBLEM_TEMPLATES: Record<string, {
  basic: { problem: string; hint: string; answer: string; steps: string[] };
  variation: { problem: string; hint: string; answer: string; steps: string[] };
  advanced: { problem: string; hint: string; answer: string; steps: string[] };
}> = {
  "문자 곱셈 시 지수 처리": {
    basic: {
      problem: "다음을 간단히 하시오: x × x",
      hint: "같은 문자끼리 곱할 때는 지수를 더합니다. x¹ × x¹ = x²",
      answer: "x²",
      steps: [
        "x를 x¹로 나타냅니다",
        "x¹ × x¹에서 지수를 더합니다: 1 + 1 = 2",
        "따라서 x²입니다"
      ]
    },
    variation: {
      problem: "다음을 간단히 하시오: 3x × 2x",
      hint: "계수는 계수끼리, 문자는 문자끼리 곱합니다. 3 × 2 = 6, x × x = x²",
      answer: "6x²",
      steps: [
        "계수 부분: 3 × 2 = 6",
        "문자 부분: x × x = x²",
        "따라서 6x²입니다"
      ]
    },
    advanced: {
      problem: "다음을 간단히 하시오: (2x²)³ × x⁴",
      hint: "(ab)ⁿ = aⁿbⁿ 공식과 xᵐ × xⁿ = xᵐ⁺ⁿ 공식을 사용합니다",
      answer: "8x¹⁰",
      steps: [
        "(2x²)³ = 2³ × (x²)³ = 8x⁶",
        "8x⁶ × x⁴에서 지수를 더합니다: 6 + 4 = 10",
        "따라서 8x¹⁰입니다"
      ]
    }
  },
  "다항식의 완전한 분배": {
    basic: {
      problem: "다음을 전개하시오: 2(x + 3)",
      hint: "괄호 밖의 2를 괄호 안의 각 항에 곱합니다",
      answer: "2x + 6",
      steps: [
        "2 × x = 2x",
        "2 × 3 = 6",
        "따라서 2x + 6입니다"
      ]
    },
    variation: {
      problem: "다음을 전개하시오: (x + 2)(x + 3)",
      hint: "첫 번째 괄호의 각 항을 두 번째 괄호의 각 항에 곱합니다",
      answer: "x² + 5x + 6",
      steps: [
        "x × x = x²",
        "x × 3 + 2 × x = 3x + 2x = 5x",
        "2 × 3 = 6",
        "따라서 x² + 5x + 6입니다"
      ]
    },
    advanced: {
      problem: "다음을 전개하시오: (x + 1)(x² - x + 1)",
      hint: "첫 번째 괄호의 각 항을 두 번째 괄호의 모든 항에 곱하고 동류항을 정리합니다",
      answer: "x³ + 1",
      steps: [
        "x × (x² - x + 1) = x³ - x² + x",
        "1 × (x² - x + 1) = x² - x + 1",
        "합치면: x³ - x² + x + x² - x + 1",
        "동류항 정리: x³ + 1"
      ]
    }
  },
  "완전 제곱 공식": {
    basic: {
      problem: "다음을 전개하시오: (x + 2)²",
      hint: "(a + b)² = a² + 2ab + b² 공식을 사용합니다",
      answer: "x² + 4x + 4",
      steps: [
        "a = x, b = 2로 놓습니다",
        "a² = x², 2ab = 2 × x × 2 = 4x, b² = 4",
        "따라서 x² + 4x + 4입니다"
      ]
    },
    variation: {
      problem: "다음을 전개하시오: (x - 3)²",
      hint: "(a - b)² = a² - 2ab + b² 공식을 사용합니다",
      answer: "x² - 6x + 9",
      steps: [
        "a = x, b = 3으로 놓습니다",
        "a² = x², -2ab = -2 × x × 3 = -6x, b² = 9",
        "따라서 x² - 6x + 9입니다"
      ]
    },
    advanced: {
      problem: "다음을 계산하시오: (x + 1)² - (x - 1)²",
      hint: "각각을 전개한 후 빼거나, (a²-b²) = (a+b)(a-b) 공식을 사용합니다",
      answer: "4x",
      steps: [
        "(x + 1)² = x² + 2x + 1",
        "(x - 1)² = x² - 2x + 1",
        "(x² + 2x + 1) - (x² - 2x + 1) = 4x"
      ]
    }
  },
  "계수 계산": {
    basic: {
      problem: "다음을 계산하시오: 2x + 3x",
      hint: "같은 문자를 가진 항끼리 계수를 더합니다",
      answer: "5x",
      steps: [
        "2x와 3x는 동류항입니다",
        "계수를 더합니다: 2 + 3 = 5",
        "따라서 5x입니다"
      ]
    },
    variation: {
      problem: "다음을 계산하시오: 5x - 2x + 3",
      hint: "동류항끼리 모아서 계산합니다. 상수항은 따로 둡니다",
      answer: "3x + 3",
      steps: [
        "x항끼리: 5x - 2x = 3x",
        "상수항: 3",
        "따라서 3x + 3입니다"
      ]
    },
    advanced: {
      problem: "다음을 계산하시오: 3(2x + 1) - 2(x - 3)",
      hint: "먼저 괄호를 풀고, 동류항끼리 정리합니다",
      answer: "4x + 9",
      steps: [
        "3(2x + 1) = 6x + 3",
        "2(x - 3) = 2x - 6",
        "6x + 3 - (2x - 6) = 6x + 3 - 2x + 6 = 4x + 9"
      ]
    }
  },
  "지수법칙": {
    basic: {
      problem: "다음을 간단히 하시오: x² × x³",
      hint: "밑이 같은 거듭제곱의 곱셈은 지수를 더합니다",
      answer: "x⁵",
      steps: [
        "xᵐ × xⁿ = xᵐ⁺ⁿ 공식을 사용합니다",
        "2 + 3 = 5",
        "따라서 x⁵입니다"
      ]
    },
    variation: {
      problem: "다음을 간단히 하시오: (x²)³",
      hint: "거듭제곱의 거듭제곱은 지수를 곱합니다",
      answer: "x⁶",
      steps: [
        "(xᵐ)ⁿ = xᵐⁿ 공식을 사용합니다",
        "2 × 3 = 6",
        "따라서 x⁶입니다"
      ]
    },
    advanced: {
      problem: "다음을 간단히 하시오: (2x²)³ × x⁴",
      hint: "거듭제곱의 성질과 지수법칙을 모두 사용합니다",
      answer: "8x¹⁰",
      steps: [
        "(2x²)³ = 2³ × (x²)³ = 8 × x⁶ = 8x⁶",
        "8x⁶ × x⁴ = 8 × x⁶⁺⁴ = 8x¹⁰",
        "따라서 8x¹⁰입니다"
      ]
    }
  },
  "기본 연산": {
    basic: {
      problem: "다음을 계산하시오: 3 + 2 × 4",
      hint: "곱셈을 먼저 계산한 후 덧셈을 합니다",
      answer: "11",
      steps: [
        "2 × 4 = 8을 먼저 계산합니다",
        "3 + 8 = 11",
        "따라서 11입니다"
      ]
    },
    variation: {
      problem: "다음을 계산하시오: (3 + 2) × 4",
      hint: "괄호 안을 먼저 계산합니다",
      answer: "20",
      steps: [
        "괄호 안: 3 + 2 = 5",
        "5 × 4 = 20",
        "따라서 20입니다"
      ]
    },
    advanced: {
      problem: "다음을 계산하시오: 2 × (3 + 4) - 5 × 2",
      hint: "괄호를 먼저 계산하고, 곱셈 후 뺄셈을 합니다",
      answer: "4",
      steps: [
        "괄호: 3 + 4 = 7",
        "2 × 7 = 14, 5 × 2 = 10",
        "14 - 10 = 4"
      ]
    }
  },
  "방정식 풀이": {
    basic: {
      problem: "다음 방정식을 푸시오: x + 5 = 8",
      hint: "양변에서 5를 빼면 x의 값을 구할 수 있습니다",
      answer: "x = 3",
      steps: [
        "양변에서 5를 뺍니다",
        "x + 5 - 5 = 8 - 5",
        "x = 3"
      ]
    },
    variation: {
      problem: "다음 방정식을 푸시오: 2x = 10",
      hint: "양변을 2로 나누면 x의 값을 구할 수 있습니다",
      answer: "x = 5",
      steps: [
        "양변을 2로 나눕니다",
        "2x ÷ 2 = 10 ÷ 2",
        "x = 5"
      ]
    },
    advanced: {
      problem: "다음 방정식을 푸시오: 2(x - 3) = 10",
      hint: "먼저 괄호를 풀거나, 양변을 2로 나눈 후 풀이합니다",
      answer: "x = 8",
      steps: [
        "양변을 2로 나눕니다: x - 3 = 5",
        "양변에 3을 더합니다: x = 5 + 3",
        "x = 8"
      ]
    }
  },
  "식의 계산": {
    basic: {
      problem: "다음을 계산하시오: x + x + x",
      hint: "같은 문자를 더할 때는 개수를 세어 계수를 만듭니다",
      answer: "3x",
      steps: [
        "x가 3개 있습니다",
        "1x + 1x + 1x = 3x",
        "따라서 3x입니다"
      ]
    },
    variation: {
      problem: "다음을 계산하시오: 2x + 3x - x",
      hint: "동류항끼리 계수를 계산합니다",
      answer: "4x",
      steps: [
        "계수를 계산합니다: 2 + 3 - 1 = 4",
        "따라서 4x입니다"
      ]
    },
    advanced: {
      problem: "다음을 계산하시오: 3(x + 2) + 2(x - 1)",
      hint: "각 괄호를 풀고 동류항끼리 정리합니다",
      answer: "5x + 4",
      steps: [
        "3(x + 2) = 3x + 6",
        "2(x - 1) = 2x - 2",
        "3x + 6 + 2x - 2 = 5x + 4"
      ]
    }
  }
};

/**
 * 키워드 매칭을 통한 약점 유형 식별
 */
function matchWeaknessType(text: string): string[] {
  const keywordMap: Record<string, string> = {
    "지수": "문자 곱셈 시 지수 처리",
    "곱셈": "문자 곱셈 시 지수 처리",
    "분배": "다항식의 완전한 분배",
    "전개": "다항식의 완전한 분배",
    "다항식": "다항식의 완전한 분배",
    "제곱": "완전 제곱 공식",
    "완전": "완전 제곱 공식",
    "계수": "계수 계산",
    "동류항": "계수 계산",
    "지수법칙": "지수법칙",
    "거듭제곱": "지수법칙",
    "연산": "기본 연산",
    "계산": "식의 계산",
    "방정식": "방정식 풀이",
    "풀이": "방정식 풀이"
  };

  const matched = new Set<string>();
  const lowerText = text.toLowerCase();

  for (const [keyword, type] of Object.entries(keywordMap)) {
    if (lowerText.includes(keyword)) {
      matched.add(type);
    }
  }

  return Array.from(matched);
}

/**
 * 템플릿 기반 문제 생성
 */
function generateProblemsFromTemplate(weaknessTypes: string[]): string {
  let html = '';

  for (const weaknessType of weaknessTypes) {
    // 정확히 일치하는 템플릿 찾기
    let template = PROBLEM_TEMPLATES[weaknessType];

    // 정확히 일치하지 않으면 키워드 매칭 시도
    if (!template) {
      const matchedTypes = matchWeaknessType(weaknessType);
      if (matchedTypes.length > 0) {
        template = PROBLEM_TEMPLATES[matchedTypes[0]];
      }
    }

    // 여전히 템플릿이 없으면 기본 템플릿 사용
    if (!template) {
      template = PROBLEM_TEMPLATES["기본 연산"];
    }

    html += `
<div class="problem-section">
  <h2 class="weakness-title">🎯 약점: ${weaknessType}</h2>
  
  <div class="difficulty-group">
    <h3 class="difficulty-level basic">📌 기본 유형 문제</h3>
    <div class="problem">
      <div class="problem-content">
        <p><strong>문제:</strong> ${template.basic.problem}</p>
      </div>
      <details class="hint">
        <summary>💡 힌트</summary>
        <p>${template.basic.hint}</p>
      </details>
      <details class="solution">
        <summary>✅ 정답 및 풀이</summary>
        <p><strong>정답:</strong> ${template.basic.answer}</p>
        <div class="solution-steps">
          <p><strong>풀이:</strong></p>
          <ol>
            ${template.basic.steps.map(step => `<li>${step}</li>`).join('\n            ')}
          </ol>
        </div>
      </details>
    </div>
  </div>

  <div class="difficulty-group">
    <h3 class="difficulty-level variation">🔄 변형 문제</h3>
    <div class="problem">
      <div class="problem-content">
        <p><strong>문제:</strong> ${template.variation.problem}</p>
      </div>
      <details class="hint">
        <summary>💡 힌트</summary>
        <p>${template.variation.hint}</p>
      </details>
      <details class="solution">
        <summary>✅ 정답 및 풀이</summary>
        <p><strong>정답:</strong> ${template.variation.answer}</p>
        <div class="solution-steps">
          <p><strong>풀이:</strong></p>
          <ol>
            ${template.variation.steps.map(step => `<li>${step}</li>`).join('\n            ')}
          </ol>
        </div>
      </details>
    </div>
  </div>

  <div class="difficulty-group">
    <h3 class="difficulty-level advanced">🚀 심화 문제</h3>
    <div class="problem">
      <div class="problem-content">
        <p><strong>문제:</strong> ${template.advanced.problem}</p>
      </div>
      <details class="hint">
        <summary>💡 힌트</summary>
        <p>${template.advanced.hint}</p>
      </details>
      <details class="solution">
        <summary>✅ 정답 및 풀이</summary>
        <p><strong>정답:</strong> ${template.advanced.answer}</p>
        <div class="solution-steps">
          <p><strong>풀이:</strong></p>
          <ol>
            ${template.advanced.steps.map(step => `<li>${step}</li>`).join('\n            ')}
          </ol>
        </div>
      </details>
    </div>
  </div>
</div>
`;
  }

  return html;
}

/**
 * POST /api/homework/generate-similar-problems
 * 학생의 약점 유형을 분석하여 유사문제 생성 (템플릿 기반 + Gemini API 옵션)
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { GOOGLE_GEMINI_API_KEY } = context.env;
    const body = await context.request.json();
    const { studentId, weaknessTypes, studentName } = body;

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

    // 1차: 템플릿 기반 문제 생성 (항상 성공)
    const templateProblems = generateProblemsFromTemplate(weaknessTypes);
    console.log(`✅ 템플릿 기반 문제 생성 완료 (${templateProblems.length} characters)`);

    // 2차: Gemini API 시도 (선택적, 실패해도 템플릿 사용)
    let finalProblems = templateProblems;
    let usedMethod = 'template';

    if (GOOGLE_GEMINI_API_KEY) {
      try {
        console.log('🔄 Gemini API를 통한 향상된 문제 생성 시도...');
        
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
        <p><strong>문제:</strong> [구체적인 문제 내용]</p>
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

각 약점 유형에 대해 위 HTML 형식으로 문제를 생성해주세요.`;

        // Gemini API v1, gemini-1.5-pro 모델 사용 (flash보다 안정적)
        const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${GOOGLE_GEMINI_API_KEY}`;
        
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

        if (response.ok) {
          const data = await response.json();
          const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

          if (generatedText) {
            // HTML 정리 (마크다운 코드 블록 제거)
            let cleanedHTML = generatedText;
            if (cleanedHTML.includes('```html')) {
              cleanedHTML = cleanedHTML.replace(/```html\n?/g, '').replace(/```\n?/g, '');
            }
            if (cleanedHTML.includes('```')) {
              cleanedHTML = cleanedHTML.replace(/```\n?/g, '');
            }

            finalProblems = cleanedHTML;
            usedMethod = 'gemini-1.5-pro';
            console.log(`✅ Gemini API 문제 생성 완료 (${cleanedHTML.length} characters)`);
          }
        } else {
          const errorText = await response.text();
          console.warn(`⚠️ Gemini API 실패, 템플릿 사용: ${response.status}`, errorText);
        }
      } catch (geminiError: any) {
        console.warn(`⚠️ Gemini API 오류, 템플릿 사용:`, geminiError.message);
      }
    } else {
      console.log('ℹ️ GOOGLE_GEMINI_API_KEY 미설정, 템플릿 기반 문제 사용');
    }

    return new Response(
      JSON.stringify({
        success: true,
        problems: finalProblems,
        weaknessTypes,
        studentName,
        generatedAt: new Date().toISOString(),
        method: usedMethod,
        note: usedMethod === 'template' 
          ? '템플릿 기반 문제가 생성되었습니다. Gemini API 키를 설정하면 더 다양한 문제를 생성할 수 있습니다.'
          : 'AI가 생성한 맞춤형 문제입니다.'
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      }
    );

  } catch (error: any) {
    console.error("❌ 유사문제 생성 오류:", error);
    
    // 심각한 오류 시에도 기본 템플릿 제공
    const { weaknessTypes, studentName } = await context.request.json().catch(() => ({}));
    
    if (weaknessTypes && weaknessTypes.length > 0) {
      const fallbackProblems = generateProblemsFromTemplate(weaknessTypes);
      
      return new Response(
        JSON.stringify({
          success: true,
          problems: fallbackProblems,
          weaknessTypes,
          studentName: studentName || '학생',
          generatedAt: new Date().toISOString(),
          method: 'template-fallback',
          note: '오류 발생으로 기본 템플릿 문제를 제공합니다.'
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "유사문제 생성 중 오류가 발생했습니다"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
