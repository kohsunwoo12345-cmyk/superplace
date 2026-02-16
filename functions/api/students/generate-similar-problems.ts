interface Env {
  DB: D1Database;
  GOOGLE_GEMINI_API_KEY: string;
}

/**
 * POST /api/students/generate-similar-problems
 * 학생의 틀린 문제를 분석하여 유사 문제 생성
 */
export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const { DB, GOOGLE_GEMINI_API_KEY } = env;

  if (!DB) {
    return new Response(JSON.stringify({ success: false, error: "Database not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { studentId, concept } = body;

    if (!studentId) {
      return new Response(
        JSON.stringify({ success: false, error: "studentId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 🔒 학원장 제한 체크
    const student = await DB.prepare(`
      SELECT academy_id FROM users WHERE id = ?
    `).bind(studentId).first();

    if (student && student.academy_id) {
      // 학원장 찾기
      const director = await DB.prepare(`
        SELECT id FROM users WHERE academy_id = ? AND role = 'DIRECTOR' LIMIT 1
      `).bind(student.academy_id).first();

      if (director) {
        // 제한 정보 조회
        const limitation = await DB.prepare(`
          SELECT 
            similar_problem_enabled,
            similar_problem_daily_limit,
            similar_problem_monthly_limit,
            similar_problem_daily_used,
            similar_problem_monthly_used
          FROM director_limitations 
          WHERE director_id = ?
        `).bind(director.id).first();

        if (limitation) {
          // 기능 활성화 체크
          if (limitation.similar_problem_enabled === 0) {
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: "유사문제 출제 기능이 비활성화되어 있습니다. 학원장에게 문의하세요." 
              }),
              { status: 403, headers: { "Content-Type": "application/json" } }
            );
          }

          // 일일 제한 체크
          if (limitation.similar_problem_daily_limit > 0 && 
              limitation.similar_problem_daily_used >= limitation.similar_problem_daily_limit) {
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: `일일 유사문제 출제 횟수를 초과했습니다. (${limitation.similar_problem_daily_limit}회 제한)` 
              }),
              { status: 403, headers: { "Content-Type": "application/json" } }
            );
          }

          // 월간 제한 체크
          if (limitation.similar_problem_monthly_limit > 0 && 
              limitation.similar_problem_monthly_used >= limitation.similar_problem_monthly_limit) {
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: `월간 유사문제 출제 횟수를 초과했습니다. (${limitation.similar_problem_monthly_limit}회 제한)` 
              }),
              { status: 403, headers: { "Content-Type": "application/json" } }
            );
          }
        }
      }
    }

    console.log('📝 유사문제 생성 시작 - Student:', studentId, 'Concept:', concept);

    // 1. 학생의 숙제 제출 데이터 가져오기 (틀린 문제 위주)
    let homeworkData: any[] = [];
    
    try {
      const homeworkQuery = `
        SELECT 
          hs.id,
          hs.submittedAt,
          hs.imageUrl,
          hg.score,
          hg.subject,
          hg.feedback,
          hg.weaknessTypes,
          hg.detailedAnalysis,
          hg.problemAnalysis,
          hg.correctAnswers,
          hg.wrongAnswers
        FROM homework_submissions_v2 hs
        LEFT JOIN homework_gradings_v2 hg ON hg.submissionId = hs.id
        WHERE hs.userId = ? AND hg.score IS NOT NULL
        ORDER BY hs.submittedAt DESC
        LIMIT 20
      `;
      
      const homeworkResult = await DB.prepare(homeworkQuery).bind(parseInt(studentId)).all();
      homeworkData = homeworkResult.results || [];
      console.log(`✅ Found ${homeworkData.length} homework records`);
    } catch (dbError: any) {
      console.warn('⚠️ homework tables may not exist:', dbError.message);
      homeworkData = [];
    }

    if (homeworkData.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          problems: [],
          message: "분석할 숙제 데이터가 없습니다. 숙제를 제출하면 유사 문제를 생성할 수 있습니다.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. 틀린 문제와 약점 분석 데이터 정리
    const weaknessContext = homeworkData
      .filter(hw => hw.score < 80) // 80점 미만만 분석
      .map((hw: any, idx: number) => {
        const weaknessTypes = hw.weaknessTypes ? JSON.parse(hw.weaknessTypes) : [];
        const problemAnalysis = hw.problemAnalysis || '없음';
        const wrongAnswers = hw.wrongAnswers || '없음';
        
        return `
숙제 ${idx + 1} (제출일: ${hw.submittedAt}):
- 과목: ${hw.subject || '알 수 없음'}
- 점수: ${hw.score}점
- 약점 유형: ${weaknessTypes.join(', ') || '없음'}
- 상세 분석: ${hw.detailedAnalysis || '없음'}
- 문제 분석: ${problemAnalysis}
- 틀린 답안: ${wrongAnswers}
`;
      })
      .join('\n');

    // 3. Gemini API로 유사 문제 생성
    const prompt = concept 
      ? `다음은 학생이 "${concept}" 개념에서 어려움을 겪고 있는 내용입니다:

${weaknessContext}

이 학생을 위해 "${concept}" 개념을 연습할 수 있는 유사 문제 3개를 생성해주세요. 
각 문제는 학생이 틀린 패턴과 유사하되, 난이도를 점진적으로 높여주세요.

다음 JSON 형식으로 응답해주세요:
{
  "problems": [
    {
      "title": "문제 제목",
      "question": "문제 내용 (구체적으로)",
      "difficulty": "easy/medium/hard",
      "hint": "힌트",
      "solution": "정답 및 풀이"
    }
  ]
}

한국어로 작성하고, 학생 수준에 맞는 실용적인 문제를 만들어주세요.`
      : `다음은 학생의 숙제 제출 데이터와 약점 분석입니다:

${weaknessContext}

이 학생이 자주 틀리는 문제 유형을 분석하여 유사한 문제 5개를 생성해주세요.
각 문제는 학생의 약점을 보완할 수 있도록 설계해주세요.

다음 JSON 형식으로 응답해주세요:
{
  "problems": [
    {
      "title": "문제 제목",
      "concept": "관련 개념",
      "question": "문제 내용 (구체적으로)",
      "difficulty": "easy/medium/hard",
      "hint": "힌트",
      "solution": "정답 및 풀이"
    }
  ]
}

한국어로 작성하고, 실제로 풀 수 있는 구체적인 문제를 만들어주세요.`;

    const geminiApiKey = GOOGLE_GEMINI_API_KEY;
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'GOOGLE_GEMINI_API_KEY가 설정되지 않았습니다.',
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

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
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('❌ Gemini API error:', geminiResponse.status, errorText);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Gemini API 호출 실패 (상태: ${geminiResponse.status})`,
          details: errorText.substring(0, 200),
        }),
        { status: geminiResponse.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiResponse.json();
    console.log('✅ Gemini API response received');

    // 4. 응답 파싱
    let result;
    try {
      const responseText = geminiData.candidates[0].content.parts[0].text;
      console.log('📝 Gemini 응답 (처음 500자):', responseText.substring(0, 500));
      
      let jsonText = responseText.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\s*/, '').replace(/```\s*$/, '');
      }
      
      result = JSON.parse(jsonText);
      console.log('✅ 유사문제 생성 완료:', result.problems?.length || 0, '개');
    } catch (parseError: any) {
      console.error('❌ Failed to parse Gemini response:', parseError);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'AI 응답 파싱 실패',
          details: parseError.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 🔒 사용량 증가
    if (student && student.academy_id) {
      try {
        const director = await DB.prepare(`
          SELECT id FROM users WHERE academy_id = ? AND role = 'DIRECTOR' LIMIT 1
        `).bind(student.academy_id).first();

        if (director) {
          await DB.prepare(`
            UPDATE director_limitations 
            SET 
              similar_problem_daily_used = similar_problem_daily_used + 1,
              similar_problem_monthly_used = similar_problem_monthly_used + 1,
              updated_at = datetime('now')
            WHERE director_id = ?
          `).bind(director.id).run();
          console.log('✅ Similar problem usage incremented');
        }
      } catch (err) {
        console.error('⚠️ Failed to increment usage:', err);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        problems: result.problems || [],
        concept: concept || '자주 틀리는 문제',
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Generate similar problems error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "유사문제 생성 중 오류가 발생했습니다",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
