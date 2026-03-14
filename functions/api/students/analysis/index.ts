interface Env {
  DB: D1Database;
  GEMINI_API_KEY: string;
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
 * POST /api/students/analysis
 * Gemini 2.5 Flash Lite API를 사용하여 학생의 AI 대화 기반 심층 역량 분석
 */
export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const { DB, GEMINI_API_KEY, GOOGLE_GEMINI_API_KEY } = env;

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

    console.log('🧠 Analyzing student competency (Gemini 2.5 Flash Lite) for:', studentId);

    // 1. 학원장 제한 설정 확인 (competency_analysis_enabled)
    try {
      const student = await DB.prepare(`
        SELECT id, academyId FROM users WHERE id = ?
      `).bind(parseInt(studentId)).first();

      if (student && student.academyId) {
        const limitation = await DB.prepare(`
          SELECT competency_analysis_enabled, competency_daily_limit, competency_daily_used,
                 competency_monthly_limit, competency_monthly_used
          FROM director_limitations
          WHERE academy_id = ?
          LIMIT 1
        `).bind(student.academyId).first();

        if (limitation) {
          // 기능 비활성화 확인
          if (limitation.competency_analysis_enabled === 0) {
            console.log('❌ AI 역량 분석 기능이 비활성화됨');
            return new Response(
              JSON.stringify({
                success: false,
                error: "FEATURE_DISABLED",
                message: "AI 역량 분석 기능이 현재 요금제에서 비활성화되어 있습니다.",
              }),
              { status: 403, headers: { "Content-Type": "application/json" } }
            );
          }

          // 일일 한도 확인 (0이면 무제한)
          const dailyLimit = limitation.competency_daily_limit as number;
          const dailyUsed = limitation.competency_daily_used as number;
          if (dailyLimit > 0 && dailyUsed >= dailyLimit) {
            console.log(`❌ AI 역량 분석 일일 한도 초과: ${dailyUsed}/${dailyLimit}`);
            return new Response(
              JSON.stringify({
                success: false,
                error: "DAILY_LIMIT_EXCEEDED",
                message: `AI 역량 분석 일일 한도를 초과했습니다. (${dailyUsed}/${dailyLimit})`,
                currentUsage: dailyUsed,
                maxLimit: dailyLimit,
              }),
              { status: 403, headers: { "Content-Type": "application/json" } }
            );
          }

          // 월간 한도 확인 (0이면 무제한)
          const monthlyLimit = limitation.competency_monthly_limit as number;
          const monthlyUsed = limitation.competency_monthly_used as number;
          if (monthlyLimit > 0 && monthlyUsed >= monthlyLimit) {
            console.log(`❌ AI 역량 분석 월간 한도 초과: ${monthlyUsed}/${monthlyLimit}`);
            return new Response(
              JSON.stringify({
                success: false,
                error: "MONTHLY_LIMIT_EXCEEDED",
                message: `AI 역량 분석 월간 한도를 초과했습니다. (${monthlyUsed}/${monthlyLimit})`,
                currentUsage: monthlyUsed,
                maxLimit: monthlyLimit,
              }),
              { status: 403, headers: { "Content-Type": "application/json" } }
            );
          }

          // 사용량 증가
          await DB.prepare(`
            UPDATE director_limitations
            SET competency_daily_used = competency_daily_used + 1,
                competency_monthly_used = competency_monthly_used + 1,
                updated_at = datetime('now')
            WHERE academy_id = ?
          `).bind(student.academyId).run();
          console.log('✅ 역량 분석 사용량 증가 완료');
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
              console.log(`❌ AI 역량 분석 월간 한도 초과 (subscription): ${currentAI}/${maxAI}`);
              return new Response(
                JSON.stringify({
                  success: false,
                  error: "MONTHLY_LIMIT_EXCEEDED",
                  message: `AI 역량 분석 월간 한도를 초과했습니다. (${currentAI}/${maxAI})`,
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
            console.log('✅ user_subscriptions AI 역량 분석 사용량 증가');
          }
        }
      }
    } catch (limitError: any) {
      console.warn('⚠️ 제한 확인 실패 (계속 진행):', limitError.message);
    }

    // 2. 학생의 채팅 내역 가져오기
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
      console.log(`✅ Found ${chatHistory.length} chat messages for analysis`);
    } catch (dbError: any) {
      console.warn('⚠️ chat_messages table may not exist:', dbError.message);
      chatHistory = [];
    }

    // 3. 채팅 내역이 없는 경우
    if (chatHistory.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          analysis: {
            summary: "분석할 대화 내역이 없습니다.",
            strengths: [],
            weaknesses: [],
            recommendations: ["AI 챗봇과 대화를 시작하여 학습 역량을 분석받으세요."],
            selfDirectedness: null,
            leadershipProfile: null,
            learningStyle: null,
            emotionalPattern: null,
            chatCount: 0,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. AI 분석 사용량 로그 기록
    try {
      const student = await DB.prepare(`
        SELECT id, academyId FROM users WHERE id = ?
      `).bind(parseInt(studentId)).first();

      if (student && student.academyId) {
        const director = await DB.prepare(`
          SELECT id FROM User 
          WHERE academyId = ? AND role = 'DIRECTOR'
          LIMIT 1
        `).bind(student.academyId).first();

        if (director) {
          const logId = `log_ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await DB.prepare(`
            INSERT INTO usage_logs (id, userId, subscriptionId, type, action, createdAt)
            VALUES (?, ?, 1, 'ai_analysis', 'AI 역량 분석 실행', datetime('now'))
          `).bind(logId, director.id).run();
          
          console.log('✅ AI analysis usage logged for director:', director.id);
        }
      }
    } catch (logError: any) {
      console.warn('⚠️ Failed to log AI analysis usage:', logError.message);
    }

    // 5. Gemini API 호출 준비 - 심층 분석 프롬프트
    const conversationText = chatHistory
      .slice(0, 80) // 최근 80개 분석
      .reverse() // 시간순 정렬
      .map(msg => `${msg.role === 'user' ? '학생' : 'AI'}: ${msg.message}`)
      .join('\n\n');

    const prompt = `당신은 교육 심리학 전문가이자 AI 학습 분석가입니다. 아래 학생과 AI 챗봇 간의 대화 내역을 심층 분석하여 학생의 학습 역량, 자기주도성, 리더십 잠재력 등을 종합적으로 평가해주세요.

대화 내역 (총 ${chatHistory.length}건):
${conversationText}

다음 JSON 형식으로 정확히 응답해주세요 (다른 텍스트 없이 JSON만):
{
  "summary": "학생의 전반적인 학습 패턴과 특성에 대한 종합 요약 (3-4문장, 구체적이고 개인화된 내용)",
  "strengths": [
    "구체적인 강점 1 (대화에서 관찰된 근거 포함)",
    "구체적인 강점 2",
    "구체적인 강점 3",
    "구체적인 강점 4",
    "구체적인 강점 5"
  ],
  "weaknesses": [
    "개선이 필요한 역량 1 (구체적인 근거 포함)",
    "개선이 필요한 역량 2",
    "개선이 필요한 역량 3",
    "개선이 필요한 역량 4"
  ],
  "recommendations": [
    "맞춤형 개선 방안 1 (실천 가능한 구체적 방법)",
    "맞춤형 개선 방안 2",
    "맞춤형 개선 방안 3",
    "맞춤형 개선 방안 4"
  ],
  "selfDirectedness": {
    "score": 75,
    "level": "보통",
    "description": "자기주도 학습 능력에 대한 상세 평가 (2-3문장). 학생이 스스로 질문을 생성하는지, 모르는 것을 능동적으로 탐구하는지, 학습 목표를 설정하는지 등을 분석",
    "indicators": ["관찰된 자기주도성 지표 1", "관찰된 자기주도성 지표 2", "관찰된 자기주도성 지표 3"]
  },
  "leadershipProfile": {
    "score": 60,
    "type": "분석형/협력형/주도형/창의형 중 하나",
    "description": "리더십 잠재력과 이끌어가는 모습에 대한 평가 (2-3문장). 문제 해결 방식, 논리적 사고, 타인과의 소통 방식 등을 분석",
    "traits": ["리더십 특성 1", "리더십 특성 2", "리더십 특성 3"]
  },
  "learningStyle": {
    "primary": "시각형/청각형/읽기쓰기형/체험형 중 하나",
    "description": "학습 스타일 분석 (1-2문장)",
    "preferences": ["학습 선호도 1", "학습 선호도 2"]
  },
  "emotionalPattern": {
    "description": "학습 과정에서 나타나는 감정 패턴 분석 (1-2문장). 좌절 시 반응, 성취 시 반응, 어려운 문제 앞에서의 태도 등",
    "positiveAspects": ["긍정적 감정 패턴 1", "긍정적 감정 패턴 2"],
    "areasForGrowth": ["성장 필요 영역 1", "성장 필요 영역 2"]
  }
}

분석 기준:
1. 학생이 질문하는 방식 (수동적 vs 능동적)
2. 개념 이해 깊이 (표면적 이해 vs 심층 이해)
3. 오류에 대한 반응 (포기 vs 재시도)
4. 학습 지속성과 집중도
5. 자기 표현 능력과 논리적 사고
6. 이끌어가는 모습 (주도적 질문, 스스로 정리, 연결 사고)

모든 내용은 한국어로 작성하고, 대화 내역에서 실제로 관찰된 근거를 바탕으로 구체적으로 작성해주세요.`;

    // 6. Gemini 2.5 Flash Lite API 호출
    const apiKey = GOOGLE_GEMINI_API_KEY || GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "GEMINI_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Gemini 2.5 Flash Lite 모델 사용
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent?key=${apiKey}`;

    console.log('🔄 Calling Gemini 2.5 Flash Lite API for deep analysis...');
    
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
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('❌ Gemini 2.5 Flash Lite API error:', errorText);
      
      // Fallback: gemini-2.5-flash 시도
      console.log('🔄 Fallback: Gemini 2.5 Flash 시도...');
      const fallbackEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const fallbackResponse = await fetch(fallbackEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
        }),
      });
      
      if (!fallbackResponse.ok) {
        throw new Error(`Gemini API failed: ${geminiResponse.status}`);
      }
      
      const fallbackData = await fallbackResponse.json();
      const responseText = fallbackData.candidates[0].content.parts[0].text;
      return processGeminiResponse(responseText, chatHistory.length);
    }

    const geminiData = await geminiResponse.json();
    console.log('✅ Gemini 2.5 Flash Lite API response received');

    // 7. Gemini 응답 파싱
    const responseText = geminiData.candidates[0].content.parts[0].text;
    return processGeminiResponse(responseText, chatHistory.length);

  } catch (error: any) {
    console.error("❌ Student analysis error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "학생 역량 분석 중 오류가 발생했습니다",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

function processGeminiResponse(responseText: string, chatCount: number): Response {
  try {
    let jsonText = responseText.trim();
    // 코드 블록 제거
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\s*/, '').replace(/```\s*$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\s*/, '').replace(/```\s*$/, '');
    }
    
    // JSON 추출
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonText = jsonText.substring(firstBrace, lastBrace + 1);
    }
    
    const analysisResult = JSON.parse(jsonText);
    analysisResult.chatCount = chatCount;
    
    console.log('✅ Analysis completed successfully with Gemini 2.5 Flash Lite');
    
    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisResult,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (parseError) {
    console.error('❌ Failed to parse Gemini response:', parseError);
    
    const analysisResult = {
      summary: "AI 분석 중 오류가 발생했습니다. 다시 시도해주세요.",
      strengths: ["분석 데이터 처리 중"],
      weaknesses: ["분석 데이터 처리 중"],
      recommendations: ["잠시 후 다시 시도해주세요."],
      selfDirectedness: null,
      leadershipProfile: null,
      learningStyle: null,
      emotionalPattern: null,
      chatCount: chatCount,
    };
    
    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisResult,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}
// Updated: Gemini 2.5 Flash Lite - Deep Competency Analysis
