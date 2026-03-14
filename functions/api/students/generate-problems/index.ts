interface Env {
  DB: D1Database;
  GOOGLE_GEMINI_API_KEY?: string;
  GEMINI_API_KEY?: string;
}

/**
 * POST /api/students/generate-problems
 * Gemini 2.5 Flash Lite를 사용하여 학생의 부족한 개념을 채워줄 유사문제 20문제 + 답안지 생성
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB, GOOGLE_GEMINI_API_KEY, GEMINI_API_KEY } = context.env;
    const body = await context.request.json() as any;
    const { 
      studentId, 
      concepts, 
      problemTypes, 
      questionFormats, 
      problemCount, 
      studentName, 
      studentGrade, 
      subject 
    } = body;

    if (!studentId || !concepts || concepts.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "studentId and concepts are required" 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = GOOGLE_GEMINI_API_KEY || GEMINI_API_KEY;

    console.log(`🎯 유사문제 생성 요청 (Gemini 2.5 Flash Lite): ${studentName} (ID: ${studentId})`);
    console.log(`📋 개념 (${concepts.length}개): ${concepts.join(', ')}`);
    console.log(`📚 과목: ${subject}, 학년: ${studentGrade}`);

    // 1. 학원장 제한 설정 확인 (similar_problem_enabled)
    if (DB) {
      try {
        const student = await DB.prepare(`
          SELECT id, academyId FROM users WHERE id = ?
        `).bind(parseInt(studentId)).first();

        if (student && student.academyId) {
          const limitation = await DB.prepare(`
            SELECT similar_problem_enabled, similar_problem_daily_limit, similar_problem_daily_used,
                   similar_problem_monthly_limit, similar_problem_monthly_used
            FROM director_limitations
            WHERE academy_id = ?
            LIMIT 1
          `).bind(student.academyId).first();

          if (limitation) {
            // 기능 비활성화 확인
            if (limitation.similar_problem_enabled === 0) {
              console.log('❌ 유사문제 출제 기능이 비활성화됨');
              return new Response(
                JSON.stringify({
                  success: false,
                  error: "FEATURE_DISABLED",
                  message: "유사문제 출제 기능이 현재 요금제에서 비활성화되어 있습니다.",
                }),
                { status: 403, headers: { "Content-Type": "application/json" } }
              );
            }

            // 일일 한도 확인 (0이면 무제한)
            const dailyLimit = limitation.similar_problem_daily_limit as number;
            const dailyUsed = limitation.similar_problem_daily_used as number;
            if (dailyLimit > 0 && dailyUsed >= dailyLimit) {
              console.log(`❌ 유사문제 출제 일일 한도 초과: ${dailyUsed}/${dailyLimit}`);
              return new Response(
                JSON.stringify({
                  success: false,
                  error: "DAILY_LIMIT_EXCEEDED",
                  message: `유사문제 출제 일일 한도를 초과했습니다. (${dailyUsed}/${dailyLimit})`,
                  currentUsage: dailyUsed,
                  maxLimit: dailyLimit,
                }),
                { status: 403, headers: { "Content-Type": "application/json" } }
              );
            }

            // 월간 한도 확인 (0이면 무제한)
            const monthlyLimit = limitation.similar_problem_monthly_limit as number;
            const monthlyUsed = limitation.similar_problem_monthly_used as number;
            if (monthlyLimit > 0 && monthlyUsed >= monthlyLimit) {
              console.log(`❌ 유사문제 출제 월간 한도 초과: ${monthlyUsed}/${monthlyLimit}`);
              return new Response(
                JSON.stringify({
                  success: false,
                  error: "MONTHLY_LIMIT_EXCEEDED",
                  message: `유사문제 출제 월간 한도를 초과했습니다. (${monthlyUsed}/${monthlyLimit})`,
                  currentUsage: monthlyUsed,
                  maxLimit: monthlyLimit,
                }),
                { status: 403, headers: { "Content-Type": "application/json" } }
              );
            }

            // 사용량 증가
            await DB.prepare(`
              UPDATE director_limitations
              SET similar_problem_daily_used = similar_problem_daily_used + 1,
                  similar_problem_monthly_used = similar_problem_monthly_used + 1,
                  updated_at = datetime('now')
              WHERE academy_id = ?
            `).bind(student.academyId).run();
            console.log('✅ 유사문제 출제 사용량 증가 완료');
          } else {
            // director_limitations 없으면 user_subscriptions에서 제한값 확인 (fallback)
            const subscription = await DB.prepare(`
              SELECT max_similar_problems, current_similar_problems
              FROM user_subscriptions
              WHERE userId = ? AND status = 'active'
              LIMIT 1
            `).bind(student.id).first();

            if (subscription) {
              const maxProblems = subscription.max_similar_problems as number;
              const currentProblems = subscription.current_similar_problems as number;
              if (maxProblems > 0 && currentProblems >= maxProblems) {
                console.log(`❌ 유사문제 출제 월간 한도 초과 (subscription): ${currentProblems}/${maxProblems}`);
                return new Response(
                  JSON.stringify({
                    success: false,
                    error: "MONTHLY_LIMIT_EXCEEDED",
                    message: `유사문제 출제 월간 한도를 초과했습니다. (${currentProblems}/${maxProblems})`,
                    currentUsage: currentProblems,
                    maxLimit: maxProblems,
                  }),
                  { status: 403, headers: { "Content-Type": "application/json" } }
                );
              }
              // 사용량 증가
              await DB.prepare(`
                UPDATE user_subscriptions
                SET current_similar_problems = current_similar_problems + 1,
                    updatedAt = datetime('now', '+9 hours')
                WHERE userId = ? AND status = 'active'
              `).bind(student.id).run();
              console.log('✅ user_subscriptions 유사문제 출제 사용량 증가');
            }
          }
        }
      } catch (limitError: any) {
        console.warn('⚠️ 제한 확인 실패 (계속 진행):', limitError.message);
      }
    }

    // 2. 문제 유형 및 형식 결정
    const totalProblems = 20; // 항상 20문제 생성
    const hasMultipleChoice = !questionFormats || questionFormats.includes('multiple_choice');
    const hasOpenEnded = !questionFormats || questionFormats.includes('open_ended');
    
    // 객관식 12문제, 서술형 8문제 (또는 형식에 따라 조정)
    const multipleChoiceCount = hasMultipleChoice && hasOpenEnded ? 12 : (hasMultipleChoice ? 20 : 0);
    const openEndedCount = totalProblems - multipleChoiceCount;

    const problemTypesStr = problemTypes && problemTypes.length > 0 
      ? problemTypes.map((t: string) => t === 'concept' ? '개념 이해' : t === 'pattern' ? '유형 문제' : '심화 응용').join(', ')
      : '개념 이해, 유형 문제, 심화 응용';

    const gradeInfo = studentGrade ? `${studentGrade}` : '중학교';
    const subjectInfo = subject || '수학';

    // 3. Gemini 2.5 Flash Lite 프롬프트 생성
    const prompt = `당신은 ${gradeInfo} ${subjectInfo} 전문 교사입니다. 아래 학생의 부족한 개념을 완벽히 채워줄 수 있는 맞춤형 문제지를 생성해주세요.

학생 정보:
- 이름: ${studentName || '학생'}
- 학년: ${gradeInfo}
- 과목: ${subjectInfo}
- 부족한 개념: ${concepts.join(', ')}
- 문제 유형: ${problemTypesStr}

요구사항:
1. 총 ${totalProblems}문제를 생성하세요
   - 객관식 (5지선다): ${multipleChoiceCount}문제
   - 서술형/단답형: ${openEndedCount}문제
2. 각 개념당 균등하게 문제를 배분하세요
3. 난이도는 기초(30%) → 보통(50%) → 심화(20%) 비율로 구성하세요
4. 모든 문제는 학생의 부족한 개념을 직접 다루어야 합니다
5. 실제 시험에 출제될 수 있는 수준의 문제를 만드세요

다음 JSON 형식으로 정확히 응답해주세요 (다른 텍스트 없이 JSON만):
{
  "problems": [
    {
      "number": 1,
      "type": "concept",
      "concept": "해당 개념명",
      "difficulty": "basic",
      "question": "문제 내용 (수식은 명확하게 표현)",
      "options": ["① 보기1", "② 보기2", "③ 보기3", "④ 보기4", "⑤ 보기5"],
      "answer": "③",
      "explanation": "풀이 과정 및 정답 설명 (단계별로 상세히)",
      "answerSpace": false
    },
    {
      "number": 2,
      "type": "pattern",
      "concept": "해당 개념명",
      "difficulty": "medium",
      "question": "서술형 문제 내용",
      "options": [],
      "answer": "정답 내용",
      "explanation": "풀이 과정 및 정답 설명",
      "answerSpace": true
    }
  ]
}

규칙:
- type: "concept"(개념), "pattern"(유형), "advanced"(심화) 중 하나
- difficulty: "basic"(기초), "medium"(보통), "advanced"(심화) 중 하나
- 객관식은 options 배열에 5개 보기 포함, answerSpace: false
- 서술형은 options: [], answerSpace: true
- answer는 객관식의 경우 "①"~"⑤" 형식, 서술형은 완전한 답안
- explanation은 단계별 풀이 과정을 상세히 작성
- 모든 내용은 한국어로 작성
- 정확히 ${totalProblems}개의 문제를 생성할 것`;

    // 4. Gemini 2.5 Flash Lite API 호출
    if (!apiKey) {
      console.warn('⚠️ Gemini API 키 없음, 기본 문제 생성');
      return generateFallbackProblems(concepts, studentName, totalProblems);
    }

    // Gemini 2.5 Flash Lite 모델 사용
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent?key=${apiKey}`;
    
    console.log('🔄 Gemini 2.5 Flash Lite API 호출 중...');
    
    const geminiResponse = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.warn(`⚠️ Gemini 2.5 Flash Lite 실패: ${geminiResponse.status}`, errorText);
      
      // Fallback: gemini-2.5-flash 시도
      console.log('🔄 Fallback: Gemini 2.5 Flash 시도...');
      const fallbackEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const fallbackResponse = await fetch(fallbackEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
        }),
      });
      
      if (!fallbackResponse.ok) {
        console.warn('⚠️ Fallback도 실패, 기본 문제 생성');
        return generateFallbackProblems(concepts, studentName, totalProblems);
      }
      
      const fallbackData = await fallbackResponse.json();
      const fallbackText = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return parseAndReturnProblems(fallbackText, concepts, studentName, totalProblems);
    }

    const geminiData = await geminiResponse.json();
    const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    console.log('✅ Gemini 2.5 Flash Lite 응답 수신');
    return parseAndReturnProblems(generatedText, concepts, studentName, totalProblems);

  } catch (error: any) {
    console.error("❌ 유사문제 생성 오류:", error);
    
    const body = await context.request.json().catch(() => ({})) as any;
    return generateFallbackProblems(
      body.concepts || ['개념 학습'],
      body.studentName || '학생',
      20
    );
  }
};

function parseAndReturnProblems(
  responseText: string, 
  concepts: string[], 
  studentName: string,
  totalProblems: number
): Response {
  try {
    let jsonText = responseText.trim();
    
    // 코드 블록 제거
    jsonText = jsonText.replace(/^```(?:json)?\s*/gm, '').replace(/\s*```\s*$/gm, '');
    
    // JSON 추출
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('JSON 객체를 찾을 수 없습니다');
    }
    jsonText = jsonText.substring(firstBrace, lastBrace + 1);
    
    // JSON 파싱
    let parsedData;
    try {
      parsedData = JSON.parse(jsonText);
    } catch (e1) {
      // 제어문자 제거 후 재시도
      const cleaned = jsonText
        .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/\r/g, '')
        .replace(/\t/g, ' ')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/\s+/g, ' ')
        .trim();
      parsedData = JSON.parse(cleaned);
    }
    
    const problems = parsedData.problems || [];
    
    if (problems.length === 0) {
      throw new Error('문제가 생성되지 않았습니다');
    }
    
    console.log(`✅ ${problems.length}개 문제 파싱 완료`);
    
    return new Response(
      JSON.stringify({
        success: true,
        problems: problems,
        totalCount: problems.length,
        concepts: concepts,
        studentName: studentName,
        generatedAt: new Date().toISOString(),
        method: 'gemini-2.5-flash-lite',
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (parseError: any) {
    console.error('❌ 파싱 실패:', parseError.message);
    return generateFallbackProblems(concepts, studentName, totalProblems);
  }
}

function generateFallbackProblems(
  concepts: string[], 
  studentName: string,
  totalProblems: number
): Response {
  console.log('🔄 기본 문제 생성 중...');
  
  const problems: any[] = [];
  const conceptsToUse = concepts.length > 0 ? concepts : ['기본 개념'];
  
  for (let i = 0; i < totalProblems; i++) {
    const conceptIdx = i % conceptsToUse.length;
    const concept = conceptsToUse[conceptIdx];
    const isMultipleChoice = i < 12; // 처음 12개는 객관식
    const difficulty = i < 6 ? 'basic' : i < 14 ? 'medium' : 'advanced';
    const type = i < 7 ? 'concept' : i < 14 ? 'pattern' : 'advanced';
    
    if (isMultipleChoice) {
      problems.push({
        number: i + 1,
        type: type,
        concept: concept,
        difficulty: difficulty,
        question: `[${concept}] 다음 중 ${concept}에 대한 설명으로 옳은 것은?`,
        options: [
          `① ${concept}의 기본 정의에 해당하는 내용`,
          `② ${concept}와 관련된 오개념 1`,
          `③ ${concept}와 관련된 오개념 2`,
          `④ ${concept}와 관련된 오개념 3`,
          `⑤ ${concept}와 관련된 오개념 4`,
        ],
        answer: '①',
        explanation: `${concept}의 기본 정의를 이해하고 있는지 확인하는 문제입니다. 정답은 ①번으로, ${concept}의 핵심 내용을 설명합니다.`,
        answerSpace: false,
      });
    } else {
      problems.push({
        number: i + 1,
        type: type,
        concept: concept,
        difficulty: difficulty,
        question: `[${concept}] ${concept}의 개념을 설명하고, 관련된 예시를 들어 서술하시오.`,
        options: [],
        answer: `${concept}는 ... (핵심 내용을 서술). 예시: ...`,
        explanation: `${concept}에 대한 이해를 서술형으로 확인하는 문제입니다. 개념의 정의, 특징, 예시를 포함하여 답안을 작성합니다.`,
        answerSpace: true,
      });
    }
  }
  
  return new Response(
    JSON.stringify({
      success: true,
      problems: problems,
      totalCount: problems.length,
      concepts: concepts,
      studentName: studentName,
      generatedAt: new Date().toISOString(),
      method: 'fallback',
      note: 'AI API 연결 실패로 기본 문제가 생성되었습니다. API 키를 확인해주세요.',
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
// Created: Gemini 2.5 Flash Lite - 20 Problems + Answer Sheet Generator
