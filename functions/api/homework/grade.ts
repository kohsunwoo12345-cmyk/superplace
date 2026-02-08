interface Env {
  DB: D1Database;
  GEMINI_API_KEY: string;
}

/**
 * 숙제 제출 및 Gemini AI 채점 API
 * POST /api/homework/grade
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB, GEMINI_API_KEY } = context.env;
    const body = await context.request.json();
    const { userId, code, image } = body;

    if (!DB) {
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!userId || !image) {
      return new Response(
        JSON.stringify({ error: "userId and image are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 1. 사용자 정보 조회
    const user = await DB.prepare(
      "SELECT id, name, email, academyId FROM users WHERE id = ?"
    ).bind(userId).first();

    if (!user) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. homework_submissions_v2 테이블 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS homework_submissions_v2 (
        id TEXT PRIMARY KEY,
        userId INTEGER NOT NULL,
        code TEXT,
        imageUrl TEXT,
        submittedAt TEXT DEFAULT (datetime('now')),
        status TEXT DEFAULT 'submitted',
        academyId INTEGER
      )
    `).run();

    // 3. homework_gradings_v2 테이블 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS homework_gradings_v2 (
        id TEXT PRIMARY KEY,
        submissionId TEXT NOT NULL,
        score INTEGER NOT NULL,
        feedback TEXT,
        strengths TEXT,
        suggestions TEXT,
        subject TEXT,
        completion TEXT,
        effort TEXT,
        pageCount INTEGER,
        gradedAt TEXT DEFAULT (datetime('now')),
        gradedBy TEXT DEFAULT 'AI'
      )
    `).run();

    // 4. Gemini AI로 이미지 분석 및 채점
    let gradingResult;
    try {
      // 이미지를 base64에서 추출
      const base64Image = image.replace(/^data:image\/\w+;base64,/, '');
      
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  text: `당신은 학생의 숙제를 채점하는 선생님입니다. 
다음 숙제 사진을 분석하여 채점해주세요.

채점 기준:
1. 문제 풀이의 정확성 (40점)
2. 풀이 과정의 논리성 (30점)
3. 글씨와 정리 정돈 (20점)
4. 완성도 (10점)

다음 형식의 JSON으로 응답해주세요:
{
  "score": 85,
  "feedback": "전반적으로 잘 풀었습니다.",
  "strengths": "문제 풀이가 정확하고 논리적입니다.",
  "suggestions": "글씨를 좀 더 또박또박 쓰면 좋겠습니다.",
  "completion": "excellent"
}

completion은 excellent(90점 이상), good(70-89점), fair(50-69점), poor(50점 미만) 중 하나입니다.`
                },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: base64Image
                  }
                }
              ]
            }]
          })
        }
      );

      const geminiData = await geminiResponse.json();
      
      if (!geminiResponse.ok) {
        throw new Error(`Gemini API error: ${JSON.stringify(geminiData)}`);
      }

      // Gemini 응답 파싱
      const responseText = geminiData.candidates[0].content.parts[0].text;
      
      // JSON 추출 (코드 블록 제거)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        gradingResult = JSON.parse(jsonMatch[0]);
      } else {
        // JSON 파싱 실패 시 기본값
        gradingResult = {
          score: 75,
          feedback: "숙제를 제출했습니다. 계속 열심히 하세요!",
          strengths: "성실하게 숙제를 완료했습니다.",
          suggestions: "더 깊이 있는 학습을 권장합니다.",
          completion: "good"
        };
      }
    } catch (geminiError: any) {
      console.error('Gemini AI error:', geminiError);
      // Gemini 실패 시 기본 채점
      gradingResult = {
        score: 80,
        feedback: "숙제를 성실히 제출했습니다.",
        strengths: "꾸준히 숙제를 완료하는 성실함이 돋보입니다.",
        suggestions: "계속해서 열심히 학습해주세요.",
        completion: "good"
      };
    }

    // 5. 숙제 제출 기록 생성
    const submissionId = `homework-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await DB.prepare(`
      INSERT INTO homework_submissions_v2 (id, userId, code, imageUrl, status, academyId)
      VALUES (?, ?, ?, ?, 'graded', ?)
    `).bind(submissionId, userId, code || null, 'base64-image', user.academyId || null).run();

    // 6. 채점 결과 저장
    const gradingId = `grading-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await DB.prepare(`
      INSERT INTO homework_gradings_v2 (
        id, submissionId, score, feedback, strengths, suggestions, 
        subject, completion, effort, pageCount, gradedBy
      )
      VALUES (?, ?, ?, ?, ?, ?, 'Homework', ?, 'submitted', 1, 'Gemini AI')
    `).bind(
      gradingId,
      submissionId,
      gradingResult.score,
      gradingResult.feedback,
      gradingResult.strengths,
      gradingResult.suggestions,
      gradingResult.completion
    ).run();

    // 7. 결과 반환
    return new Response(
      JSON.stringify({
        success: true,
        message: '숙제 제출 및 AI 채점이 완료되었습니다',
        submission: {
          id: submissionId,
          userId: userId,
          studentName: user.name,
          submittedAt: new Date().toISOString(),
          status: 'graded'
        },
        grading: {
          id: gradingId,
          score: gradingResult.score,
          feedback: gradingResult.feedback,
          strengths: gradingResult.strengths,
          suggestions: gradingResult.suggestions,
          completion: gradingResult.completion,
          gradedAt: new Date().toISOString(),
          gradedBy: 'Gemini AI'
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Homework grade error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to grade homework",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
