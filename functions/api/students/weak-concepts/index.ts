interface Env {
  DB: D1Database;
  GOOGLE_GEMINI_API_KEY: string;
}

interface ChatMessage {
  id: number;
  studentId: number;
  message: string;
  role: string;
  createdAt: string;
}

/**
 * GET /api/students/weak-concepts?studentId={studentId}
 * 캐시된 부족한 개념 분석 결과 조회
 */
export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const { DB } = env;

  if (!DB) {
    return new Response(JSON.stringify({ success: false, error: "Database not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(request.url);
    const studentId = url.searchParams.get("studentId");

    if (!studentId) {
      return new Response(
        JSON.stringify({ success: false, error: "studentId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('🔍 Fetching cached weak concepts for student:', studentId);

    // 테이블 생성 (존재하지 않으면)
    try {
      await DB.prepare(`
        CREATE TABLE IF NOT EXISTS student_weak_concepts (
          id TEXT PRIMARY KEY,
          studentId INTEGER NOT NULL,
          summary TEXT,
          weakConcepts TEXT,
          recommendations TEXT,
          chatCount INTEGER,
          homeworkCount INTEGER,
          analyzedAt TEXT DEFAULT (datetime('now')),
          UNIQUE(studentId)
        )
      `).run();
    } catch (createError: any) {
      console.warn('⚠️ Failed to create table:', createError.message);
    }

    // 캐시된 분석 결과 조회
    let result = null;
    
    try {
      result = await DB.prepare(`
        SELECT 
          id,
          studentId,
          summary,
          weakConcepts,
          recommendations,
          chatCount,
          homeworkCount,
          analyzedAt
        FROM student_weak_concepts
        WHERE studentId = ?
        ORDER BY analyzedAt DESC
        LIMIT 1
      `).bind(parseInt(studentId)).first();
    } catch (queryError: any) {
      console.warn('⚠️ Failed to query cached results:', queryError.message);
      // 테이블이 없으면 캐시 없음으로 처리
      result = null;
    }

    if (!result) {
      return new Response(
        JSON.stringify({
          success: true,
          cached: false,
          weakConcepts: [],
          recommendations: [],
          summary: "",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        cached: true,
        weakConcepts: JSON.parse(result.weakConcepts as string),
        recommendations: JSON.parse(result.recommendations as string),
        summary: result.summary,
        chatCount: result.chatCount,
        homeworkCount: result.homeworkCount,
        analyzedAt: result.analyzedAt,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Fetch cached weak concepts error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "캐시된 분석 결과 조회 중 오류가 발생했습니다",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * POST /api/students/weak-concepts
 * Gemini API를 사용하여 학생의 부족한 개념 분석
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
    const { studentId } = body;

    if (!studentId) {
      return new Response(
        JSON.stringify({ success: false, error: "studentId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('🔍 Analyzing weak concepts for student:', studentId);

    // 1. 학생의 채팅 내역 가져오기
    let chatHistory: ChatMessage[] = [];
    
    try {
      const query = `
        SELECT 
          id,
          student_id as studentId,
          message,
          role,
          created_at as createdAt
        FROM chat_messages
        WHERE student_id = ?
        ORDER BY created_at DESC
        LIMIT 100
      `;
      
      const result = await DB.prepare(query).bind(parseInt(studentId)).all();
      chatHistory = result.results as any[] || [];
      console.log(`✅ Found ${chatHistory.length} chat messages for concept analysis`);
    } catch (dbError: any) {
      console.warn('⚠️ chat_messages table may not exist:', dbError.message);
      chatHistory = [];
    }

    // 2. 학생의 숙제 채점 데이터 가져오기
    let homeworkData: any[] = [];
    
    try {
      const homeworkQuery = `
        SELECT 
          hs.id,
          hs.submittedAt,
          hg.score,
          hg.subject,
          hg.feedback,
          hg.weaknessTypes,
          hg.detailedAnalysis,
          hg.studyDirection,
          hg.problemAnalysis
        FROM homework_submissions_v2 hs
        LEFT JOIN homework_gradings_v2 hg ON hg.submissionId = hs.id
        WHERE hs.userId = ? AND hg.score IS NOT NULL
        ORDER BY hs.submittedAt DESC
        LIMIT 10
      `;
      
      const homeworkResult = await DB.prepare(homeworkQuery).bind(parseInt(studentId)).all();
      homeworkData = homeworkResult.results || [];
      console.log(`✅ Found ${homeworkData.length} homework records for concept analysis`);
    } catch (dbError: any) {
      console.warn('⚠️ homework tables may not exist:', dbError.message);
      homeworkData = [];
    }

    // 3. 채팅 내역과 숙제 데이터가 모두 없는 경우
    if (chatHistory.length === 0 && homeworkData.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          weakConcepts: [],
          summary: "분석할 데이터가 없습니다.",
          recommendations: ["AI 챗봇과 대화를 하거나 숙제를 제출하여 부족한 개념을 파악하세요."],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. Gemini API 호출 준비
    let analysisContext = '';
    
    // 채팅 내역 추가
    if (chatHistory.length > 0) {
      const conversationText = chatHistory
        .slice(0, 50)
        .reverse()
        .map(msg => `${msg.role === 'user' ? '학생' : 'AI'}: ${msg.message}`)
        .join('\n\n');
      
      analysisContext += `\n📝 AI 챗봇 대화 내역 (${chatHistory.length}건):\n${conversationText}\n`;
    }
    
    // 숙제 데이터 추가
    if (homeworkData.length > 0) {
      const homeworkText = homeworkData
        .map((hw: any, idx: number) => {
          const weaknessTypes = hw.weaknessTypes ? JSON.parse(hw.weaknessTypes) : [];
          return `
숙제 ${idx + 1} (${hw.submittedAt}):
- 과목: ${hw.subject || '알 수 없음'}
- 점수: ${hw.score}점
- 약점 유형: ${weaknessTypes.join(', ') || '없음'}
- 상세 분석: ${hw.detailedAnalysis || '없음'}
- 학습 방향: ${hw.studyDirection || '없음'}
`;
        })
        .join('\n');
      
      analysisContext += `\n📚 숙제 채점 데이터 (${homeworkData.length}건):\n${homeworkText}\n`;
    }

    const prompt = `다음은 한 학생의 학습 데이터입니다. 이 데이터를 종합적으로 분석하여 학생이 이해하지 못하거나 부족한 개념들을 파악해주세요.

${analysisContext}

다음 형식으로 JSON 응답을 제공해주세요:
{
  "summary": "학생의 전반적인 이해도와 학습 상태 요약 (2-3문장)",
  "weakConcepts": [
    {
      "concept": "개념명 (예: 나눗셈 나머지 처리)",
      "description": "부족한 이유 설명",
      "severity": "high/medium/low",
      "relatedTopics": ["관련 주제1", "관련 주제2"]
    }
  ],
  "recommendations": [
    {
      "concept": "개념명",
      "action": "구체적인 학습 방법"
    }
  ]
}

한국어로 작성하고, 최대 5개의 부족한 개념을 찾아주세요. 숙제 채점 데이터의 약점 유형과 상세 분석을 우선적으로 고려하여 구체적이고 실용적인 분석을 제공해주세요.`;

    // 4. Gemini API 호출
    const geminiApiKey = GOOGLE_GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY is not configured');
    }
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`;

    console.log('🔄 Calling Gemini API for weak concept analysis...');
    
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
          maxOutputTokens: 3048,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('❌ Gemini API error:', errorText);
      throw new Error(`Gemini API failed: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('✅ Gemini API response received');

    // 5. Gemini 응답 파싱
    let analysisResult;
    try {
      const responseText = geminiData.candidates[0].content.parts[0].text;
      
      let jsonText = responseText.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\s*/, '').replace(/```\s*$/, '');
      }
      
      analysisResult = JSON.parse(jsonText);
      
      console.log('✅ Weak concept analysis completed successfully');
    } catch (parseError) {
      console.error('❌ Failed to parse Gemini response:', parseError);
      
      analysisResult = {
        summary: "AI 분석 중 오류가 발생했습니다.",
        weakConcepts: [],
        recommendations: [],
      };
    }

    // 6. 분석 결과를 DB에 저장 (캐싱)
    try {
      await DB.prepare(`
        CREATE TABLE IF NOT EXISTS student_weak_concepts (
          id TEXT PRIMARY KEY,
          studentId INTEGER NOT NULL,
          summary TEXT,
          weakConcepts TEXT,
          recommendations TEXT,
          chatCount INTEGER,
          homeworkCount INTEGER,
          analyzedAt TEXT DEFAULT (datetime('now')),
          UNIQUE(studentId)
        )
      `).run();

      const cacheId = `weak-concepts-${studentId}-${Date.now()}`;
      
      await DB.prepare(`
        INSERT OR REPLACE INTO student_weak_concepts 
        (id, studentId, summary, weakConcepts, recommendations, chatCount, homeworkCount, analyzedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        cacheId,
        parseInt(studentId),
        analysisResult.summary || "",
        JSON.stringify(analysisResult.weakConcepts || []),
        JSON.stringify(analysisResult.recommendations || []),
        chatHistory.length,
        homeworkData.length
      ).run();

      console.log('✅ Weak concepts analysis cached successfully');
    } catch (cacheError) {
      console.warn('⚠️ Failed to cache analysis result:', cacheError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...analysisResult,
        chatCount: chatHistory.length,
        homeworkCount: homeworkData.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Weak concepts analysis error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "부족한 개념 분석 중 오류가 발생했습니다",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
