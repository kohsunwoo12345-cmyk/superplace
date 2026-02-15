interface Env {
  DB: D1Database;
  GOOGLE_GEMINI_API_KEY: string;
}

interface Problem {
  concept: string;
  type: string;
  question: string;
  options?: string[];
  answerSpace: boolean;
  answer: string;
  explanation: string;
  difficulty: string;
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
    const { studentId, concepts, problemTypes, questionFormats, problemCount, studentName } = body;

    if (!studentId || !concepts || concepts.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "studentId and concepts are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!problemTypes || problemTypes.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "problemTypes is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 기본값: 둘 다 선택
    const formats = questionFormats && questionFormats.length > 0 
      ? questionFormats 
      : ['multiple_choice', 'open_ended'];

    console.log('📝 Generating problems for student:', studentId);
    console.log('🎯 Concepts:', concepts);
    console.log('📚 Problem types:', problemTypes);
    console.log('📋 Question formats:', formats);
    console.log('🔢 Problem count:', problemCount);

    // 문제 유형별 설명
    const typeDescriptions: { [key: string]: string } = {
      concept: '개념을 정확히 이해했는지 확인하는 기본 문제',
      pattern: '실제 시험에 자주 나오는 유형의 문제',
      advanced: '개념을 응용하고 확장한 심화 문제'
    };

    const typeExamples: { [key: string]: string } = {
      concept: '개념의 정의를 묻거나 간단한 계산 문제',
      pattern: '여러 단계를 거쳐 풀어야 하는 응용 문제',
      advanced: '창의적 사고가 필요한 종합 문제'
    };

    // Gemini API 호출
    const geminiApiKey = GOOGLE_GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY is not configured');
    }

    // 형식별 설명
    const formatDescriptions: { [key: string]: string } = {
      multiple_choice: '객관식 (4지선다)',
      open_ended: '서술형 (주관식)'
    };

    const formatInstructions = formats.length === 2
      ? 'Mix both multiple choice (4 options) and open-ended questions evenly'
      : formats.includes('multiple_choice')
      ? 'ALL problems should be multiple choice with 4 options'
      : 'ALL problems should be open-ended (essay/short answer)';

    const prompt = `You are an educational content creator. Generate ${problemCount} practice problems for a student.

Student Information:
- Name: ${studentName}
- Weak Concepts: ${concepts.join(', ')}
- Problem Types to Include: ${problemTypes.map((t: string) => typeDescriptions[t]).join(', ')}
- Question Formats: ${formats.map((f: string) => formatDescriptions[f]).join(', ')}
- Total Problems: ${problemCount}

Distribution:
- Mix problems evenly across selected types: ${problemTypes.join(', ')}
- Each problem should focus on one of the weak concepts
- ${formatInstructions}

Requirements for EACH problem:
1. Set "type" field to one of: ${problemTypes.map((t: string) => `"${t}"`).join(', ')}
2. Set "concept" to the specific weak concept being tested
3. Set "difficulty" to "easy", "medium", or "hard" based on type
4. Provide clear "question" text
5. For multiple choice: provide 4 options in "options" array, set "answerSpace" to false
6. For open-ended: set "options" to null, set "answerSpace" to true
7. ALWAYS provide "answer" with the correct answer
8. ALWAYS provide "explanation" with detailed step-by-step solution

Return this EXACT JSON structure:
{
  "problems": [
    {
      "concept": "개념명",
      "type": "${problemTypes[0]}" or "${problemTypes[1] || problemTypes[0]}" or "${problemTypes[2] || problemTypes[0]}",
      "question": "문제 내용 (명확하고 구체적으로)",
      "options": ["선택지1", "선택지2", "선택지3", "선택지4"] or null,
      "answerSpace": true or false,
      "answer": "정답 (객관식은 번호, 주관식은 답)",
      "explanation": "상세한 풀이 과정 (단계별로 설명)",
      "difficulty": "easy/medium/hard"
    }
  ]
}

Rules:
- Use ONLY Korean for all text
- Make questions clear and unambiguous
- Ensure answers are correct and complete
- Provide detailed explanations (3-5 sentences)
- Balance problem types according to selected types
${formats.length === 1 && formats.includes('multiple_choice') ? '- ALL problems MUST be multiple choice with exactly 4 options' : ''}
${formats.length === 1 && formats.includes('open_ended') ? '- ALL problems MUST be open-ended (options: null, answerSpace: true)' : ''}
${formats.length === 2 ? '- Mix multiple choice and open-ended questions approximately 50/50' : ''}
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
          maxOutputTokens: 8192,
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

      // 문제 수 제한
      if (problemsResult.problems.length > problemCount) {
        problemsResult.problems = problemsResult.problems.slice(0, problemCount);
      }

      // 답안과 해설 검증
      problemsResult.problems = problemsResult.problems.map((problem: any) => ({
        ...problem,
        answer: problem.answer || '답안 참조',
        explanation: problem.explanation || '문제를 단계적으로 풀어보세요.',
        type: problem.type || problemTypes[0]
      }));

      console.log(`✅ Successfully parsed ${problemsResult.problems.length} problems with answers and explanations`);

    } catch (parseError: any) {
      console.error('❌ Failed to parse Gemini response:', parseError);

      // 기본 문제 생성
      problemsResult = {
        problems: concepts.slice(0, problemCount).map((concept: string, idx: number) => ({
          concept: concept,
          type: problemTypes[idx % problemTypes.length],
          question: `${concept}에 대한 문제 ${idx + 1}: 이 개념을 설명하고 예시를 들어보세요.`,
          options: null,
          answerSpace: true,
          answer: '개념 설명 및 예시 참조',
          explanation: '해당 개념의 정의와 실생활 예시를 들어 설명해주세요.',
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
