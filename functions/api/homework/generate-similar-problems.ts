interface Env {
  DB: D1Database;
}

interface WeaknessTemplate {
  basic: {
    problem: string;
    hint: string;
    answer: string;
    solution: string[];
  };
  variation: {
    problem: string;
    hint: string;
    answer: string;
    solution: string[];
  };
  advanced: {
    problem: string;
    hint: string;
    answer: string;
    solution: string[];
  };
}

// 약점 유형별 문제 템플릿
const weaknessTemplates: { [key: string]: WeaknessTemplate } = {
  "문자 곱셈 시 지수 처리": {
    basic: {
      problem: "x × x를 간단히 하시오.",
      hint: "같은 문자끼리 곱하면 지수가 증가합니다. x가 몇 번 곱해지는지 세어보세요.",
      answer: "x²",
      solution: [
        "x × x는 x가 2번 곱해진 것입니다.",
        "같은 문자끼리 곱하면 지수를 더합니다: x¹ × x¹ = x²",
        "따라서 답은 x²입니다."
      ]
    },
    variation: {
      problem: "3x × 2x를 간단히 하시오.",
      hint: "계수는 계수끼리, 문자는 문자끼리 따로 곱합니다.",
      answer: "6x²",
      solution: [
        "계수 부분: 3 × 2 = 6",
        "문자 부분: x × x = x²",
        "두 결과를 합치면: 6x²"
      ]
    },
    advanced: {
      problem: "(2x)² × 3x를 간단히 하시오.",
      hint: "먼저 (2x)²를 전개한 후, 나머지 부분과 곱합니다.",
      answer: "12x³",
      solution: [
        "(2x)² = 2² × x² = 4x²",
        "4x² × 3x를 계산합니다.",
        "계수: 4 × 3 = 12",
        "문자: x² × x = x³",
        "따라서 답은 12x³입니다."
      ]
    }
  },
  "다항식의 완전한 분배": {
    basic: {
      problem: "2(x + 3)을 전개하시오.",
      hint: "괄호 밖의 숫자를 괄호 안의 모든 항에 곱합니다.",
      answer: "2x + 6",
      solution: [
        "2를 괄호 안의 각 항에 분배합니다.",
        "2 × x = 2x",
        "2 × 3 = 6",
        "따라서 2x + 6입니다."
      ]
    },
    variation: {
      problem: "(x + 2)(x + 3)을 전개하시오.",
      hint: "첫 번째 괄호의 각 항을 두 번째 괄호의 모든 항과 곱합니다.",
      answer: "x² + 5x + 6",
      solution: [
        "x × x = x²",
        "x × 3 = 3x",
        "2 × x = 2x",
        "2 × 3 = 6",
        "모두 더하면: x² + 3x + 2x + 6 = x² + 5x + 6"
      ]
    },
    advanced: {
      problem: "(x + 1)(x² - x + 1)을 전개하시오.",
      hint: "첫 번째 괄호의 x와 1을 각각 두 번째 괄호의 모든 항과 곱한 후 정리합니다.",
      answer: "x³ + 1",
      solution: [
        "x × (x² - x + 1) = x³ - x² + x",
        "1 × (x² - x + 1) = x² - x + 1",
        "두 결과를 더합니다: x³ - x² + x + x² - x + 1",
        "동류항을 정리하면: x³ + 1"
      ]
    }
  },
  "완전 제곱 공식": {
    basic: {
      problem: "(x + 2)²를 전개하시오.",
      hint: "공식 (a + b)² = a² + 2ab + b²를 사용합니다.",
      answer: "x² + 4x + 4",
      solution: [
        "공식 (a + b)² = a² + 2ab + b²에서",
        "a = x, b = 2를 대입합니다.",
        "x² + 2(x)(2) + 2² = x² + 4x + 4"
      ]
    },
    variation: {
      problem: "(x - 3)²를 전개하시오.",
      hint: "공식 (a - b)² = a² - 2ab + b²를 사용합니다.",
      answer: "x² - 6x + 9",
      solution: [
        "공식 (a - b)² = a² - 2ab + b²에서",
        "a = x, b = 3을 대입합니다.",
        "x² - 2(x)(3) + 3² = x² - 6x + 9"
      ]
    },
    advanced: {
      problem: "(x + 1)² - (x - 1)²을 간단히 하시오.",
      hint: "각각 완전제곱 공식으로 전개한 후 빼기를 수행합니다.",
      answer: "4x",
      solution: [
        "(x + 1)² = x² + 2x + 1",
        "(x - 1)² = x² - 2x + 1",
        "(x² + 2x + 1) - (x² - 2x + 1)를 계산합니다.",
        "= x² + 2x + 1 - x² + 2x - 1",
        "= 4x"
      ]
    }
  },
  "계수 계산": {
    basic: {
      problem: "2x + 3x를 계산하시오.",
      hint: "같은 문자를 가진 항의 계수를 더합니다.",
      answer: "5x",
      solution: [
        "2x와 3x는 동류항입니다.",
        "계수만 더합니다: 2 + 3 = 5",
        "따라서 5x입니다."
      ]
    },
    variation: {
      problem: "5x - 2x + 3을 계산하시오.",
      hint: "x가 있는 항끼리 먼저 계산합니다.",
      answer: "3x + 3",
      solution: [
        "x항을 정리합니다: 5x - 2x = 3x",
        "상수항은 그대로: 3",
        "따라서 3x + 3입니다."
      ]
    },
    advanced: {
      problem: "3(2x + 1) - 2(x - 3)을 계산하시오.",
      hint: "먼저 괄호를 전개한 후 동류항을 정리합니다.",
      answer: "4x + 9",
      solution: [
        "3(2x + 1) = 6x + 3",
        "2(x - 3) = 2x - 6",
        "6x + 3 - (2x - 6) = 6x + 3 - 2x + 6",
        "= 4x + 9"
      ]
    }
  },
  "지수법칙": {
    basic: {
      problem: "x² × x³을 간단히 하시오.",
      hint: "같은 밑을 가진 거듭제곱의 곱셈은 지수를 더합니다.",
      answer: "x⁵",
      solution: [
        "밑이 같은 거듭제곱의 곱셈: x^a × x^b = x^(a+b)",
        "x² × x³ = x^(2+3) = x⁵"
      ]
    },
    variation: {
      problem: "(x²)³을 간단히 하시오.",
      hint: "거듭제곱의 거듭제곱은 지수를 곱합니다.",
      answer: "x⁶",
      solution: [
        "거듭제곱의 거듭제곱: (x^a)^b = x^(a×b)",
        "(x²)³ = x^(2×3) = x⁶"
      ]
    },
    advanced: {
      problem: "(2x²)³ × x⁴를 간단히 하시오.",
      hint: "먼저 (2x²)³을 전개한 후, 지수법칙을 적용합니다.",
      answer: "8x¹⁰",
      solution: [
        "(2x²)³ = 2³ × (x²)³ = 8x⁶",
        "8x⁶ × x⁴를 계산합니다.",
        "계수: 8",
        "지수: x⁶ × x⁴ = x^(6+4) = x¹⁰",
        "따라서 8x¹⁰입니다."
      ]
    }
  }
};

// 기본 템플릿 (약점 유형이 템플릿에 없을 때)
const defaultTemplate: WeaknessTemplate = {
  basic: {
    problem: "이 개념과 관련된 기본 문제를 풀어보세요.",
    hint: "기본 개념을 다시 한번 복습해보세요.",
    answer: "선생님께 문의하세요",
    solution: ["이 문제는 선생님과 함께 풀어보세요."]
  },
  variation: {
    problem: "이 개념을 응용한 변형 문제를 풀어보세요.",
    hint: "기본 문제와 비슷하지만 약간 다른 형태입니다.",
    answer: "선생님께 문의하세요",
    solution: ["이 문제는 선생님과 함께 풀어보세요."]
  },
  advanced: {
    problem: "이 개념을 활용한 심화 문제를 풀어보세요.",
    hint: "여러 개념을 종합적으로 활용해야 합니다.",
    answer: "선생님께 문의하세요",
    solution: ["이 문제는 선생님과 함께 풀어보세요."]
  }
};

function generateProblemHTML(weaknessType: string, template: WeaknessTemplate): string {
  return `
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
            ${template.basic.solution.map(step => `<li>${step}</li>`).join('\n            ')}
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
            ${template.variation.solution.map(step => `<li>${step}</li>`).join('\n            ')}
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
            ${template.advanced.solution.map(step => `<li>${step}</li>`).join('\n            ')}
          </ol>
        </div>
      </details>
    </div>
  </div>
</div>
`;
}

function findMatchingTemplate(weaknessType: string): WeaknessTemplate {
  // 정확히 일치하는 템플릿 찾기
  if (weaknessTemplates[weaknessType]) {
    return weaknessTemplates[weaknessType];
  }
  
  // 부분 일치하는 템플릿 찾기
  const normalizedInput = weaknessType.toLowerCase().replace(/\s+/g, '');
  for (const [key, template] of Object.entries(weaknessTemplates)) {
    const normalizedKey = key.toLowerCase().replace(/\s+/g, '');
    if (normalizedInput.includes(normalizedKey) || normalizedKey.includes(normalizedInput)) {
      return template;
    }
  }
  
  // 키워드 기반 매칭
  if (weaknessType.includes('곱셈') || weaknessType.includes('지수') || weaknessType.includes('x*x')) {
    return weaknessTemplates["문자 곱셈 시 지수 처리"];
  }
  if (weaknessType.includes('분배') || weaknessType.includes('전개')) {
    return weaknessTemplates["다항식의 완전한 분배"];
  }
  if (weaknessType.includes('제곱') || weaknessType.includes('(a+b)²')) {
    return weaknessTemplates["완전 제곱 공식"];
  }
  if (weaknessType.includes('계수')) {
    return weaknessTemplates["계수 계산"];
  }
  if (weaknessType.includes('지수법칙')) {
    return weaknessTemplates["지수법칙"];
  }
  
  // 매칭되는 템플릿이 없으면 기본 템플릿 반환
  return defaultTemplate;
}

/**
 * POST /api/homework/generate-similar-problems
 * 학생의 약점 유형을 분석하여 유사문제 생성 (기본/변형/심화)
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
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

    // 각 약점 유형에 대해 문제 생성
    const problemsHTML = weaknessTypes.map((weaknessType: string) => {
      console.log(`📝 문제 생성 중: ${weaknessType}`);
      const template = findMatchingTemplate(weaknessType);
      return generateProblemHTML(weaknessType, template);
    }).join('\n');

    console.log(`✅ 유사문제 생성 완료: ${weaknessTypes.length}개 약점 유형, ${weaknessTypes.length * 3}개 문제`);

    return new Response(
      JSON.stringify({
        success: true,
        problems: problemsHTML,
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
