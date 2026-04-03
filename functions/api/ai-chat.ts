// API: AI 챗봇 대화 (재미나이 Remix AI 적용 - 지역 제한 없음)
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

// 🔥 재미나이(Remix AI) 직접 호출 (Gemini 지역 제한 완전 해결)
async function callRemixAI(
  message: string,
  systemPrompt: string,
  conversationHistory: any[],
  apiKey: string,
  model: string
): Promise<string> {
  console.log(`🔧 재미나이 AI 호출 시작`);
  console.log(`📊 모델: ${model}`);
  console.log(`📊 메시지 길이: ${message.length}자`);
  console.log(`📊 시스템 프롬프트 길이: ${systemPrompt.length}자`);
  console.log(`📊 대화 기록: ${conversationHistory.length}개`);
  
  // 🔥 재미나이 API는 OpenAI 호환 형식 사용
  const messages: any[] = [];
  
  // System 프롬프트 추가
  if (systemPrompt && systemPrompt.trim().length > 0) {
    messages.push({
      role: "system",
      content: systemPrompt
    });
    console.log(`✅ System Prompt 추가 (${systemPrompt.length}자)`);
  }
  
  // 대화 기록 추가
  conversationHistory.forEach(msg => {
    let messageText = '';
    if (msg.content) {
      messageText = msg.content;
    } else if (msg.parts && msg.parts.length > 0 && msg.parts[0].text) {
      messageText = msg.parts[0].text;
    }
    
    if (messageText) {
      messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: messageText
      });
    }
  });

  // 현재 메시지 추가
  messages.push({
    role: "user",
    content: message
  });

  console.log(`📊 총 messages 수: ${messages.length}개`);

  // 🔥 재미나이 API 호출 (Google Gemini 모델 사용, 지역 제한 없음!)
  const REMIX_API_URL = 'https://api.remixai.com/v1/chat/completions';
  
  console.log(`📤 재미나이 API 호출 중...`);

  const response = await fetch(REMIX_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: 1.0,
      max_tokens: 8192
    }),
  });

  console.log(`📡 재미나이 응답 상태: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ 재미나이 API 오류:`, errorText);
    throw new Error(`재미나이 API ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  
  const text = data.choices?.[0]?.message?.content || '응답을 생성할 수 없습니다.';
  console.log(`✅ 재미나이 응답 받음: ${text.length}자`);
  
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

    // ✅ 1️⃣ 봇 정보 조회 (DB)
    const bot = await context.env.DB.prepare(
      `SELECT * FROM ai_bots WHERE bot_id = ?`
    ).bind(data.botId).first();

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

    console.log(`✅ [${requestId}] 봇 정보 조회 완료:`, {
      name: bot.name,
      model: bot.ai_model,
      systemPrompt: bot.system_prompt?.substring(0, 100) + '...'
    });

    const systemPrompt = bot.system_prompt || "";
    const modelToUse = bot.ai_model || "gemini-1.5-flash";
    const attemptedModels: string[] = [];
    
    console.log(`🚀 [${requestId}] 재미나이 API 직접 호출 시작 (모델: ${modelToUse})`);
    
    try {
      // 🔥 재미나이 API 직접 호출
      const aiResponse = await callRemixAI(
        data.message,
        systemPrompt,
        data.conversationHistory || [],
        apiKey,
        modelToUse
      );
      
      attemptedModels.push(modelToUse);
      
      console.log(`✅ [${requestId}] AI 응답 생성 완료: ${aiResponse.length}자`);

      // ✅ 2️⃣ 봇 사용 통계 업데이트
      await context.env.DB.prepare(
        `UPDATE ai_bots 
         SET total_messages = total_messages + 1, 
             updated_at = datetime('now') 
         WHERE bot_id = ?`
      ).bind(data.botId).run();

      console.log(`✅ [${requestId}] 봇 사용 통계 업데이트 완료`);

      const duration = Date.now() - requestStartTime;
      console.log(`✅ [${requestId}] 요청 처리 완료 - 소요 시간: ${duration}ms`);

      return new Response(
        JSON.stringify({
          success: true,
          response: aiResponse,
          workerRAGUsed: false,
          ragContextCount: 0,
          attemptedModels,
          requestId,
          duration,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );

    } catch (error: any) {
      console.error(`❌ [${requestId}] 재미나이 API 오류:`, error);
      
      return new Response(
        JSON.stringify({
          success: false,
          message: "오류가 발생했습니다",
          error: error.message,
          errorType: error.constructor.name,
          requestId,
          duration: Date.now() - requestStartTime,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

  } catch (error: any) {
    console.error(`❌ [${requestId}] 요청 처리 중 오류:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: "오류가 발생했습니다",
        error: error.message,
        errorType: error.constructor.name,
        requestId: `req-${Date.now()}`,
        duration: Date.now() - requestStartTime,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
