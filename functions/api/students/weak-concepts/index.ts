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

    // 매우 명확한 프롬프트 (Gemini 1.5 Pro용)
    const prompt = `다음은 한 학생의 학습 데이터입니다. 이 데이터를 분석하여 부족한 개념을 찾아주세요.

${analysisContext}

**중요**: 반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트나 설명은 포함하지 마세요.

{
  "summary": "학생의 이해도 요약 (한국어로 2-3문장)",
  "weakConcepts": [
    {
      "concept": "부족한 개념 이름",
      "description": "왜 이 개념이 부족한지 설명",
      "severity": "high",
      "relatedTopics": ["관련 주제1", "관련 주제2"]
    }
  ],
  "recommendations": [
    {
      "concept": "개념 이름",
      "action": "구체적인 학습 방법"
    }
  ]
}

분석 기준:
1. 80점 미만 숙제에서 반복되는 약점 찾기
2. 최대 5개 개념 추출
3. severity는 "high", "medium", "low" 중 하나
4. 모든 텍스트는 한국어로 작성`;

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
    // Gemini 1.5 Pro Latest 모델 사용 (v1 API)
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-latest:generateContent?key=${geminiApiKey}`;

    console.log('🔄 Calling Gemini 1.5 Pro API (안정적 버전)...');
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

    // 5. Gemini 응답 파싱 (JSON Schema 모드 - 이미 파싱된 JSON 반환)
    let analysisResult;
    try {
      const responseText = geminiData.candidates[0].content.parts[0].text;
      console.log('📝 Gemini 1.5 Pro 원본 응답 (전체):', responseText);
      console.log('📝 응답 타입:', typeof responseText);
      
      // responseMimeType이 application/json이면 이미 JSON 문자열로 반환됨
      // 하지만 여전히 파싱이 필요함
      let parsedData;
      
      // 1차 시도: 직접 파싱
      try {
        parsedData = JSON.parse(responseText);
        console.log('✅ 1차 파싱 성공 (직접 파싱)');
      } catch (e1) {
        console.warn('⚠️ 1차 파싱 실패, 2차 시도 (마크다운 제거)');
        
        // 2차 시도: 마크다운 제거 후 파싱
        let cleanedText = responseText.trim();
        
        // ```json ... ``` 제거
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.replace(/^```json\s*/m, '').replace(/\s*```\s*$/m, '');
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/^```\s*/m, '').replace(/\s*```\s*$/m, '');
        }
        
        // 개행 문자 이스케이프 처리
        cleanedText = cleanedText
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t');
        
        console.log('🧹 정제된 텍스트 (처음 500자):', cleanedText.substring(0, 500));
        
        try {
          parsedData = JSON.parse(cleanedText);
          console.log('✅ 2차 파싱 성공 (마크다운 제거)');
        } catch (e2) {
          console.error('❌ 2차 파싱 실패, 3차 시도 (강제 수정)');
          
          // 3차 시도: JSON 문자열 내부의 특수문자 처리
          const fixedText = cleanedText
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // 제어 문자 제거
            .replace(/\\"/g, '"') // 이스케이프된 따옴표 처리
            .replace(/"\s*:\s*"/g, '":"') // 공백 제거
            .trim();
          
          console.log('🔧 강제 수정된 텍스트 (처음 500자):', fixedText.substring(0, 500));
          
          parsedData = JSON.parse(fixedText);
          console.log('✅ 3차 파싱 성공 (강제 수정)');
        }
      }
      
      // 파싱 결과 검증
      analysisResult = parsedData;
      
      if (!analysisResult || typeof analysisResult !== 'object') {
        throw new Error('파싱된 결과가 유효한 객체가 아닙니다');
      }
      
      // 필수 필드 검증 및 기본값 설정
      if (!analysisResult.summary || typeof analysisResult.summary !== 'string') {
        console.warn('⚠️ summary 필드 누락, 기본값 설정');
        analysisResult.summary = '분석이 완료되었습니다.';
      }
      
      if (!Array.isArray(analysisResult.weakConcepts)) {
        console.warn('⚠️ weakConcepts 필드 누락 또는 잘못된 타입, 빈 배열 설정');
        analysisResult.weakConcepts = [];
      }
      
      if (!Array.isArray(analysisResult.recommendations)) {
        console.warn('⚠️ recommendations 필드 누락 또는 잘못된 타입, 빈 배열 설정');
        analysisResult.recommendations = [];
      }
      
      console.log('✅ Gemini 1.5 Pro 분석 완료!');
      console.log('📊 분석된 개념 개수:', analysisResult.weakConcepts.length);
      console.log('📊 추천 개수:', analysisResult.recommendations.length);
      
      if (analysisResult.weakConcepts.length > 0) {
        console.log('📊 개념 목록:', analysisResult.weakConcepts.map((c: any) => c.concept).join(', '));
      } else {
        console.log('ℹ️ 발견된 부족한 개념이 없습니다.');
      }
      
    } catch (parseError: any) {
      console.error('❌ Gemini 1.5 Pro 응답 파싱 실패:', parseError);
      console.error('❌ 오류 상세:', parseError.message);
      console.error('❌ 오류 스택:', parseError.stack);
      
      // 원본 응답 전체 로그
      try {
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
