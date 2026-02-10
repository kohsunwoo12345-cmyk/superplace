interface Env {
  DB: D1Database;
  GOOGLE_GEMINI_API_KEY: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB, GOOGLE_GEMINI_API_KEY } = context.env;
    
    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const url = new URL(context.request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "userId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`📚 학생 ${userId}의 반 진도 조회`);

    // 1. 학생 정보 및 반 정보 조회
    const student = await DB.prepare(`
      SELECT id, name, email, academyId, grade
      FROM users
      WHERE id = ?
    `).bind(parseInt(userId)).first();

    if (!student) {
      return new Response(
        JSON.stringify({ success: false, error: "Student not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. 학생이 속한 반 조회 (class_students 테이블)
    const classInfo = await DB.prepare(`
      SELECT c.id, c.name, c.grade, c.description
      FROM classes c
      JOIN class_students cs ON c.id = cs.classId
      WHERE cs.studentId = ? AND c.isActive = 1
      LIMIT 1
    `).bind(parseInt(userId)).first();

    if (!classInfo) {
      return new Response(
        JSON.stringify({
          success: true,
          hasClass: false,
          message: "소속된 반이 없습니다",
          student: {
            id: student.id,
            name: student.name,
            grade: student.grade
          }
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. 같은 반 학생들의 최근 숙제 검사 데이터 조회 (최근 30일)
    const classmates = await DB.prepare(`
      SELECT DISTINCT u.id, u.name, u.grade
      FROM users u
      JOIN class_students cs ON u.id = cs.studentId
      WHERE cs.classId = ? AND u.id != ?
      LIMIT 50
    `).bind(classInfo.id, parseInt(userId)).all();

    // 4. 같은 반 학생들의 최근 숙제 검사 데이터 조회
    const homeworkData = await DB.prepare(`
      SELECT 
        hg.userId,
        hg.subject,
        hg.feedback,
        hg.strengths,
        hg.suggestions,
        hg.score,
        hg.completion,
        hg.gradedAt,
        u.name as studentName,
        u.grade as studentGrade
      FROM homework_gradings hg
      JOIN homework_submissions hs ON hg.submissionId = hs.id
      JOIN users u ON hg.userId = u.id
      JOIN class_students cs ON u.id = cs.studentId
      WHERE cs.classId = ?
        AND datetime(hg.gradedAt) >= datetime('now', '-30 days')
      ORDER BY hg.gradedAt DESC
      LIMIT 100
    `).bind(classInfo.id).all();

    console.log(`✅ 같은 반 학생 ${classmates.results?.length || 0}명, 숙제 데이터 ${homeworkData.results?.length || 0}건`);

    // 5. 데이터가 없는 경우
    if (!homeworkData.results || homeworkData.results.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          hasClass: true,
          hasData: false,
          className: classInfo.name,
          classGrade: classInfo.grade,
          classDescription: classInfo.description,
          classmatesCount: classmates.results?.length || 0,
          message: "아직 숙제 검사 데이터가 없습니다",
          student: {
            id: student.id,
            name: student.name,
            grade: student.grade
          }
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 6. Gemini AI로 진도 분석
    const homeworkSummary = (homeworkData.results as any[]).map((hw: any) => ({
      학생: hw.studentName,
      학년: hw.studentGrade,
      과목: hw.subject,
      점수: hw.score,
      완성도: hw.completion,
      강점: hw.strengths,
      개선점: hw.suggestions,
      피드백: hw.feedback,
      날짜: hw.gradedAt
    }));

    const prompt = `당신은 학원 진도 분석 전문가입니다.

다음은 "${classInfo.name}" 반(${classInfo.grade || '학년 미지정'})의 최근 30일간 숙제 검사 데이터입니다:

${JSON.stringify(homeworkSummary, null, 2)}

위 데이터를 바탕으로 다음을 분석해주세요:

1. **현재 진도**: 이 반이 현재 어떤 단원/주제를 학습하고 있는지
2. **학습 수준**: 전반적인 이해도와 숙제 완성도
3. **주요 학습 내용**: 최근에 다룬 주요 개념이나 문제 유형
4. **다음 예상 진도**: 다음에 학습할 것으로 예상되는 내용

다음 JSON 형식으로 응답해주세요:
{
  "currentProgress": "현재 학습 중인 단원/주제",
  "level": "상/중/하",
  "mainTopics": ["주제1", "주제2", "주제3"],
  "nextExpected": "다음 예상 진도",
  "summary": "전체 요약 (2-3문장)",
  "details": "상세 분석 (5-6문장)"
}`;

    if (!GOOGLE_GEMINI_API_KEY) {
      console.warn('⚠️ GOOGLE_GEMINI_API_KEY not set');
      return new Response(
        JSON.stringify({
          success: true,
          hasClass: true,
          hasData: true,
          className: classInfo.name,
          classGrade: classInfo.grade,
          classmatesCount: classmates.results?.length || 0,
          homeworkCount: homeworkData.results.length,
          error: "AI 분석 API 키가 설정되지 않았습니다",
          rawData: homeworkSummary
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Gemini API 호출
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // JSON 추출
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    let aiAnalysis;
    
    if (jsonMatch) {
      try {
        aiAnalysis = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('AI 응답 JSON 파싱 실패:', e);
        aiAnalysis = {
          currentProgress: "분석 중...",
          level: "중",
          mainTopics: [],
          nextExpected: "분석 중...",
          summary: aiText.substring(0, 200),
          details: aiText
        };
      }
    } else {
      aiAnalysis = {
        currentProgress: "분석 중...",
        level: "중",
        mainTopics: [],
        nextExpected: "분석 중...",
        summary: aiText.substring(0, 200),
        details: aiText
      };
    }

    // 7. 최종 응답
    return new Response(
      JSON.stringify({
        success: true,
        hasClass: true,
        hasData: true,
        className: classInfo.name,
        classGrade: classInfo.grade,
        classDescription: classInfo.description,
        classmatesCount: classmates.results?.length || 0,
        homeworkCount: homeworkData.results.length,
        student: {
          id: student.id,
          name: student.name,
          grade: student.grade
        },
        progressAnalysis: aiAnalysis
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error('❌ 반 진도 조회 실패:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to get class progress",
        message: error.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
