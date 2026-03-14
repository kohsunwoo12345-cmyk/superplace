interface Env {
  GOOGLE_GEMINI_API_KEY: string;
  ALL_AI_API_KEY: string; // DeepSeek 모델용 (레거시)
  Novita_AI_API: string; // Novita AI DeepSeek 모델용
  OPENAI_API_KEY: string; // GPT 모델용
  VECTORIZE: VectorizeIndex;
  DB: D1Database;
  AI: any; // Cloudflare AI 바인딩 (optional)
}

const WORKER_URL = 'https://physonsuperplacestudy.kohsunwoo12345.workers.dev';
const WORKER_API_KEY = 'gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u';

// Cloudflare AI로 쿼리 임베딩 생성 (Worker 경유)
async function generateQueryEmbedding(text: string, AI: any): Promise<number[]> {
  try {
    // AI 바인딩이 있으면 직접 사용
    if (AI) {
      const response = await AI.run('@cf/baai/bge-m3', { text });
      const embedding = response.data?.[0];
      if (embedding && Array.isArray(embedding)) {
        return embedding;
      }
    }

    // AI 바인딩이 없으면 Worker 경유
    const response = await fetch(`${WORKER_URL}/bot/generate-embedding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': WORKER_API_KEY
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error(`Worker 임베딩 API 오류: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || '임베딩 생성 실패');
    }

    return data.embedding;
  } catch (error: any) {
    console.error('❌ 임베딩 오류:', error.message);
    throw new Error(`임베딩 생성 실패: ${error.message}`);
  }
}

// 학생 개인화 컨텍스트 생성
async function buildStudentContext(
  DB: D1Database,
  userId: string,
  botId: string
): Promise<string> {
  let context = '';
  
  try {
    // 1. 학생 정보 조회
    const user = await DB.prepare(`
      SELECT name, email, grade, academyId
      FROM User
      WHERE id = ?
    `).bind(userId).first();
    
    if (user) {
      context += `\n👤 **학생 정보:**\n`;
      context += `- 이름: ${user.name || '알 수 없음'}\n`;
      if (user.grade) {
        context += `- 학년: ${user.grade}\n`;
      }
    }
    
    // 2. 최근 대화 기록 (최근 5개)
    const recentChats = await DB.prepare(`
      SELECT message, response, createdAt
      FROM ai_chat_logs
      WHERE userId = ? AND botId = ?
      ORDER BY createdAt DESC
      LIMIT 5
    `).bind(userId, botId).all();
    
    if (recentChats.results && recentChats.results.length > 0) {
      context += `\n💬 **최근 대화 기록:**\n`;
      recentChats.results.reverse().forEach((chat: any, idx: number) => {
        context += `[${idx + 1}] 학생: ${chat.message}\n`;
        context += `    AI: ${chat.response}\n`;
      });
    }
    
    // 3. 학생의 최근 숙제 (있다면)
    try {
      const homework = await DB.prepare(`
        SELECT title, description, dueDate, status
        FROM homework
        WHERE studentId = ?
        ORDER BY dueDate DESC
        LIMIT 3
      `).bind(userId).all();
      
      if (homework.results && homework.results.length > 0) {
        context += `\n📚 **최근 숙제:**\n`;
        homework.results.forEach((hw: any) => {
          context += `- ${hw.title} (마감: ${hw.dueDate}, 상태: ${hw.status})\n`;
          if (hw.description) {
            context += `  설명: ${hw.description}\n`;
          }
        });
      }
    } catch (hwError) {
      // 숙제 테이블이 없거나 오류 시 무시
      console.log('⚠️ Homework table not available');
    }
    
  } catch (error: any) {
    console.error('⚠️ Failed to build student context:', error.message);
  }
  
  return context;
}

// Vectorize에서 관련 지식 검색 (각 청크당 200자 제한, Worker 경유)
async function searchKnowledge(
  vectorize: VectorizeIndex | undefined,
  queryEmbedding: number[],
  botId: string,
  topK: number = 5
): Promise<string> {
  try {
    let matches: any[] = [];

    // 항상 Worker 경유 (클라이언트 측 필터링 적용됨)
    const response = await fetch(`${WORKER_URL}/bot/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': WORKER_API_KEY
      },
      body: JSON.stringify({
        queryEmbedding,
        botId,
        topK
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        matches = data.matches || [];
      }
    }

    if (matches.length === 0) {
      return '';
    }

    // 검색된 청크들을 컨텍스트로 결합 (각 청크당 200자만!)
    const context = matches
      .map((match: any, idx: number) => {
        const fullText = match.metadata?.text || match.text || '';
        // 각 청크당 최대 200자만 사용
        const shortText = fullText.substring(0, 200);
        const ellipsis = fullText.length > 200 ? '...' : '';
        const score = ((match.score || 0) * 100).toFixed(1);
        return `[참고 ${idx + 1}] (유사도 ${score}%)\n${shortText}${ellipsis}`;
      })
      .join('\n\n');

    return context;
  } catch (error: any) {
    console.error('❌ Vectorize search error:', error);
    return '';
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { GOOGLE_GEMINI_API_KEY, VECTORIZE, DB, AI } = context.env;
    
    if (!GOOGLE_GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Gemini API key not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await context.request.json();
    const {
      message,
      systemPrompt,
      model = "gemini-2.5-flash",
      temperature = 0.7,
      maxTokens = 2000,
      topK = 40,
      topP = 0.95,
      botId = null,
      enableRAG = true, // RAG 활성화 여부
      userId = null, // 🔥 추가: 사용자 ID
      userRole = null, // 🔥 추가: 사용자 역할
      userAcademyId = null, // 🔥 추가: 학원 ID
    } = body;

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 🔒 학생 계정의 경우 봇 접근 권한 체크
    if (userRole === 'STUDENT' && userId && botId && userAcademyId && DB) {
      try {
        console.log(`🔐 학생 계정 (${userId}) - 봇 ${botId} 접근 권한 확인 중...`);
        
        // 1. 학원 구독 확인
        const subscription = await DB.prepare(
          `SELECT * FROM AcademyBotSubscription 
           WHERE academyId = ? AND productId = ? AND isActive = 1 AND subscriptionEnd > datetime('now')`
        ).bind(userAcademyId, botId).first();
        
        if (!subscription) {
          console.warn(`❌ 구독 만료 또는 없음: academyId=${userAcademyId}, botId=${botId}`);
          return new Response(
            JSON.stringify({ 
              error: "Bot access denied", 
              reason: "학원의 AI 봇 구독이 만료되었습니다."
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
        
        // 2. 학생 할당 확인
        const assignment = await DB.prepare(
          `SELECT * FROM ai_bot_assignments 
           WHERE botId = ? AND userId = ? AND status = 'active'`
        ).bind(botId, userId).first() as any;
        
        if (!assignment) {
          console.warn(`❌ 봇 할당 없음: userId=${userId}, botId=${botId}`);
          return new Response(
            JSON.stringify({ 
              error: "Bot access denied", 
              reason: "이 AI 봇이 할당되지 않았습니다."
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
        
        // 3. 개별 할당 기간 확인
        const now = new Date().toISOString();
        if (assignment.endDate && assignment.endDate < now) {
          console.warn(`❌ 개별 할당 기간 만료: userId=${userId}, endDate=${assignment.endDate}`);
          return new Response(
            JSON.stringify({ 
              error: "Bot access denied", 
              reason: "AI 봇 사용 기간이 만료되었습니다."
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }

        // 🆕 4. 일일 사용 한도 확인
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const dailyUsageLimit = assignment.dailyUsageLimit || 15;
        
        // 오늘 사용량 조회
        const usageToday = await DB.prepare(`
          SELECT COALESCE(SUM(messageCount), 0) as totalUsed
          FROM bot_usage_logs
          WHERE assignmentId = ? 
            AND userId = ?
            AND DATE(createdAt) = ?
        `).bind(assignment.id, userId, today).first() as any;
        
        const usedCount = usageToday?.totalUsed || 0;
        
        console.log(`📊 일일 사용량: ${usedCount}/${dailyUsageLimit}`);
        
        if (usedCount >= dailyUsageLimit) {
          console.warn(`❌ 일일 사용 한도 초과: ${usedCount}/${dailyUsageLimit}`);
          return new Response(
            JSON.stringify({ 
              error: "Daily limit exceeded", 
              reason: `오늘의 사용 한도(${dailyUsageLimit}회)를 초과했습니다.`,
              dailyUsageLimit,
              usedToday: usedCount,
              remainingToday: 0
            }),
            { status: 429, headers: { "Content-Type": "application/json" } }
          );
        }
        
        // 5. 학원 전체 할당 인원 체크 (우선순위 기반)
        const allAssignments = await DB.prepare(
          `SELECT userId, startDate FROM ai_bot_assignments 
           WHERE botId = ? AND userAcademyId = ? AND status = 'active'
           ORDER BY startDate ASC`
        ).bind(botId, userAcademyId).all();
        
        const studentRank = allAssignments.results.findIndex((a: any) => a.userId === userId) + 1;
        const totalSlots = subscription.totalStudentSlots || 999;
        
        if (studentRank > totalSlots) {
          console.warn(`❌ 할당 인원 초과: rank=${studentRank}, limit=${totalSlots}`);
          return new Response(
            JSON.stringify({ 
              error: "Bot access denied", 
              reason: `학원의 AI 봇 사용 인원(${totalSlots}명)을 초과했습니다. (현재 순위: ${studentRank})`
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
        
        console.log(`✅ 봇 접근 권한 확인 완료: userId=${userId}, botId=${botId}, rank=${studentRank}/${totalSlots}, usage=${usedCount}/${dailyUsageLimit}`);
      } catch (accessError: any) {
        console.error('⚠️ 봇 접근 권한 체크 실패:', accessError);
        // 권한 체크 실패 시에도 계속 진행 (관리자 계정 등)
      }
    }

    let knowledgeContext = '';
    let studentContext = '';
    let ragEnabled = false;
    let debugLog: string[] = [];

    // 🔥 학생 개인화 컨텍스트 생성
    if (userId && botId && DB) {
      try {
        console.log(`👤 Building personalized context for user ${userId}...`);
        debugLog.push(`👤 Building personalized context for user ${userId}...`);
        studentContext = await buildStudentContext(DB, userId, botId);
        if (studentContext) {
          console.log(`✅ Student context built (${studentContext.length} characters)`);
          debugLog.push(`✅ Student context built (${studentContext.length} characters)`);
        }
      } catch (ctxError: any) {
        console.error('⚠️ Failed to build student context:', ctxError.message);
        debugLog.push(`⚠️ Failed to build student context: ${ctxError.message}`);
      }
    }

    // 🔥 RAG: Vectorize에서 관련 지식 검색
    console.log(`🔍 RAG 조건 체크: enableRAG=${enableRAG}, botId=${botId}, AI=${!!AI}, VECTORIZE=${!!VECTORIZE}`);
    debugLog.push(`🔍 RAG 조건 체크: enableRAG=${enableRAG}, botId=${botId}, AI=${!!AI}, VECTORIZE=${!!VECTORIZE}`);
    
    if (enableRAG && botId) {
      try {
        console.log(`🔍 RAG enabled for bot ${botId}, searching knowledge...`);
        debugLog.push(`🔍 RAG enabled for bot ${botId}, searching knowledge...`);
        
        // 1. 사용자 메시지를 Cloudflare AI 임베딩으로 변환 (Worker 경유)
        const queryEmbedding = await generateQueryEmbedding(message, AI);
        console.log(`  └─ Query embedding generated (${queryEmbedding.length} dimensions)`);
        debugLog.push(`  └─ Query embedding generated (${queryEmbedding.length} dimensions)`);
        
        // 2. Vectorize에서 유사한 지식 검색 (Top-5, 각 200자 제한, Worker 경유)
        knowledgeContext = await searchKnowledge(VECTORIZE, queryEmbedding, botId, 5);
        debugLog.push(`  └─ searchKnowledge returned: ${knowledgeContext.length} characters`);
        
        if (knowledgeContext) {
          ragEnabled = true;
          console.log(`✅ RAG context found (${knowledgeContext.length} characters)`);
          debugLog.push(`✅ RAG context found (${knowledgeContext.length} characters)`);
        } else {
          console.log(`ℹ️ No relevant knowledge found in Vectorize for bot ${botId}`);
          debugLog.push(`ℹ️ No relevant knowledge found in Vectorize for bot ${botId}`);
        }
      } catch (ragError: any) {
        console.error('⚠️ RAG search failed, continuing without RAG:', ragError.message);
        debugLog.push(`⚠️ RAG search failed: ${ragError.message}`);
        // RAG 실패해도 일반 채팅은 계속 진행
      }
    } else {
      console.log(`⚠️ RAG 조건 미충족으로 스킵됨`);
      debugLog.push(`⚠️ RAG 조건 미충족으로 스킵됨`);
    }

    // 🔥 RAG 적용: 지식 컨텍스트를 시스템 프롬프트에 추가
    let enhancedSystemPrompt = systemPrompt || '';
    
    // 학생 개인화 컨텍스트 추가
    if (studentContext) {
      enhancedSystemPrompt = `${systemPrompt}

🎯 **학생 맞춤 정보:**
아래는 현재 대화 중인 학생의 정보입니다. 이를 참고하여 학생에게 맞춤형 답변을 제공하세요.

${studentContext}

---
`;
    }
    
    // 지식 베이스 컨텍스트 추가
    if (knowledgeContext) {
      enhancedSystemPrompt += `
📚 **참고 지식:**
아래는 사용자 질문과 관련된 지식 베이스 내용입니다. 이 정보를 참고하여 답변하세요.

${knowledgeContext}

---

`;
    }
    
    if (studentContext || knowledgeContext) {
      enhancedSystemPrompt += `위 정보들을 바탕으로 학생의 질문에 정확하고 맞춤형으로 답변해주세요.`;
    }

    // API 선택 로직 - 모델에 따라 다른 API 사용
    let apiEndpoint: string;
    let apiKey: string;
    let requestBody: any;
    
    // DeepSeek OCR-2 모델 (Novita AI, Novita_AI_API)
    if (model === 'deepseek-ocr-2') {
      apiEndpoint = 'https://api.novita.ai/v3/openai/chat/completions';
      apiKey = context.env.Novita_AI_API || context.env.ALL_AI_API_KEY;
      
      requestBody = {
        model: 'deepseek/deepseek-ocr-2',
        messages: [
          {
            role: 'system',
            content: enhancedSystemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: temperature,
        max_tokens: maxTokens,
        top_p: topP
      };
    }
    // OpenAI GPT 모델 (OPENAI_API_KEY)
    else if (model.startsWith('gpt-')) {
      apiEndpoint = 'https://api.openai.com/v1/chat/completions';
      apiKey = context.env.OPENAI_API_KEY;
      
      requestBody = {
        model: model,
        messages: [
          {
            role: 'system',
            content: enhancedSystemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: temperature,
        max_tokens: maxTokens,
        top_p: topP
      };
    }
    // Gemini 모델 (GOOGLE_GEMINI_API_KEY)
    else {
      let apiVersion = 'v1beta';
      if (model.includes('1.0') || model.includes('2.0')) {
        apiVersion = 'v1';
      }
      
      apiEndpoint = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${context.env.GOOGLE_GEMINI_API_KEY}`;
      apiKey = context.env.GOOGLE_GEMINI_API_KEY;
      
      requestBody = {
        contents: [
          {
            parts: [
              {
                text: enhancedSystemPrompt
                  ? `${enhancedSystemPrompt}\n\n사용자: ${message}`
                  : message,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: temperature,
          maxOutputTokens: maxTokens,
          topK: topK,
          topP: topP,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      };
    }

    // API 호출
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    // OpenAI와 DeepSeek는 Authorization 헤더 필요
    if (model.startsWith('gpt-') || model === 'deepseek-ocr-2') {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const apiResponse = await fetch(apiEndpoint, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody),
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.text();
      console.error(`${model} API Error:`, errorData);
      
      return new Response(
        JSON.stringify({
          error: `${model} API request failed`,
          details: errorData,
        }),
        {
          status: apiResponse.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const apiData = await apiResponse.json();

    // API별 응답 파싱
    let responseText: string;
    let promptTokens = 0;
    let completionTokens = 0;
    let totalTokens = 0;
    
    if (model.startsWith('gpt-') || model === 'deepseek-ocr-2') {
      // OpenAI/DeepSeek 형식
      responseText = apiData.choices?.[0]?.message?.content || "응답을 생성할 수 없습니다.";
      promptTokens = apiData.usage?.prompt_tokens || 0;
      completionTokens = apiData.usage?.completion_tokens || 0;
      totalTokens = apiData.usage?.total_tokens || 0;
    } else {
      // Gemini 형식
      responseText = apiData.candidates?.[0]?.content?.parts?.[0]?.text || "응답을 생성할 수 없습니다.";
      promptTokens = apiData.usageMetadata?.promptTokenCount || 0;
      completionTokens = apiData.usageMetadata?.candidatesTokenCount || 0;
      totalTokens = apiData.usageMetadata?.totalTokenCount || 0;
    }

    // 🆕 사용량 기록 (학생 계정이고 DB, userId, botId가 있을 때)
    if (userRole === 'STUDENT' && userId && botId && DB) {
      try {
        // 할당 정보 조회
        const assignment = await DB.prepare(
          `SELECT id FROM ai_bot_assignments 
           WHERE botId = ? AND userId = ? AND status = 'active'`
        ).bind(botId, userId).first() as any;
        
        if (assignment) {
          const today = new Date().toISOString().split('T')[0];
          const usageLogId = `usage-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
          
          await DB.prepare(`
            INSERT INTO bot_usage_logs (id, assignmentId, botId, userId, userType, messageCount, usageDate)
            VALUES (?, ?, ?, ?, 'student', 1, ?)
          `).bind(usageLogId, assignment.id, botId, userId, today).run();
          
          console.log(`✅ 사용량 기록 완료: ${usageLogId}`);
        }
      } catch (logError: any) {
        console.error('⚠️ 사용량 기록 실패:', logError.message);
        // 사용량 기록 실패해도 응답은 계속 전송
      }
    }

    return new Response(
      JSON.stringify({
        response: responseText,
        model: model,
        ragEnabled,
        knowledgeUsed: ragEnabled,
        debugLog: debugLog,
        usage: {
          promptTokens: promptTokens,
          completionTokens: completionTokens,
          totalTokens: totalTokens,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
