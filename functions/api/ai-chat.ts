// API: AI 챗봇 대화 (Worker RAG 적용)
// POST /api/ai-chat

interface Env {
  GOOGLE_GEMINI_API_KEY: string;
  DB: D1Database;
}

interface ChatRequest {
  message: string;
  botId: string;
  conversationHistory: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  userId?: string;
  sessionId?: string;
  imageUrl?: string;
}

// 🔥 Worker를 통한 RAG 호출
async function callWorkerRAG(
  message: string,
  botId: string,
  systemPrompt: string,
  conversationHistory: any[],
  enableRAG: boolean
): Promise<{ response: string; ragEnabled: boolean; ragContextCount: number }> {
  try {
    const WORKER_URL = 'https://physonsuperplacestudy.kohsunwoo12345.workers.dev/chat';
    const WORKER_API_KEY = 'gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u';

    console.log(`🚀 Worker RAG 호출: ${WORKER_URL}`);

    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': WORKER_API_KEY
      },
      body: JSON.stringify({
        message,
        botId,
        enableRAG,
        topK: 5,
        systemPrompt,
        conversationHistory
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Worker 호출 실패:', response.status, errorText);
      throw new Error(`Worker 호출 실패: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Worker RAG 검색 완료: ${data.ragContextCount}개 컨텍스트`);
      return {
        ragEnabled: data.ragEnabled,
        ragContextCount: data.ragContextCount,
        ragContext: data.ragContext || []
      };
    } else {
      throw new Error(data.error || 'Worker 오류');
    }
  } catch (error: any) {
    console.error('❌ Worker RAG 오류:', error.message);
    throw error;
  }
}

// Fallback: Gemini 직접 호출
async function callGeminiDirect(
  message: string,
  systemPrompt: string,
  conversationHistory: any[],
  apiKey: string,
  model: string
): Promise<string> {
  console.log(`🔧 callGeminiDirect 시작`);
  console.log(`📊 모델: ${model}`);
  console.log(`📊 메시지 길이: ${message.length}자`);
  console.log(`📊 시스템 프롬프트 길이: ${systemPrompt.length}자`);
  console.log(`📊 대화 기록: ${conversationHistory.length}개`);
  
  // 🔧 Gemini API 버전 선택
  let apiVersion = 'v1beta';
  if (model === 'gemini-1.0-pro' || model === 'gemini-1.0-pro-latest') {
    apiVersion = 'v1';
  }
  
  console.log(`📊 API 버전: ${apiVersion}`);
  
  // 🌍 CORS 프록시를 통한 Gemini API 호출 (지역 제한 우회)
  const geminiUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent`;
  const url = `https://corsproxy.io/?${encodeURIComponent(geminiUrl + '?key=' + apiKey)}`;
  const headers: any = { 
    "Content-Type": "application/json",
    "Origin": "https://suplacestudy.com"
  };
  
  console.log(`📤 Gemini API 직접 호출 (${apiVersion})`);

  const contents: any[] = [];
  
  // ✅ systemPrompt를 첫 번째 메시지로 강력하게 주입
  if (systemPrompt && systemPrompt.trim().length > 0) {
    contents.push({
      role: "user",
      parts: [{ text: `[SYSTEM INSTRUCTION - CRITICAL]\nYou MUST follow these instructions exactly. This defines your identity and behavior:\n\n${systemPrompt}\n\n[IMPORTANT] You are NOT a "Google large language model" or "AI assistant". You MUST act according to the instructions above. Do NOT mention Google or being a language model. Always stay in character as defined above.` }]
    });
    contents.push({
      role: "model",
      parts: [{ text: "알겠습니다. 제시된 지침을 정확히 따르겠습니다. 저는 위에 명시된 역할과 정체성을 가지고 행동하겠습니다." }]
    });
    console.log(`✅ System Prompt를 강력하게 주입 (${systemPrompt.length}자)`);
  }
  
  // 대화 기록 추가
  conversationHistory.forEach(msg => {
    // 🔥 두 가지 형식 모두 지원: {role, content} 또는 {role, parts: [{text}]}
    let messageText = '';
    if (msg.content) {
      // 형식 1: {role: "user", content: "text"}
      messageText = msg.content;
    } else if (msg.parts && msg.parts.length > 0 && msg.parts[0].text) {
      // 형식 2: {role: "user", parts: [{text: "text"}]}
      messageText = msg.parts[0].text;
    } else {
      console.warn('⚠️ 대화 기록 형식 오류:', msg);
      messageText = ''; // 빈 텍스트로 fallback
    }
    
    contents.push({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: messageText }]
    });
  });

  // 🔥 현재 메시지 추가 전에 System Prompt 재강조 (대화가 없을 때만)
  if (conversationHistory.length === 0 && systemPrompt && systemPrompt.trim().length > 0) {
    // 첫 메시지일 때 System Prompt를 한 번 더 강조
    const roleReminder = systemPrompt.split('\n')[0].substring(0, 200); // 첫 줄만 추출
    contents.push({
      role: "user",
      parts: [{ text: `[REMINDER BEFORE FIRST RESPONSE] ${roleReminder}` }]
    });
    contents.push({
      role: "model",
      parts: [{ text: "네, 제 역할을 명확히 기억하고 있습니다." }]
    });
    console.log(`✅ System Prompt 재강조 추가`);
  }

  // 현재 메시지 추가
  contents.push({
    role: "user",
    parts: [{ text: message }]
  });

  console.log(`📊 총 contents 수: ${contents.length}개`);

  // 🔧 Request Body 구성 (항상 Gemini 형식)
  const requestBody: any = {
    contents: contents,
    generationConfig: {
      temperature: 1.0,
      maxOutputTokens: 8192
    }
  };
  
  console.log(`📤 Request body: ${contents.length}개 contents`);

  console.log(`⏳ API 호출 중...`);

  const response = await fetch(url, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(requestBody),
  });

  console.log(`📡 응답 상태: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Gemini API Error (${response.status}):`, errorText);
    
    // JSON 파싱 시도
    let parsedError;
    try {
      parsedError = JSON.parse(errorText);
      console.error(`❌ 파싱된 에러:`, JSON.stringify(parsedError, null, 2));
    } catch (e) {
      console.error(`❌ 에러 텍스트 (JSON 파싱 실패):`, errorText);
      parsedError = { rawError: errorText };
    }
    
    const errorMessage = parsedError?.error?.message || errorText;
    const error = new Error(`Gemini API ${response.status}: ${errorMessage}`);
    (error as any).status = response.status;
    (error as any).isRetryable = response.status === 503 || response.status === 429;
    throw error;
  }

  const data = await response.json();
  
  // Gemini 응답 형식 (Worker도 동일한 형식 반환)
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "응답을 생성할 수 없습니다.";
  console.log(`✅ Gemini 응답 받음: ${text.length}자`);
  
  return text;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  // 🔍 요청 시작 로깅
  const requestStartTime = Date.now();
  const requestId = `req-${requestStartTime}`;
  console.log(`🚀 [${requestId}] AI Chat 요청 시작`);
  
  try {
    const apiKey = context.env.GOOGLE_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error(`❌ [${requestId}] API 키 없음`);
      return new Response(
        JSON.stringify({
          success: false,
          message: "API 키가 설정되지 않았습니다",
          requestId,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const data: ChatRequest = await context.request.json();
    console.log(`📦 [${requestId}] 요청 데이터:`, {
      messageLength: data.message?.length,
      botId: data.botId,
      historyLength: data.conversationHistory?.length || 0,
      userId: data.userId,
      hasImage: !!data.imageUrl,
    });
    
    if (!data.message || !data.botId) {
      console.error(`❌ [${requestId}] 필수 파라미터 누락:`, {
        hasMessage: !!data.message,
        hasBotId: !!data.botId,
      });
      return new Response(
        JSON.stringify({
          success: false,
          message: "메시지와 봇 ID가 필요합니다",
          requestId,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`🤖 [${requestId}] AI 챗봇 요청 - botId: ${data.botId}, message: ${data.message.substring(0, 50)}...`);

    // 봇 정보 조회
    const db = context.env.DB;
    const bot = await db
      .prepare("SELECT * FROM ai_bots WHERE id = ? AND isActive = 1")
      .bind(data.botId)
      .first() as any;

    if (!bot) {
      console.error(`❌ [${requestId}] 봇을 찾을 수 없음: ${data.botId}`);
      return new Response(
        JSON.stringify({
          success: false,
          message: "봇을 찾을 수 없습니다",
          requestId,
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const modelToUse = bot.model || 'gemini-1.5-flash';
    console.log(`✅ [${requestId}] 봇 발견: ${bot.name}`);
    console.log(`📊 [${requestId}] 모델: ${modelToUse}`);
    console.log(`📚 [${requestId}] 지식베이스: ${bot.knowledgeBase ? '있음' : '없음'}`);

    let aiResponse = '';
    let useWorkerRAG = false;
    let ragContextCount = 0;
    let ragContext: any[] = [];

    // 🔥 Worker RAG + Functions Gemini 조합
    if (bot.knowledgeBase && bot.knowledgeBase.trim().length > 0) {
      try {
        console.log('🚀 Worker RAG 호출');
        
        const WORKER_URL = 'https://physonsuperplacestudy.kohsunwoo12345.workers.dev/chat';
        const WORKER_API_KEY = 'gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u';
        
        const workerResponse = await fetch(WORKER_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': WORKER_API_KEY
          },
          body: JSON.stringify({
            message: data.message,
            botId: data.botId,
            systemPrompt: bot.systemPrompt || '',
            conversationHistory: data.conversationHistory || [],
            enableRAG: true,
            topK: 5
          })
        });

        if (workerResponse.ok) {
          const workerData = await workerResponse.json();
          
          if (workerData.success) {
            useWorkerRAG = workerData.ragEnabled || false;
            ragContextCount = workerData.ragContextCount || 0;
            ragContext = workerData.ragContext || [];
            
            console.log(`✅ Worker RAG 성공: ${ragContextCount}개 컨텍스트`);
          }
        }
      } catch (workerError: any) {
        console.error('⚠️ Worker RAG 실패, 전체 지식베이스 사용:', workerError.message);
      }
    }

    // System Prompt에 RAG 컨텍스트 추가
    let systemPrompt = bot.systemPrompt || '';
    
    if (ragContext && ragContext.length > 0) {
      const contextText = ragContext
        .map((ctx, idx) => `[컨텍스트 ${idx + 1}]\n${ctx.text}`)
        .join('\n\n');
      
      systemPrompt = `${bot.systemPrompt}

=== 📚 검색된 지식 베이스 ===
${contextText}
=== 지식 끝 ===

위 지식을 참고하여 답변하세요.`;
    } else if (bot.knowledgeBase && bot.knowledgeBase.trim().length > 0) {
      systemPrompt += `\n\n--- 지식 베이스 ---\n${bot.knowledgeBase}\n--- 지식 베이스 끝 ---`;
    }

    // 🔥 Gemini API 직접 호출 (CORS 프록시 사용)
    const attemptedModels: string[] = [];
    
    console.log(`🚀 [${requestId}] Gemini API 직접 호출 시작 (모델: ${modelToUse})`);
    
    try {
      aiResponse = await callGeminiDirect(
        data.message,
        systemPrompt,
        data.conversationHistory || [],
        apiKey,
        modelToUse
      );
      
      attemptedModels.push(modelToUse);
      console.log(`✅ [${requestId}] Gemini 응답 성공 (${aiResponse.length}자)`);
      
    } catch (error: any) {
      console.error(`❌ [${requestId}] Gemini 호출 실패:`, error.message);
      
      // Fallback 모델로 재시도
      const fallbackModels = ['gemini-1.5-flash-8b', 'gemini-1.5-pro'];
      let retrySuccess = false;
      
      for (const fallbackModel of fallbackModels) {
        try {
          console.log(`  ↻ Fallback 모델 시도: ${fallbackModel}`);
          aiResponse = await callGeminiDirect(
            data.message,
            systemPrompt,
            data.conversationHistory || [],
            apiKey,
            fallbackModel
          );
          
          attemptedModels.push(fallbackModel);
          console.log(`✅ [${requestId}] Fallback 성공 (${aiResponse.length}자, 모델: ${fallbackModel})`);
          retrySuccess = true;
          break;
        } catch (retryError: any) {
          console.error(`  ❌ ${fallbackModel} 실패:`, retryError.message);
        }
      }
      
      if (!retrySuccess) {
        throw error;  // 모든 재시도 실패 시 원래 오류 throw
      }
    }

    // 봇 사용 통계 업데이트
    await db
      .prepare(`
        UPDATE ai_bots 
        SET conversationCount = conversationCount + 1,
            lastUsedAt = datetime('now')
        WHERE id = ?
      `)
      .bind(data.botId)
      .run();

    const requestDuration = Date.now() - requestStartTime;
    console.log(`✅ [${requestId}] 요청 완료 (${requestDuration}ms)`);
    
    return new Response(
      JSON.stringify({
        success: true,
        response: aiResponse,
        workerRAGUsed: useWorkerRAG,
        ragContextCount: ragContextCount,
        attemptedModels: attemptedModels.length > 0 ? attemptedModels : undefined,
        requestId,
        duration: requestDuration,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    const requestDuration = Date.now() - requestStartTime;
    console.error(`❌ [${requestId}] AI 챗봇 오류 (${requestDuration}ms):`, error);
    console.error(`❌ [${requestId}] 에러 타입:`, error.name);
    console.error(`❌ [${requestId}] 에러 메시지:`, error.message);
    console.error(`❌ [${requestId}] 에러 스택:`, error.stack);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: "오류가 발생했습니다",
        error: error.message,
        errorType: error.name,
        requestId,
        duration: requestDuration,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
