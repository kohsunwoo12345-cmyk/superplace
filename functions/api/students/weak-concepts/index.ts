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
          detailedAnalysis TEXT,
          learningDirection TEXT,
          weakConcepts TEXT,
          recommendations TEXT,
          commonMistakeTypes TEXT,
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
          detailedAnalysis,
          learningDirection,
          weakConcepts,
          recommendations,
          commonMistakeTypes,
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

    // 안전하게 JSON 파싱 시도
    let weakConcepts: any[] = [];
    let recommendations: any[] = [];
    let commonMistakeTypes: any[] = [];
    
    try {
      weakConcepts = JSON.parse(result.weakConcepts as string);
    } catch (parseError) {
      console.error('❌ weakConcepts 파싱 실패:', parseError);
      weakConcepts = [];
    }
    
    try {
      recommendations = JSON.parse(result.recommendations as string);
    } catch (parseError) {
      console.error('❌ recommendations 파싱 실패:', parseError);
      recommendations = [];
    }
    
    try {
      if (result.commonMistakeTypes) {
        commonMistakeTypes = JSON.parse(result.commonMistakeTypes as string);
      }
    } catch (parseError) {
      console.error('❌ commonMistakeTypes 파싱 실패:', parseError);
      commonMistakeTypes = [];
    }

    return new Response(
      JSON.stringify({
        success: true,
        cached: true,
        weakConcepts: weakConcepts,
        recommendations: recommendations,
        commonMistakeTypes: commonMistakeTypes,
        summary: result.summary || "",
        detailedAnalysis: result.detailedAnalysis || "",
        learningDirection: result.learningDirection || "",
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
    console.log('📅 Date filter active:', !!(startDate && endDate));

    // 0. 학원장 제한 설정 확인 (weak_concept_analysis_enabled)
    try {
      const student = await DB.prepare(`
        SELECT id, academyId FROM User WHERE id = ?
      `).bind(parseInt(studentId)).first();

      if (student && student.academyId) {
        const limitation = await DB.prepare(`
          SELECT weak_concept_analysis_enabled, weak_concept_daily_limit, weak_concept_daily_used,
                 weak_concept_monthly_limit, weak_concept_monthly_used
          FROM director_limitations
          WHERE academy_id = ?
          LIMIT 1
        `).bind(student.academyId).first();

        if (limitation) {
          // 기능 비활성화 확인
          if (limitation.weak_concept_analysis_enabled === 0) {
            console.log('❌ 부족한 개념 분석 기능이 비활성화됨');
            return new Response(
              JSON.stringify({
                success: false,
                error: "FEATURE_DISABLED",
                message: "부족한 개념 분석 기능이 현재 요금제에서 비활성화되어 있습니다.",
              }),
              { status: 403, headers: { "Content-Type": "application/json" } }
            );
          }

          // 일일 한도 확인 (0이면 무제한)
          const dailyLimit = limitation.weak_concept_daily_limit as number;
          const dailyUsed = limitation.weak_concept_daily_used as number;
          if (dailyLimit > 0 && dailyUsed >= dailyLimit) {
            console.log(`❌ 부족한 개념 분석 일일 한도 초과: ${dailyUsed}/${dailyLimit}`);
            return new Response(
              JSON.stringify({
                success: false,
                error: "DAILY_LIMIT_EXCEEDED",
                message: `부족한 개념 분석 일일 한도를 초과했습니다. (${dailyUsed}/${dailyLimit})`,
                currentUsage: dailyUsed,
                maxLimit: dailyLimit,
              }),
              { status: 403, headers: { "Content-Type": "application/json" } }
            );
          }

          // 월간 한도 확인 (0이면 무제한)
          const monthlyLimit = limitation.weak_concept_monthly_limit as number;
          const monthlyUsed = limitation.weak_concept_monthly_used as number;
          if (monthlyLimit > 0 && monthlyUsed >= monthlyLimit) {
            console.log(`❌ 부족한 개념 분석 월간 한도 초과: ${monthlyUsed}/${monthlyLimit}`);
            return new Response(
              JSON.stringify({
                success: false,
                error: "MONTHLY_LIMIT_EXCEEDED",
                message: `부족한 개념 분석 월간 한도를 초과했습니다. (${monthlyUsed}/${monthlyLimit})`,
                currentUsage: monthlyUsed,
                maxLimit: monthlyLimit,
              }),
              { status: 403, headers: { "Content-Type": "application/json" } }
            );
          }

          // 사용량 증가
          await DB.prepare(`
            UPDATE director_limitations
            SET weak_concept_daily_used = weak_concept_daily_used + 1,
                weak_concept_monthly_used = weak_concept_monthly_used + 1,
                updated_at = datetime('now')
            WHERE academy_id = ?
          `).bind(student.academyId).run();
          console.log('✅ 부족한 개념 분석 사용량 증가 완료');
        } else {
          // director_limitations 없으면 user_subscriptions에서 제한값 확인 (fallback)
          const subscription = await DB.prepare(`
            SELECT max_ai_analysis, current_ai_analysis
            FROM user_subscriptions
            WHERE userId = ? AND status = 'active'
            LIMIT 1
          `).bind(student.id).first();

          if (subscription) {
            const maxAI = subscription.max_ai_analysis as number;
            const currentAI = subscription.current_ai_analysis as number;
            if (maxAI > 0 && currentAI >= maxAI) {
              console.log(`❌ 부족한 개념 분석 월간 한도 초과 (subscription): ${currentAI}/${maxAI}`);
              return new Response(
                JSON.stringify({
                  success: false,
                  error: "MONTHLY_LIMIT_EXCEEDED",
                  message: `부족한 개념 분석 월간 한도를 초과했습니다. (${currentAI}/${maxAI})`,
                  currentUsage: currentAI,
                  maxLimit: maxAI,
                }),
                { status: 403, headers: { "Content-Type": "application/json" } }
              );
            }
            // 사용량 증가
            await DB.prepare(`
              UPDATE user_subscriptions
              SET current_ai_analysis = current_ai_analysis + 1,
                  updatedAt = datetime('now', '+9 hours')
              WHERE userId = ? AND status = 'active'
            `).bind(student.id).run();
            console.log('✅ user_subscriptions 부족한 개념 분석 사용량 증가');
          }
        }
      }
    } catch (limitError: any) {
      console.warn('⚠️ 제한 확인 실패 (계속 진행):', limitError.message);
    }

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
        // ISO 날짜를 YYYY-MM-DD 00:00:00 형식으로 변환
        const startDateTime = `${startDate} 00:00:00`;
        const endDateTime = `${endDate} 23:59:59`;
        query += ` AND created_at BETWEEN ? AND ?`;
        params.push(startDateTime, endDateTime);
        console.log('📅 Chat date filter:', startDateTime, '~', endDateTime);
      }
      
      query += ` ORDER BY created_at DESC LIMIT 100`;
      
      console.log('🔍 Chat query:', query);
      console.log('🔍 Chat params:', params);
      
      const result = await DB.prepare(query).bind(...params).all();
      chatHistory = result.results as any[] || [];
      console.log(`✅ Found ${chatHistory.length} chat messages for concept analysis`);
      if (chatHistory.length > 0) {
        console.log('📝 First chat date:', chatHistory[0].createdAt);
        console.log('📝 Last chat date:', chatHistory[chatHistory.length - 1].createdAt);
      }
    } catch (dbError: any) {
      console.warn('⚠️ chat_messages table may not exist:', dbError.message);
      chatHistory = [];
    }

    // 2. 학생의 숙제 채점 데이터 가져오기
    let homeworkData: any[] = [];
    
    try {
      let homeworkQuery = `
        SELECT 
          id,
          userId as studentId,
          submittedAt,
          score,
          subject,
          feedback,
          completion,
          effort,
          strengths,
          suggestions
        FROM homework_submissions
        WHERE userId = ? AND score IS NOT NULL
      `;
      
      const params: any[] = [parseInt(studentId)];
      
      // 기간 필터 추가
      if (startDate && endDate) {
        // ISO 날짜를 YYYY-MM-DD 00:00:00 형식으로 변환
        const startDateTime = `${startDate} 00:00:00`;
        const endDateTime = `${endDate} 23:59:59`;
        homeworkQuery += ` AND submittedAt BETWEEN ? AND ?`;
        params.push(startDateTime, endDateTime);
        console.log('📅 Homework date filter:', startDateTime, '~', endDateTime);
      }
      
      homeworkQuery += ` ORDER BY submittedAt DESC LIMIT 50`;
      
      console.log('🔍 Homework query:', homeworkQuery);
      console.log('🔍 Homework params:', params);
      
      const homeworkResult = await DB.prepare(homeworkQuery).bind(...params).all();
      homeworkData = homeworkResult.results || [];
      
      if (homeworkData.length > 0) {
        console.log(`✅ Found ${homeworkData.length} homework records`);
        console.log('📝 First homework date:', homeworkData[0].submittedAt);
        console.log('📝 Last homework date:', homeworkData[homeworkData.length - 1].submittedAt);
      }
    } catch (dbError: any) {
      console.warn('⚠️ Failed to fetch homework data:', dbError.message);
      homeworkData = [];
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
          return `
숙제 ${idx + 1} (${hw.submittedAt}):
- 과목: ${hw.subject || '알 수 없음'}
- 점수: ${hw.score}점
- 피드백: ${hw.feedback || '없음'}
- 완성도: ${hw.completion || '없음'}
- 노력도: ${hw.effort || '없음'}
- 강점: ${hw.strengths || '없음'}
- 개선사항: ${hw.suggestions || '없음'}
`;
        })
        .join('\n');
      
      analysisContext += `\n📚 숙제 채점 데이터 (${homeworkData.length}건):\n${homeworkText}\n`;
    }

    // Gemini 2.5 Flash: 숙제 데이터 기반 상세 분석 프롬프트
    const prompt = `You are an educational AI analyzing student homework performance. Analyze the data and return ONLY valid JSON.

Student Homework Data (${homeworkData.length} submissions):
${analysisContext}

Analysis Period: ${startDate} to ${endDate}

CRITICAL: Return ONLY this JSON structure with NO extra text, markdown, or explanations:

{
  "overallAssessment": "종합평가 (학생의 전반적인 학습 상태를 2-3문장으로 요약)",
  "detailedAnalysis": "상세 분석 (숙제 데이터를 바탕으로 한 구체적인 분석 내용)",
  "weaknessPatterns": [
    {
      "pattern": "약점 유형명",
      "description": "이 약점이 나타나는 이유와 패턴"
    }
  ],
  "conceptsNeedingReview": [
    {
      "concept": "복습이 필요한 개념명",
      "reason": "왜 복습이 필요한지",
      "priority": "high"
    }
  ],
  "improvementSuggestions": [
    {
      "area": "개선이 필요한 영역",
      "method": "구체적인 개선 방법"
    }
  ],
  "learningDirection": "앞으로의 학습 방향 제시 (2-3문장)"
}

Rules:
1. Focus on homework scores below 80 points
2. Identify recurring error patterns
3. Use ONLY Korean text for all values
4. Maximum 5 items per array
5. priority can be "high", "medium", or "low"
6. NO markdown, NO explanations, ONLY the JSON object
7. Ensure all JSON syntax is perfect (proper commas, quotes, brackets)`;


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
    // Gemini 2.5 Flash Lite 모델 사용
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent?key=${geminiApiKey}`;

    console.log('🔄 Calling Gemini 2.5 Flash Lite API...');
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
      
      // JSON 파싱 (3단계)
      let parsedData;
      try {
        // 1차 시도: 직접 파싱
        parsedData = JSON.parse(jsonString);
        console.log('✅ 1차 파싱 성공!');
      } catch (e1) {
        console.warn('⚠️ 1차 실패, 2차 시도 (정제)');
        
        try {
          // 2차 시도: 제어문자 제거
          const cleaned = jsonString
            .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
            .replace(/\n/g, ' ')
            .replace(/\r/g, '')
            .replace(/\t/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          parsedData = JSON.parse(cleaned);
          console.log('✅ 2차 파싱 성공!');
        } catch (e2) {
          console.warn('⚠️ 2차 실패, 3차 시도 (JSON 수정)');
          
          // 3차 시도: 잘못된 쉼표/따옴표 수정
          const fixed = jsonString
            .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
            .replace(/\n/g, ' ')
            .replace(/\r/g, '')
            .replace(/\t/g, ' ')
            .replace(/,\s*}/g, '}')  // 객체 끝의 쉼표 제거
            .replace(/,\s*]/g, ']')  // 배열 끝의 쉼표 제거
            .replace(/}\s*{/g, '},{')  // 연속된 객체 사이 쉼표 추가
            .replace(/"\s*"\s*:/g, '":')  // 잘못된 따옴표 수정
            .replace(/:\s*"\s*"/g, ':""')  // 빈 문자열 수정
            .replace(/\s+/g, ' ')
            .trim();
          
          parsedData = JSON.parse(fixed);
          console.log('✅ 3차 파싱 성공 (JSON 수정)!');
        }
      }
      
      // Gemini 응답을 프론트엔드 형식으로 변환
      analysisResult = {
        summary: parsedData.overallAssessment || parsedData.summary || '분석 완료',
        detailedAnalysis: parsedData.detailedAnalysis || '',
        learningDirection: parsedData.learningDirection || '',
        weakConcepts: [],
        recommendations: [],
        commonMistakeTypes: []
      };
      
      // conceptsNeedingReview → weakConcepts 변환
      if (Array.isArray(parsedData.conceptsNeedingReview)) {
        analysisResult.weakConcepts = parsedData.conceptsNeedingReview.map((item: any) => ({
          concept: item.concept || '개념',
          description: item.reason || item.description || '',
          severity: item.priority || 'medium',
          relatedTopics: item.relatedTopics || []
        }));
      }
      
      // weaknessPatterns를 weakConcepts에 추가
      if (Array.isArray(parsedData.weaknessPatterns)) {
        parsedData.weaknessPatterns.forEach((item: any) => {
          analysisResult.weakConcepts.push({
            concept: item.pattern || '약점 패턴',
            description: item.description || '',
            severity: 'medium',
            relatedTopics: []
          });
        });
      }
      
      // improvementSuggestions → recommendations 변환
      if (Array.isArray(parsedData.improvementSuggestions)) {
        analysisResult.recommendations = parsedData.improvementSuggestions.map((item: any) => ({
          concept: item.area || '개선 영역',
          action: item.method || item.action || ''
        }));
      }
      
      // weaknessPatterns를 commonMistakeTypes로 추가
      if (Array.isArray(parsedData.weaknessPatterns)) {
        analysisResult.commonMistakeTypes = parsedData.weaknessPatterns.map((item: any, idx: number) => ({
          id: idx + 1,
          type: item.pattern || '유형',
          frequency: 'medium',
          example: item.description || '',
          solution: item.solution || ''
        }));
      }
      
      console.log('✅ 분석 완료! weakConcepts:', analysisResult.weakConcepts.length, 'recommendations:', analysisResult.recommendations.length);
      console.log('📊 변환된 데이터:', JSON.stringify(analysisResult, null, 2));
      
    } catch (parseError: any) {
      console.error('❌ 모든 파싱 실패:', parseError.message);
      
      // 최후의 수단: 정규식으로 데이터 추출
      try {
        const responseText = geminiData.candidates[0].content.parts[0].text;
        console.warn('⚠️ 정규식 추출 시도');
        
        // summary 추출
        const summaryMatch = responseText.match(/"summary"\s*:\s*"([^"]+)"/);
        const summary = summaryMatch ? summaryMatch[1] : '분석 데이터가 있으나 형식 오류';
        
        // weakConcepts 배열 추출
        const weakConcepts: any[] = [];
        const conceptRegex = /"concept"\s*:\s*"([^"]+)"[^}]*"description"\s*:\s*"([^"]+)"[^}]*"severity"\s*:\s*"([^"]+)"/g;
        let match;
        while ((match = conceptRegex.exec(responseText)) !== null && weakConcepts.length < 5) {
          weakConcepts.push({
            concept: match[1],
            description: match[2],
            severity: match[3],
            relatedTopics: []
          });
        }
        
        // recommendations 배열 추출
        const recommendations: any[] = [];
        const recRegex = /"concept"\s*:\s*"([^"]+)"[^}]*"action"\s*:\s*"([^"]+)"/g;
        while ((match = recRegex.exec(responseText)) !== null && recommendations.length < 5) {
          if (!weakConcepts.find(c => c.concept === match[1])) {
            recommendations.push({
              concept: match[1],
              action: match[2]
            });
          }
        }
        
        analysisResult = {
          summary: summary,
          detailedAnalysis: '',
          learningDirection: '',
          weakConcepts: weakConcepts,
          recommendations: recommendations,
          commonMistakeTypes: []
        };
        
        console.log('✅ 정규식 추출 성공! 개념:', weakConcepts.length);
        
      } catch (regexError: any) {
        console.error('❌ 정규식 추출도 실패:', regexError.message);
        
        // 파싱 실패 시 빈 결과 반환
        analysisResult = {
          summary: `AI 응답 파싱 실패\n\n오류: ${parseError.message}\n\nGemini 2.5 Flash API는 정상 응답했지만 JSON 파싱에 실패했습니다.\n\n**해결 방법:**\n1. Cloudflare Pages 대시보드 → Workers & Pages → superplacestudy → Logs에서 전체 응답 확인\n2. '📝 Gemini 2.5 Flash 원본 응답' 로그 확인\n3. API 키가 올바른지 확인\n\n분석 대상: 채팅 ${chatHistory.length}건, 숙제 ${homeworkData.length}건`,
          detailedAnalysis: '',
          learningDirection: '',
          weakConcepts: [],
          recommendations: [],
          commonMistakeTypes: []
        };
        console.error('❌ 파싱 실패로 오류 메시지와 함께 빈 결과 반환');
      }
    }

    // 6. 분석 결과를 DB에 저장 (캐싱)
    try {
      await DB.prepare(`
        CREATE TABLE IF NOT EXISTS student_weak_concepts (
          id TEXT PRIMARY KEY,
          studentId INTEGER NOT NULL,
          summary TEXT,
          detailedAnalysis TEXT,
          learningDirection TEXT,
          weakConcepts TEXT,
          recommendations TEXT,
          commonMistakeTypes TEXT,
          chatCount INTEGER,
          homeworkCount INTEGER,
          analyzedAt TEXT DEFAULT (datetime('now')),
          UNIQUE(studentId)
        )
      `).run();

      const cacheId = `weak-concepts-${studentId}-${Date.now()}`;
      
      await DB.prepare(`
        INSERT OR REPLACE INTO student_weak_concepts 
        (id, studentId, summary, detailedAnalysis, learningDirection, weakConcepts, recommendations, commonMistakeTypes, chatCount, homeworkCount, analyzedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        cacheId,
        parseInt(studentId),
        analysisResult.summary || "",
        analysisResult.detailedAnalysis || "",
        analysisResult.learningDirection || "",
        JSON.stringify(analysisResult.weakConcepts || []),
        JSON.stringify(analysisResult.recommendations || []),
        JSON.stringify(analysisResult.commonMistakeTypes || []),
        chatHistory.length,
        homeworkData.length
      ).run();

      console.log('✅ Weak concepts analysis cached successfully');
    } catch (cacheError) {
      console.warn('⚠️ Failed to cache analysis result:', cacheError);
    }

    // 🆕 부족한 개념 분석 사용량 로그 기록
    try {
      // studentId로부터 학생의 학원 정보 가져오기
      const student = await DB.prepare(`
        SELECT id, academyId FROM User WHERE id = ?
      `).bind(parseInt(studentId)).first();

      if (student && student.academyId) {
        // 학원장 찾기
        const director = await DB.prepare(`
          SELECT id FROM User 
          WHERE academyId = ? AND role = 'DIRECTOR'
          LIMIT 1
        `).bind(student.academyId).first();

        if (director) {
          // usage_logs에 기록
          const logId = `log_concept_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await DB.prepare(`
            INSERT INTO usage_logs (id, userId, subscriptionId, type, action, createdAt)
            VALUES (?, ?, 1, 'weak_concept', '부족한 개념 분석 실행', datetime('now'))
          `).bind(logId, director.id).run();
          
          console.log('✅ Weak concept analysis usage logged for director:', director.id);
        }
      }
    } catch (logError: any) {
      console.warn('⚠️ Failed to log weak concept analysis usage:', logError.message);
      // 로깅 실패해도 분석은 계속 진행
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
// Updated: Sat Feb 14 23:48:33 UTC 2026
