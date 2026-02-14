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
    const { studentId, startDate, endDate } = body;

    if (!studentId) {
      return new Response(
        JSON.stringify({ success: false, error: "studentId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('🔍 Analyzing weak concepts for student:', studentId);
    console.log('📅 Date range:', startDate, '~', endDate);

    // 1. 학생의 채팅 내역 가져오기
    let chatHistory: ChatMessage[] = [];
    
    try {
      // 기간 필터 추가
      let query = `
        SELECT 
          id,
          student_id as studentId,
          message,
          role,
          created_at as createdAt
        FROM chat_messages
        WHERE student_id = ?
      `;
      
      const params: any[] = [parseInt(studentId)];
      
      if (startDate && endDate) {
        query += ` AND created_at BETWEEN ? AND ?`;
        params.push(startDate, endDate);
      }
      
      query += ` ORDER BY created_at DESC LIMIT 100`;
      
      const result = await DB.prepare(query).bind(...params).all();
      chatHistory = result.results as any[] || [];
      console.log(`✅ Found ${chatHistory.length} chat messages for concept analysis`);
    } catch (dbError: any) {
      console.warn('⚠️ chat_messages table may not exist:', dbError.message);
      chatHistory = [];
    }

    // 2. 학생의 숙제 채점 데이터 가져오기 - 여러 테이블 시도
    let homeworkData: any[] = [];
    
    // 시도할 테이블명 조합들
    const tableCombinations = [
      { submissions: 'homework_submissions_v2', gradings: 'homework_gradings_v2' },
      { submissions: 'homework_submissions', gradings: 'homework_gradings' },
      { submissions: 'homeworkSubmissions', gradings: 'homeworkGradings' },
    ];
    
    for (const tables of tableCombinations) {
      try {
        let homeworkQuery = `
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
          FROM ${tables.submissions} hs
          LEFT JOIN ${tables.gradings} hg ON hg.submissionId = hs.id
          WHERE hs.userId = ? AND hg.score IS NOT NULL
        `;
        
        const params: any[] = [parseInt(studentId)];
        
        // 기간 필터 추가
        if (startDate && endDate) {
          homeworkQuery += ` AND hs.submittedAt BETWEEN ? AND ?`;
          params.push(startDate, endDate);
        }
        
        homeworkQuery += ` ORDER BY hs.submittedAt DESC LIMIT 50`;
        
        const homeworkResult = await DB.prepare(homeworkQuery).bind(...params).all();
        homeworkData = homeworkResult.results || [];
        
        if (homeworkData.length > 0) {
          console.log(`✅ Found ${homeworkData.length} homework records using tables: ${tables.submissions}, ${tables.gradings}`);
          break; // 성공하면 루프 종료
        }
      } catch (dbError: any) {
        console.warn(`⚠️ Failed with tables ${tables.submissions}, ${tables.gradings}:`, dbError.message);
        continue; // 다음 조합 시도
      }
    }
    
    console.log(`📊 Final homework data count: ${homeworkData.length}`);

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

    // Gemini 2.5 Flash용 JSON 전용 프롬프트
    const prompt = `Analyze student learning data and return ONLY valid JSON. No explanations, no markdown, no text before or after JSON.

Student Data:
${analysisContext}

Return this exact JSON structure (Korean text inside):
{
  "summary": "학생 이해도 요약 2-3문장",
  "weakConcepts": [
    {
      "concept": "개념명",
      "description": "부족한 이유",
      "severity": "high",
      "relatedTopics": ["주제1", "주제2"]
    }
  ],
  "recommendations": [
    {
      "concept": "개념명",
      "action": "학습방법"
    }
  ]
}

Rules:
- Find weak concepts from homework scores below 80
- Maximum 5 concepts
- severity: "high", "medium", or "low"
- All Korean text must use proper escaping
- Return ONLY the JSON object`;

    // 4. Gemini API 호출
    const geminiApiKey = GOOGLE_GEMINI_API_KEY;
    if (!geminiApiKey) {
      console.error('❌ GOOGLE_GEMINI_API_KEY is not configured');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'AI 분석 기능이 설정되지 않았습니다. GOOGLE_GEMINI_API_KEY 환경 변수를 설정해주세요.',
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    // Gemini 2.5 Flash 모델 사용 (정확한 모델명)
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

    console.log('🔄 Calling Gemini 2.5 Flash API...');
    console.log('📊 분석 대상: 채팅', chatHistory.length, '건, 숙제', homeworkData.length, '건');
    console.log('📅 분석 기간:', startDate, '~', endDate);
    
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
          temperature: 0.4,
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
          error: `Gemini AI 분석 실패 (상태: ${geminiResponse.status}). API 키를 확인해주세요.`,
          details: errorText.substring(0, 200),
        }),
        { status: geminiResponse.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiResponse.json();
    console.log('✅ Gemini API response received');

    // 5. Gemini 응답 파싱 (강력한 JSON 추출)
    let analysisResult;
    try {
      const responseText = geminiData.candidates[0].content.parts[0].text;
      console.log('📝 Gemini 2.5 Flash 원본 응답:', responseText);
      console.log('📏 응답 길이:', responseText.length);
      
      // JSON 추출: 첫 { 부터 마지막 } 까지
      let jsonString = responseText.trim();
      jsonString = jsonString.replace(/^```(?:json)?\s*/gm, '').replace(/\s*```\s*$/gm, '');
      
      const firstBrace = jsonString.indexOf('{');
      const lastBrace = jsonString.lastIndexOf('}');
      
      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error('JSON 객체를 찾을 수 없습니다');
      }
      
      jsonString = jsonString.substring(firstBrace, lastBrace + 1);
      console.log('🔍 추출된 JSON (300자):', jsonString.substring(0, 300));
      
      // JSON 파싱
      let parsedData;
      try {
        parsedData = JSON.parse(jsonString);
        console.log('✅ 파싱 성공!');
      } catch (e1) {
        console.warn('⚠️ 1차 실패, 정제 시도');
        const cleaned = jsonString.replace(/[\x00-\x1F\x7F-\x9F]/g, '').replace(/\n/g, ' ').replace(/\r/g, '').replace(/\t/g, ' ').replace(/\s+/g, ' ').trim();
        parsedData = JSON.parse(cleaned);
        console.log('✅ 2차 파싱 성공!');
      }
      
      analysisResult = parsedData;
      if (!analysisResult.summary) analysisResult.summary = '분석 완료';
      if (!Array.isArray(analysisResult.weakConcepts)) analysisResult.weakConcepts = [];
      if (!Array.isArray(analysisResult.recommendations)) analysisResult.recommendations = [];
      
      console.log('✅ 분석 완료! 개념:', analysisResult.weakConcepts.length);
      
    } catch (parseError: any) {
      console.error('❌ 파싱 실패:', parseError.message);

        const rawText = geminiData.candidates[0].content.parts[0].text;
        console.error('❌ 파싱 실패한 원본 응답 (전체):', rawText);
        console.error('❌ 원본 응답 길이:', rawText.length);
        console.error('❌ 첫 100자:', rawText.substring(0, 100));
        console.error('❌ 마지막 100자:', rawText.substring(rawText.length - 100));
        console.error('❌ Gemini 응답 전체 구조:', JSON.stringify(geminiData, null, 2));
      } catch (e) {
        console.error('❌ 원본 응답 확인 불가:', e);
      }
      
      // 파싱 실패 시 상세한 오류 메시지와 함께 빈 결과 반환
      analysisResult = {
        summary: `AI 응답 파싱 실패\n\n오류: ${parseError.message}\n\nGemini 2.5 Flash API는 정상 응답했지만 JSON 파싱에 실패했습니다.\n\n**해결 방법:**\n1. Cloudflare Pages 대시보드 → Workers & Pages → superplacestudy → Logs에서 전체 응답 확인\n2. '📝 Gemini 2.5 Flash 원본 응답' 로그 확인\n3. API 키가 올바른지 확인\n\n분석 대상: 채팅 ${chatHistory.length}건, 숙제 ${homeworkData.length}건`,
        weakConcepts: [],
        recommendations: []
      };
      console.error('❌ 파싱 실패로 오류 메시지와 함께 빈 결과 반환');
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
