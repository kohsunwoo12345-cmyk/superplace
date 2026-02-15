interface Env {
  DB: D1Database;
  GOOGLE_GEMINI_API_KEY: string;
}

interface Problem {
  question: string;
  options?: string[];
  answerSpace: boolean;
  concept: string;
}

/**
 * POST /api/students/generate-problems
 * Gemini API를 사용하여 학생의 부족한 개념 기반 유사문제 생성
 */
export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const { GOOGLE_GEMINI_API_KEY } = env;

  try {
    const body = await request.json();
    const { studentId, concepts, problemType, studentName } = body;

    if (!studentId || !concepts || concepts.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "studentId and concepts are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('📝 Generating problems for student:', studentId);
    console.log('🎯 Concepts:', concepts);
    console.log('📚 Problem type:', problemType);

    // 문제 유형별 설명
    const typeDescriptions = {
      concept: '개념을 정확히 이해했는지 확인하는 기본 문제',
      pattern: '실제 시험에 자주 나오는 유형의 문제',
      advanced: '개념을 응용하고 확장한 심화 문제'
    };

    const typeExamples = {
      concept: '개념의 정의를 묻거나 간단한 계산 문제',
      pattern: '여러 단계를 거쳐 풀어야 하는 응용 문제',
      advanced: '창의적 사고가 필요한 종합 문제'
    };

    // Gemini API 호출
    const geminiApiKey = GOOGLE_GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY is not configured');
    }

    const prompt = `You are an educational content creator. Generate ${concepts.length * 2} practice problems for a student.

Student Information:
- Name: ${studentName}
- Weak Concepts: ${concepts.join(', ')}
- Problem Type: ${problemType} (${typeDescriptions[problemType as keyof typeof typeDescriptions]})
- Problem Style: ${typeExamples[problemType as keyof typeof typeExamples]}

Requirements:
1. Create ${concepts.length * 2} problems total (2 problems per concept)
2. Each problem should directly address the concept weakness
3. Problems should be age-appropriate and educational
4. Include both multiple choice and open-ended questions
5. Return ONLY valid JSON with NO markdown or extra text

Return this EXACT JSON structure:
{
  "problems": [
    {
      "concept": "개념명",
      "question": "문제 내용 (명확하고 구체적으로)",
      "options": ["선택지1", "선택지2", "선택지3", "선택지4"] or null,
      "answerSpace": true or false,
      "difficulty": "easy/medium/hard"
    }
  ]
}

Rules:
- Use ONLY Korean for all problem text
- Make questions clear and unambiguous
- For multiple choice, provide 4 options
- For open-ended, set options to null and answerSpace to true
- Ensure problems are ${problemType === 'concept' ? 'straightforward' : problemType === 'pattern' ? 'moderately challenging' : 'highly challenging'}
- NO markdown formatting, NO code blocks, ONLY the JSON object`;

    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

    console.log('🔄 Calling Gemini API for problem generation...');

    const geminiResponse = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('❌ Gemini API error:', geminiResponse.status, errorText);
      throw new Error(`Gemini API failed: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('✅ Gemini API response received');

    // 응답 파싱
    let problemsResult;
    try {
      const responseText = geminiData.candidates[0].content.parts[0].text;
      console.log('📝 Gemini response (first 500 chars):', responseText.substring(0, 500));

      // JSON 추출
      let jsonString = responseText.trim();
      jsonString = jsonString.replace(/^```(?:json)?\s*/gm, '').replace(/\s*```\s*$/gm, '');

      const firstBrace = jsonString.indexOf('{');
      const lastBrace = jsonString.lastIndexOf('}');

      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error('JSON 객체를 찾을 수 없습니다');
      }

      jsonString = jsonString.substring(firstBrace, lastBrace + 1);

      try {
        problemsResult = JSON.parse(jsonString);
      } catch (e1) {
        // 정제 후 재시도
        const cleaned = jsonString
          .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
          .replace(/\n/g, ' ')
          .replace(/\r/g, '')
          .replace(/\t/g, ' ')
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']')
          .replace(/\s+/g, ' ')
          .trim();

        problemsResult = JSON.parse(cleaned);
      }

      if (!problemsResult.problems || !Array.isArray(problemsResult.problems)) {
        throw new Error('문제 배열을 찾을 수 없습니다');
      }

      console.log(`✅ Successfully parsed ${problemsResult.problems.length} problems`);

    } catch (parseError: any) {
      console.error('❌ Failed to parse Gemini response:', parseError);

      // 기본 문제 생성
      problemsResult = {
        problems: concepts.map((concept: string, idx: number) => ({
          concept: concept,
          question: `${concept}에 대한 문제 ${idx + 1}: 이 개념을 설명하고 예시를 들어보세요.`,
          options: null,
          answerSpace: true,
          difficulty: 'medium'
        }))
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        problems: problemsResult.problems,
        generatedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Problem generation error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "문제 생성 중 오류가 발생했습니다",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
