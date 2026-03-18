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
  
  const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`;
  console.log(`📤 URL: ${url.replace(/key=.+/, 'key=[HIDDEN]')}`);

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
    contents.push({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    });
  });

  // 현재 메시지 추가
  contents.push({
    role: "user",
    parts: [{ text: message }]
  });

  console.log(`📊 총 contents 수: ${contents.length}개`);

  // 🔧 Request Body 구성
  const requestBody: any = {
    contents: contents,
    generationConfig: {
      temperature: 1.0,
      maxOutputTokens: 8192
    }
  };

  console.log(`📤 Request Body Keys:`, Object.keys(requestBody));
  console.log(`📤 Contents 수: ${contents.length}개`);
  console.log(`⏳ Gemini API 호출 중...`);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
    
    // 상세한 에러 정보를 포함하여 throw
    const errorMessage = parsedError?.error?.message || errorText;
    throw new Error(`Gemini API ${response.status}: ${errorMessage}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "응답을 생성할 수 없습니다.";
  
  console.log(`✅ Gemini 응답 받음: ${text.length}자`);
  
  return text;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const apiKey = context.env.GOOGLE_GEMINI_API_KEY;
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "API 키가 설정되지 않았습니다",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const data: ChatRequest = await context.request.json();
    
    if (!data.message || !data.botId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "메시지와 봇 ID가 필요합니다",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`🤖 AI 챗봇 요청 - botId: ${data.botId}, message: ${data.message.substring(0, 50)}...`);

    // 봇 정보 조회
    const db = context.env.DB;
    const bot = await db
      .prepare("SELECT * FROM ai_bots WHERE id = ? AND isActive = 1")
      .bind(data.botId)
      .first() as any;

    if (!bot) {
      console.error(`❌ 봇을 찾을 수 없음: ${data.botId}`);
      return new Response(
        JSON.stringify({
          success: false,
          message: "봇을 찾을 수 없습니다",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const modelToUse = bot.model || 'gemini-2.0-flash-exp';
    console.log(`✅ 봇 발견: ${bot.name}`);
    console.log(`📊 모델: ${modelToUse}`);
    console.log(`📚 지식베이스: ${bot.knowledgeBase ? '있음' : '없음'}`);

    let aiResponse = '';
    let useWorkerRAG = false;
    let ragContextCount = 0;

    // 🔥 Worker RAG 모드 (knowledgeBase가 있을 때)
    let ragContext: any[] = [];
    if (bot.knowledgeBase && bot.knowledgeBase.trim().length > 0) {
      try {
        console.log('🚀 Worker RAG 모드 활성화');
        
        const workerResult = await callWorkerRAG(
          data.message,
          data.botId,
          bot.systemPrompt || '',
          data.conversationHistory || [],
          true
        );
        
        useWorkerRAG = workerResult.ragEnabled;
        ragContextCount = workerResult.ragContextCount;
        ragContext = workerResult.ragContext || [];
        
        console.log(`✅ Worker RAG 검색 완료: ${ragContextCount}개 컨텍스트`);
      } catch (workerError: any) {
        console.error('⚠️ Worker RAG 실패, Fallback 모드:', workerError.message);
        console.error('⚠️ Worker 에러 스택:', workerError.stack);
      }
    }

    // Gemini 호출 (RAG 컨텍스트 포함)
    console.log('📚 Gemini 호출 준비');
    console.log(`🎯 사용 모델: ${modelToUse}`);
    
    let systemPrompt = bot.systemPrompt || '';
    
    // RAG 컨텍스트를 시스템 프롬프트에 추가
    if (ragContext && ragContext.length > 0) {
      console.log(`✅ RAG 컨텍스트 ${ragContext.length}개를 시스템 프롬프트에 추가`);
      const contextText = ragContext
        .map((ctx, idx) => `[컨텍스트 ${idx + 1}]\n${ctx.text}`)
        .join('\n\n');
      
      // ⭐ System Prompt를 더 강력하게 - 역할을 먼저, 지식을 나중에
      systemPrompt = `${bot.systemPrompt}

=== 📚 검색된 지식 베이스 (참고용) ===
${contextText}
=== 지식 끝 ===

[CRITICAL INSTRUCTION] 
위 지식 베이스를 참고하되, 당신은 반드시 처음에 명시된 역할과 정체성을 유지해야 합니다.
첫 인사나 자기소개를 요청받으면 반드시 자신이 누구인지(${bot.name})를 밝혀야 합니다.
절대로 "Google 언어 모델" 등의 일반적인 AI 소개를 하지 마세요.`;
    } else if (bot.knowledgeBase && bot.knowledgeBase.trim().length > 0) {
      // Fallback: knowledgeBase 전체 사용
      console.log('⚠️ RAG 컨텍스트 없음, 전체 knowledgeBase 사용');
      systemPrompt += `\n\n--- 지식 베이스 ---\n${bot.knowledgeBase}\n--- 지식 베이스 끝 ---\n\n위 지식을 참고하여 답변하세요.`;
    }

    try {
      aiResponse = await callGeminiDirect(
        data.message,
        systemPrompt,
        data.conversationHistory || [],
        apiKey,
        modelToUse
      );
      console.log(`✅ Gemini 응답 성공 (${aiResponse.length} 글자)`);
    } catch (geminiError: any) {
      console.error(`❌ Gemini 직접 호출 실패:`, geminiError.message);
      console.error(`❌ 에러 스택:`, geminiError.stack);
      throw geminiError;
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

    return new Response(
      JSON.stringify({
        success: true,
        response: aiResponse,
        workerRAGUsed: useWorkerRAG,
        ragContextCount: ragContextCount
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ AI 챗봇 오류:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "오류가 발생했습니다",
        error: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
