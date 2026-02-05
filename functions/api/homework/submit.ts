interface Env {
  DB: D1Database;
  GOOGLE_GEMINI_API_KEY: string;
}

// POST: 숙제 이미지 제출 및 AI 채점
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB, GOOGLE_GEMINI_API_KEY } = context.env;
    const body = await context.request.json();
    const { userId, attendanceRecordId, imageData, imageUrl, teacherId, academyId, classId } = body;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!userId || (!imageData && !imageUrl)) {
      return new Response(
        JSON.stringify({ error: "userId and image are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 테이블 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS homework_submissions (
        id TEXT PRIMARY KEY,
        userId INTEGER NOT NULL,
        attendanceRecordId TEXT,
        imageUrl TEXT NOT NULL,
        imageData TEXT,
        submittedAt TEXT DEFAULT (datetime('now')),
        academyId INTEGER,
        classId TEXT,
        teacherId INTEGER
      )
    `).run();

    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS homework_gradings (
        id TEXT PRIMARY KEY,
        submissionId TEXT NOT NULL,
        userId INTEGER NOT NULL,
        score INTEGER,
        feedback TEXT,
        detectedIssues TEXT,
        strengths TEXT,
        suggestions TEXT,
        gradedAt TEXT DEFAULT (datetime('now')),
        gradedBy TEXT DEFAULT 'GEMINI_AI',
        model TEXT DEFAULT 'gemini-2.5-flash'
      )
    `).run();

    // 숙제 제출 기록 생성
    const submissionId = `homework-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await DB.prepare(`
      INSERT INTO homework_submissions (
        id, userId, attendanceRecordId, imageUrl, imageData, academyId, classId, teacherId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      submissionId,
      userId,
      attendanceRecordId || null,
      imageUrl || 'base64-image',
      imageData || null,
      academyId || null,
      classId || null,
      teacherId || null
    ).run();

    // Gemini AI 채점
    let grading = null;
    if (GOOGLE_GEMINI_API_KEY && imageData) {
      try {
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  {
                    text: `이 숙제 이미지를 분석하고 채점해주세요. 다음 형식으로 답변해주세요:

점수: [0-100점]
피드백: [전체적인 평가]
문제점: [발견된 문제들을 쉼표로 구분]
잘한 점: [잘한 부분들을 쉼표로 구분]
개선 제안: [구체적인 개선 방법을 쉼표로 구분]`
                  },
                  {
                    inline_data: {
                      mime_type: imageData.startsWith('data:image/png') ? 'image/png' : 'image/jpeg',
                      data: imageData.replace(/^data:image\/[a-z]+;base64,/, '')
                    }
                  }
                ]
              }],
              generationConfig: {
                temperature: 0.4,
                topK: 32,
                topP: 1,
                maxOutputTokens: 2048,
              }
            })
          }
        );

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

          // AI 응답 파싱
          const scoreMatch = aiResponse.match(/점수:?\s*(\d+)/i);
          const score = scoreMatch ? parseInt(scoreMatch[1]) : null;

          const feedbackMatch = aiResponse.match(/피드백:?\s*([^\n]+)/i);
          const feedback = feedbackMatch ? feedbackMatch[1].trim() : aiResponse;

          const issuesMatch = aiResponse.match(/문제점:?\s*([^\n]+)/i);
          const detectedIssues = issuesMatch ? issuesMatch[1].trim() : '';

          const strengthsMatch = aiResponse.match(/잘한 점:?\s*([^\n]+)/i);
          const strengths = strengthsMatch ? strengthsMatch[1].trim() : '';

          const suggestionsMatch = aiResponse.match(/개선 제안:?\s*([^\n]+)/i);
          const suggestions = suggestionsMatch ? suggestionsMatch[1].trim() : '';

          // 채점 결과 저장
          const gradingId = `grading-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          await DB.prepare(`
            INSERT INTO homework_gradings (
              id, submissionId, userId, score, feedback, detectedIssues, strengths, suggestions
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            gradingId,
            submissionId,
            userId,
            score,
            feedback,
            detectedIssues,
            strengths,
            suggestions
          ).run();

          grading = {
            id: gradingId,
            score,
            feedback,
            detectedIssues: detectedIssues.split(',').map(s => s.trim()).filter(Boolean),
            strengths: strengths.split(',').map(s => s.trim()).filter(Boolean),
            suggestions: suggestions.split(',').map(s => s.trim()).filter(Boolean),
            gradedAt: new Date().toISOString()
          };
        }
      } catch (aiError) {
        console.error('AI grading error:', aiError);
        // AI 채점 실패해도 제출은 성공
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: grading ? 'AI 채점 완료!' : '숙제 제출 완료! (AI 채점 대기 중)',
        submission: {
          id: submissionId,
          userId,
          submittedAt: new Date().toISOString()
        },
        grading
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Homework submission error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to submit homework",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
