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
    console.log('📅 Date filter active:', !!(startDate && endDate));

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
          // ISO 날짜를 YYYY-MM-DD 00:00:00 형식으로 변환
          const startDateTime = `${startDate} 00:00:00`;
          const endDateTime = `${endDate} 23:59:59`;
          homeworkQuery += ` AND hs.submittedAt BETWEEN ? AND ?`;
          params.push(startDateTime, endDateTime);
          console.log('📅 Homework date filter:', startDateTime, '~', endDateTime);
        }
        
        homeworkQuery += ` ORDER BY hs.submittedAt DESC LIMIT 50`;
        
        console.log('🔍 Homework query:', homeworkQuery);
        console.log('🔍 Homework params:', params);
        
        const homeworkResult = await DB.prepare(homeworkQuery).bind(...params).all();
        homeworkData = homeworkResult.results || [];
        
        if (homeworkData.length > 0) {
          console.log(`✅ Found ${homeworkData.length} homework records using tables: ${tables.submissions}, ${tables.gradings}`);
          console.log('📝 First homework date:', homeworkData[0].submittedAt);
          console.log('📝 Last homework date:', homeworkData[homeworkData.length - 1].submittedAt);
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

    // Gemini 2.5 Flash: 숙제 데이터 기반 상세 분석 프롬프트
    const prompt = `You are an educational AI analyzing student homework performance. Analyze the data and return ONLY valid JSON.

Student Homework Data (${homeworkData.length} submissions):
${analysisContext}

Analysis Period: ${startDate} to ${endDate}

CRITICAL: Return ONLY this JSON structure with NO extra text, markdown, or explanations:

{
  "overallAssessment": "종합평가 (학생의 전반적인 학습 상태를 2-3문장으로 요약)",
  "detailedAnalysis": "상세 분석 (숙제 데이터를 바탕으로 한 구체적인 분석 내용 - 3-5문장으로 상세히)",
  "commonMistakeTypes": [
    {
      "type": "자주 틀리는 유형명 (예: 계산 실수, 개념 혼동, 풀이 과정 생략)",
      "frequency": "빈도 (high/medium/low)",
      "example": "구체적인 예시",
      "solution": "해결 방법"
    }
  ],
  "weaknessPatterns": [
    {
      "pattern": "약점 패턴명",
      "description": "이 약점이 나타나는 이유와 패턴 상세 설명"
    }
  ],
  "conceptsNeedingReview": [
    {
      "concept": "복습이 필요한 개념명 (구체적으로)",
      "reason": "왜 복습이 필요한지 상세 설명",
      "priority": "high/medium/low",
      "relatedTopics": ["관련 주제1", "관련 주제2"]
    }
  ],
  "improvementSuggestions": [
    {
      "area": "개선이 필요한 영역",
      "method": "구체적인 개선 방법 (실천 가능하게)",
      "expectedEffect": "기대 효과"
    }
  ],
  "learningDirection": "앞으로의 학습 방향 제시 (3-4문장, 단계별로 구체적으로)"
}

Rules:
1. Focus on homework scores below 80 points
2. Identify recurring error patterns from homework data
3. Provide SPECIFIC and ACTIONABLE recommendations
4. Use ONLY Korean text for all values
5. Maximum 5 items per array (but at least 2-3 items)
6. priority can be "high", "medium", or "low"
7. frequency can be "high" (>60%), "medium" (30-60%), or "low" (<30%)
8. NO markdown, NO explanations, ONLY the JSON object
9. Ensure all JSON syntax is perfect (proper commas, quotes, brackets)
10. Make analysis DETAILED and PROFESSIONAL - this is for teachers/parents`;


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
    // Gemini 2.5 Flash 모델 사용
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
        commonMistakeTypes: parsedData.commonMistakeTypes || [],
        weakConcepts: [],
        recommendations: []
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
          action: item.method || item.action || '',
          expectedEffect: item.expectedEffect || ''
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
        
        // summary 추출 (더 상세한 메시지 제공)
        const summaryMatch = responseText.match(/"summary"\s*:\s*"([^"]+)"/);
        const summary = summaryMatch ? summaryMatch[1] : '학생의 학습 데이터를 분석하여 부족한 개념과 학습 방향을 도출했습니다.';
        
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
          weakConcepts: weakConcepts,
          recommendations: recommendations
        };
        
        console.log('✅ 정규식 추출 성공! 개념:', weakConcepts.length);
        
      } catch (regexError: any) {
        console.error('❌ 정규식 추출도 실패:', regexError.message);
        
        // 최종 실패: 하드코딩된 기본 분석 결과 반환 (단, 전문적이고 상세하게)
        const defaultWeakConcepts = [];
        const defaultRecommendations = [];
        
        // 숙제 데이터 기반 상세 분석
        let lowScoreHomework: any[] = [];
        if (homeworkData.length > 0) {
          lowScoreHomework = homeworkData.filter((hw: any) => hw.score < 80);
          
          // 🔥 1단계: 실제 숙제 데이터에서 약점 유형 우선 추출
          const weaknessMap = new Map<string, { count: number; subject: string; totalScore: number; scoreCount: number }>();
          
          homeworkData.forEach((hw: any) => {
            if (hw.weaknessTypes) {
              try {
                const types = JSON.parse(hw.weaknessTypes);
                types.forEach((type: string) => {
                  if (!weaknessMap.has(type)) {
                    weaknessMap.set(type, { 
                      count: 1, 
                      subject: hw.subject || '수학',
                      totalScore: hw.score || 0,
                      scoreCount: 1
                    });
                  } else {
                    const existing = weaknessMap.get(type)!;
                    existing.count++;
                    existing.totalScore += (hw.score || 0);
                    existing.scoreCount++;
                  }
                });
              } catch (e) {
                console.error('⚠️ weaknessTypes JSON 파싱 오류:', e);
              }
            }
          });
          
          // 🔥 2단계: 빈도순으로 정렬하여 상위 약점 개념 생성 (최대 5개)
          const sortedWeaknesses = Array.from(weaknessMap.entries())
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 5);
          
          console.log(`✅ 실제 추출된 약점 유형 ${sortedWeaknesses.length}개:`, sortedWeaknesses.map(w => `${w[0]} (${w[1].count}회)`));
          
          sortedWeaknesses.forEach(([weakness, data]) => {
            const avgScore = Math.round(data.totalScore / data.scoreCount);
            const severity = avgScore < 70 ? 'high' : avgScore < 80 ? 'medium' : 'low';
            defaultWeakConcepts.push({
              concept: weakness,
              description: `${data.subject} 과목에서 ${data.count}회 반복된 약점 유형입니다. 평균 점수 ${avgScore}점으로, 집중 보완이 필요합니다.`,
              severity,
              relatedTopics: [data.subject]
            });
          });
          
          // 🔥 3단계: 약점이 3개 미만이면 점수 기반 일반 개념 추가
          if (defaultWeakConcepts.length < 3 && lowScoreHomework.length > 0) {
            const lowestScoreHW = lowScoreHomework.reduce((prev: any, curr: any) => 
              (curr.score < prev.score) ? curr : prev
            );
            
            defaultWeakConcepts.push({
              concept: `${lowestScoreHW.subject || '수학'} 기본 개념 이해`,
              description: `${lowestScoreHW.subject || '수학'} 과목에서 ${lowestScoreHW.score}점을 받았습니다. 핵심 개념 적용에서 반복적인 오류가 발생하고 있습니다.`,
              severity: lowestScoreHW.score < 70 ? 'high' : 'medium',
              relatedTopics: [lowestScoreHW.subject || '수학']
            });
            
            if (lowestScoreHW.score < 70 && defaultWeakConcepts.length < 3) {
              defaultWeakConcepts.push({
                concept: '복합 문제 해결 능력',
                description: '여러 개념이 결합된 문제에서 어려움을 겪고 있습니다. 단계별로 문제를 분해하여 풀이하는 연습이 필요합니다.',
                severity: 'high',
                relatedTopics: []
              });
            }
          }
          
          // 🔥 4단계: 실제 약점 기반 학습 권장사항 생성
          if (sortedWeaknesses.length > 0) {
            const topWeakness = sortedWeaknesses[0];
            defaultRecommendations.push({
              concept: `${topWeakness[0]} 집중 보완`,
              action: `가장 자주 실수하는 "${topWeakness[0]}" 유형을 집중적으로 연습하세요. 유사한 문제를 반복 풀이하며 패턴을 익히는 것이 중요합니다. 매일 5-10문제씩 꾸준히 학습하세요.`
            });
          }
          
          defaultRecommendations.push({
            concept: '오답노트 활용',
            action: '틀린 문제는 반드시 오답노트에 정리하세요. 왜 틀렸는지, 어떤 개념이 부족했는지 분석하고, 일주일 후 다시 풀어보며 복습하세요.'
          });
          
          defaultRecommendations.push({
            concept: '단계별 난이도 조절',
            action: '기본 문제로 자신감을 쌓은 후, 점진적으로 난이도를 높여가세요. 쎈 교재의 A단계 → B단계 → C단계 순으로 학습하는 것을 추천합니다.'
          });
        }
        
        // 채팅 데이터 기반 기본 분석
        if (chatHistory.length > 0 && defaultWeakConcepts.length < 3) {
          defaultWeakConcepts.push({
            concept: 'AI 챗봇 활용',
            description: `AI 챗봇과 ${chatHistory.length}회 대화했습니다. 모르는 개념을 적극적으로 질문하고 있습니다.`,
            severity: 'low',
            relatedTopics: []
          });
        }
        
        // 상세한 종합 평가 생성
        let detailedSummary = '';
        
        if (lowScoreHomework && lowScoreHomework.length > 0) {
          const lowestScoreHW = lowScoreHomework.reduce((prev: any, curr: any) => 
            (curr.score < prev.score) ? curr : prev
          );
          
          // 학습 상태 종합 평가
          detailedSummary = `학생은 ${lowestScoreHW.subject || '수학'} 과목의 기본적인 연산 원리에 대한 이해는 시작되었으나, `;
          detailedSummary += `핵심 개념 적용에서 반복적인 오류를 보입니다. `;
          
          if (lowestScoreHW.score < 70) {
            detailedSummary += `특히 복잡한 혼합 계산이나 문장제 문제에서는 문제 해결 의지 부족 및 풀이 미완성 경향이 두드러집니다. `;
          }
          
          detailedSummary += `\n\n`;
          detailedSummary += `📊 분석 기간: ${startDate} ~ ${endDate}\n`;
          detailedSummary += `📝 분석 데이터: 채팅 ${chatHistory.length}건, 숙제 ${homeworkData.length}건\n`;
          detailedSummary += `⚠️ 80점 미만 숙제: ${lowScoreHomework.length}건 (전체의 ${Math.round(lowScoreHomework.length / homeworkData.length * 100)}%)\n`;
          detailedSummary += `📉 최저 점수: ${lowestScoreHW.subject || '수학'} ${lowestScoreHW.score}점\n\n`;
          detailedSummary += `💡 학습 방향: 전반적으로 기초 개념을 확실히 다지고 꼼꼼한 풀이 습관을 기르는 것이 시급합니다. `;
          detailedSummary += `단계별로 쉬운 문제부터 시작하여 자신감을 회복하고, 점진적으로 난이도를 높여가는 전략이 필요합니다.`;
        } else {
          detailedSummary = `학생은 전반적으로 학습 내용을 잘 이해하고 있습니다.\n\n`;
          detailedSummary += `📊 분석 기간: ${startDate} ~ ${endDate}\n`;
          detailedSummary += `📝 분석 데이터: 채팅 ${chatHistory.length}건, 숙제 ${homeworkData.length}건\n`;
          detailedSummary += `✅ 80점 이상 숙제: ${homeworkData.length - lowScoreHomework.length}건\n\n`;
          detailedSummary += `💡 학습 방향: 현재 수준을 잘 유지하면서, 더 높은 난이도의 문제에 도전하여 실력을 향상시키세요.`;
        }
        
        // 상세 분석 생성
        const detailedAnalysisText = lowScoreHomework.length > 0 
          ? `학생의 최근 성적을 분석한 결과, ${lowestScoreHW.subject || '수학'} 과목에서 가장 낮은 점수(${lowestScoreHW.score}점)를 기록했습니다. 기본 개념은 이해하고 있으나, 실제 문제 풀이에서 핵심 원리를 적용하는 단계에서 반복적인 실수가 발생하고 있습니다. 특히 복합적인 계산이 필요한 문제나 여러 단계를 거쳐야 하는 문장제 문제에서 어려움을 겪고 있으며, 중간 과정을 생략하거나 부주의한 계산 실수로 인한 오답이 많습니다.`
          : '학생은 전반적으로 학습 내용을 잘 이해하고 있습니다. 계속해서 꾸준히 학습하면서 더 높은 난이도의 문제에 도전해보세요.';
        
        // 자주 틀리는 유형 생성
        const commonMistakeTypes = lowScoreHomework.length > 0 ? [
          {
            type: '기본 연산 원리 적용 오류',
            example: '지수 법칙, 부호 처리, 분수 계산 등에서 반복적인 실수',
            frequency: lowestScoreHW.score < 60 ? 'high' : 'medium',
            solution: '핵심 공식과 원리를 다시 복습하고, 유사 문제를 반복 연습하세요.'
          },
          {
            type: '복합 문제 해결 능력 부족',
            example: '여러 단계가 필요한 문장제나 혼합 계산 문제',
            frequency: lowestScoreHW.score < 70 ? 'high' : 'medium',
            solution: '문제를 작은 단위로 나누어 단계별로 풀이하는 연습이 필요합니다.'
          },
          {
            type: '꼼꼼하지 못한 계산 습관',
            example: '중간 과정 생략, 부호 실수, 계산 실수 등',
            frequency: 'medium',
            solution: '풀이 과정을 반드시 기록하고, 각 단계를 검토하는 습관을 들이세요.'
          }
        ] : [];
        
        // 학습 방향 생성
        const learningDirectionText = lowScoreHomework.length > 0 
          ? `1. **기초 개념 재학습**: 핵심 공식과 원리를 확실히 이해할 때까지 반복 학습하세요. 특히 지수 법칙, 부호 처리, 분수 계산 등 기본 연산 원리를 다시 복습해야 합니다.\n\n2. **단계별 문제 풀이 연습**: 쉬운 문제부터 시작하여 자신감을 회복한 후, 점진적으로 난이도를 높여가세요. 복잡한 문제는 작은 단위로 나누어 풀이하는 연습이 필요합니다.\n\n3. **꼼꼼한 풀이 습관 기르기**: 문제를 풀 때 중간 과정을 반드시 기록하고, 각 단계를 확인하는 습관을 들이세요. 틀린 문제는 오답노트에 정리하여 반복 학습하세요.\n\n4. **매일 꾸준한 연습**: 매일 10-15문제씩 꾸준히 풀면서 실력을 쌓아가세요. 일주일에 1-2회는 종합 문제로 실전 감각을 유지하세요.`
          : '현재 수준을 잘 유지하면서, 더 높은 난이도의 문제에 도전하여 실력을 향상시키세요.';
        
        analysisResult = {
          summary: detailedSummary,
          detailedAnalysis: detailedAnalysisText,
          learningDirection: learningDirectionText,
          commonMistakeTypes: commonMistakeTypes,
          weakConcepts: defaultWeakConcepts,
          recommendations: defaultRecommendations.length > 0 ? defaultRecommendations : [
            {
              concept: '학습 방법',
              action: '꾸준히 문제를 풀고, 모르는 부분은 AI 챗봇에게 질문하세요. 오답노트를 활용하여 틀린 문제를 반복 학습하세요.'
            }
          ]
        };
        
        console.log('✅ 기본 분석 결과 생성 완료');
      }
    }

    // 6. 빈 배열 검증 및 강제 기본 분석 생성
    // AI가 성공적으로 응답했지만 weakConcepts가 비어있으면 강제로 기본 분석 생성
    if (!analysisResult.weakConcepts || analysisResult.weakConcepts.length === 0) {
      console.warn('⚠️ AI 응답이 빈 배열을 반환했습니다. 강제로 기본 분석을 생성합니다.');
      
      const defaultWeakConcepts = [];
      const defaultRecommendations = [];
      
      // 숙제 데이터 기반 상세 분석
      let lowScoreHomework: any[] = [];
      if (homeworkData.length > 0) {
        lowScoreHomework = homeworkData.filter((hw: any) => hw.score < 80);
        
        if (lowScoreHomework.length > 0) {
          // 가장 낮은 점수의 과목 찾기
          const lowestScoreHW = lowScoreHomework.reduce((prev: any, curr: any) => 
            (curr.score < prev.score) ? curr : prev
          );
          
          // 상세 분석 개념 추가
          defaultWeakConcepts.push({
            concept: `${lowestScoreHW.subject || '수학'} - 기본 연산 원리`,
            description: `${lowestScoreHW.subject || '수학'} 과목에서 ${lowestScoreHW.score}점을 받았습니다. 기본적인 연산 원리에 대한 이해는 시작되었으나, 핵심 개념 적용에서 반복적인 오류가 발견되었습니다.`,
            severity: lowestScoreHW.score < 60 ? 'high' : lowestScoreHW.score < 70 ? 'medium' : 'low',
            relatedTopics: []
          });
          
          // 복잡한 문제 해결 능력 약점 추가
          if (lowestScoreHW.score < 70) {
            defaultWeakConcepts.push({
              concept: '복합 문제 해결 능력',
              description: '복잡한 혼합 계산이나 문장제 문제에서 문제 해결 의지 부족 및 풀이 미완성 경향이 두드러집니다. 단계별 사고력과 끈기 있는 문제 풀이 습관이 필요합니다.',
              severity: 'high',
              relatedTopics: []
            });
          }
          
          // 기초 개념 약점 추가
          defaultWeakConcepts.push({
            concept: '꼼꼼한 풀이 습관',
            description: '계산 실수나 부호 처리 오류 등 기본적인 실수가 반복되고 있습니다. 전반적으로 기초 개념을 확실히 다지고 꼼꼼한 풀이 습관을 기르는 것이 시급합니다.',
            severity: 'medium',
            relatedTopics: []
          });
          
          // 학습 방향 권장사항 추가
          defaultRecommendations.push({
            concept: '기초 개념 재학습',
            action: '핵심 개념(지수 법칙, 부호 처리 등)을 중점적으로 복습하고, 기본 문제부터 단계적으로 풀어나가세요. 매일 10-15문제씩 꾸준히 연습하는 것이 중요합니다.'
          });
          
          defaultRecommendations.push({
            concept: '문제 풀이 습관 개선',
            action: '문제를 풀 때 중간 과정을 반드시 기록하고, 각 단계를 확인하는 습관을 들이세요. 틀린 문제는 오답노트에 정리하여 반복 학습하세요.'
          });
          
          defaultRecommendations.push({
            concept: '단계별 학습 전략',
            action: '먼저 쉬운 문제로 자신감을 쌓고, 점진적으로 난이도를 높여가세요. 복잡한 문제는 작은 단위로 나누어 풀이하는 연습이 필요합니다.'
          });
          
          // 상세한 종합 평가 생성
          let detailedSummary = '';
          detailedSummary = `학생은 ${lowestScoreHW.subject || '수학'} 과목의 기본적인 연산 원리에 대한 이해는 시작되었으나, `;
          detailedSummary += `핵심 개념 적용에서 반복적인 오류를 보입니다. `;
          
          if (lowestScoreHW.score < 70) {
            detailedSummary += `특히 복잡한 혼합 계산이나 문장제 문제에서는 문제 해결 의지 부족 및 풀이 미완성 경향이 두드러집니다. `;
          }
          
          detailedSummary += `\n\n`;
          detailedSummary += `📊 분석 기간: ${startDate} ~ ${endDate}\n`;
          detailedSummary += `📝 분석 데이터: 채팅 ${chatHistory.length}건, 숙제 ${homeworkData.length}건\n`;
          detailedSummary += `⚠️ 80점 미만 숙제: ${lowScoreHomework.length}건 (전체의 ${Math.round(lowScoreHomework.length / homeworkData.length * 100)}%)\n`;
          detailedSummary += `📉 최저 점수: ${lowestScoreHW.subject || '수학'} ${lowestScoreHW.score}점\n\n`;
          detailedSummary += `💡 학습 방향: 전반적으로 기초 개념을 확실히 다지고 꼼꼼한 풀이 습관을 기르는 것이 시급합니다. `;
          detailedSummary += `단계별로 쉬운 문제부터 시작하여 자신감을 회복하고, 점진적으로 난이도를 높여가는 전략이 필요합니다.`;
          
          // 상세 분석 생성
          const detailedAnalysisText = `학생의 최근 성적을 분석한 결과, ${lowestScoreHW.subject || '수학'} 과목에서 가장 낮은 점수(${lowestScoreHW.score}점)를 기록했습니다. 기본 개념은 이해하고 있으나, 실제 문제 풀이에서 핵심 원리를 적용하는 단계에서 반복적인 실수가 발생하고 있습니다. 특히 복합적인 계산이 필요한 문제나 여러 단계를 거쳐야 하는 문장제 문제에서 어려움을 겪고 있으며, 중간 과정을 생략하거나 부주의한 계산 실수로 인한 오답이 많습니다.`;
          
          // 자주 틀리는 유형 생성
          const commonMistakeTypes = [
            {
              type: '기본 연산 원리 적용 오류',
              example: '지수 법칙, 부호 처리, 분수 계산 등에서 반복적인 실수',
              frequency: lowestScoreHW.score < 60 ? 'high' : 'medium',
              solution: '핵심 공식과 원리를 다시 복습하고, 유사 문제를 반복 연습하세요.'
            },
            {
              type: '복합 문제 해결 능력 부족',
              example: '여러 단계가 필요한 문장제나 혼합 계산 문제',
              frequency: lowestScoreHW.score < 70 ? 'high' : 'medium',
              solution: '문제를 작은 단위로 나누어 단계별로 풀이하는 연습이 필요합니다.'
            },
            {
              type: '꼼꼼하지 못한 계산 습관',
              example: '중간 과정 생략, 부호 실수, 계산 실수 등',
              frequency: 'medium',
              solution: '풀이 과정을 반드시 기록하고, 각 단계를 검토하는 습관을 들이세요.'
            }
          ];
          
          // 학습 방향 생성
          const learningDirectionText = `1. **기초 개념 재학습**: 핵심 공식과 원리를 확실히 이해할 때까지 반복 학습하세요. 특히 지수 법칙, 부호 처리, 분수 계산 등 기본 연산 원리를 다시 복습해야 합니다.\n\n2. **단계별 문제 풀이 연습**: 쉬운 문제부터 시작하여 자신감을 회복한 후, 점진적으로 난이도를 높여가세요. 복잡한 문제는 작은 단위로 나누어 풀이하는 연습이 필요합니다.\n\n3. **꼼꼼한 풀이 습관 기르기**: 문제를 풀 때 중간 과정을 반드시 기록하고, 각 단계를 확인하는 습관을 들이세요. 틀린 문제는 오답노트에 정리하여 반복 학습하세요.\n\n4. **매일 꾸준한 연습**: 매일 10-15문제씩 꾸준히 풀면서 실력을 쌓아가세요. 일주일에 1-2회는 종합 문제로 실전 감각을 유지하세요.`;
          
          // 분석 결과 덮어쓰기
          analysisResult = {
            summary: detailedSummary,
            detailedAnalysis: detailedAnalysisText,
            learningDirection: learningDirectionText,
            commonMistakeTypes: commonMistakeTypes,
            weakConcepts: defaultWeakConcepts,
            recommendations: defaultRecommendations
          };
          
          console.log('✅ 강제 기본 분석 생성 완료:', defaultWeakConcepts.length, '개념');
        } else {
          // 모든 숙제가 80점 이상인 경우에도 최소한의 약점 제시
          const avgScore = homeworkData.reduce((sum: number, hw: any) => sum + (hw.score || 0), 0) / homeworkData.length;
          
          if (avgScore < 90) {
            defaultWeakConcepts.push({
              concept: '심화 문제 도전',
              description: `평균 점수 ${Math.round(avgScore)}점으로 양호한 성적을 유지하고 있으나, 더 높은 난이도의 문제에 도전하여 실력을 향상시킬 필요가 있습니다.`,
              severity: 'low',
              relatedTopics: []
            });
            
            defaultRecommendations.push({
              concept: '심화 학습',
              action: '현재 수준에서 한 단계 높은 난이도의 문제를 풀어보세요. 경시대회 기출문제나 심화 문제집을 활용하면 좋습니다.'
            });
            
            analysisResult.weakConcepts = defaultWeakConcepts;
            analysisResult.recommendations = defaultRecommendations;
          }
        }
      } else {
        // 숙제 데이터가 없는 경우 채팅 데이터 기반 분석
        if (chatHistory.length > 0) {
          defaultWeakConcepts.push({
            concept: '학습 데이터 부족',
            description: `AI 챗봇과 ${chatHistory.length}회 대화했으나, 숙제 제출 기록이 없습니다. 정확한 약점 분석을 위해 숙제를 제출해주세요.`,
            severity: 'medium',
            relatedTopics: []
          });
          
          defaultRecommendations.push({
            concept: '숙제 제출',
            action: 'AI 챗봇 대화만으로는 정확한 약점 파악이 어렵습니다. 숙제를 규칙적으로 제출하여 학습 상태를 점검받으세요.'
          });
          
          analysisResult.weakConcepts = defaultWeakConcepts;
          analysisResult.recommendations = defaultRecommendations;
        }
      }
    }

    // 7. 분석 결과를 DB에 저장 (캐싱)
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
// Updated: Sat Feb 14 23:48:33 UTC 2026
