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
      console.log(`✅ Worker RAG 완료: ${data.ragContextCount}개 컨텍스트 사용`);
      return {
        response: data.response,
        ragEnabled: data.ragEnabled,
        ragContextCount: data.ragContextCount
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

  // 🔧 systemInstruction 사용 (Gemini 1.5+ 지원)
  const requestBody: any = {
    contents: contents,
    generationConfig: {
      temperature: 1.0,
      maxOutputTokens: 8192
    }
  };
  
  // systemPrompt가 있으면 systemInstruction으로 추가
  if (systemPrompt && systemPrompt.trim().length > 0) {
    requestBody.systemInstruction = {
      parts: [{ text: systemPrompt }]
    };
    console.log(`📊 systemInstruction 추가됨 (${systemPrompt.length}자)`);
  }

  console.log(`📤 Request Body:`, JSON.stringify(requestBody, null, 2).substring(0, 500));
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
    try {
      const errorJson = JSON.parse(errorText);
      console.error(`❌ 파싱된 에러:`, JSON.stringify(errorJson, null, 2));
    } catch (e) {
      console.error(`❌ 에러 텍스트 (JSON 파싱 실패):`, errorText);
    }
    
    throw new Error(`Gemini API 오류: ${response.status}`);
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
        
        aiResponse = workerResult.response;
        useWorkerRAG = workerResult.ragEnabled;
        ragContextCount = workerResult.ragContextCount;
        
        console.log(`✅ Worker RAG 완료: ${ragContextCount}개 컨텍스트 사용`);
      } catch (workerError: any) {
        console.error('⚠️ Worker RAG 실패, Fallback 모드:', workerError.message);
        console.error('⚠️ Worker 에러 스택:', workerError.stack);
      }
    }

    // Fallback: Worker 실패 또는 RAG 미사용 시 직접 호출
    if (!aiResponse) {
      console.log('📚 Gemini 직접 호출 모드');
      console.log(`🎯 사용 모델: ${modelToUse}`);
      
      let systemPrompt = bot.systemPrompt || '';
      if (bot.knowledgeBase && bot.knowledgeBase.trim().length > 0) {
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
