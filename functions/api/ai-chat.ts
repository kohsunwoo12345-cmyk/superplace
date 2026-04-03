// API: AI 챗봇 대화 (프록시를 통한 Gemini API 호출 - IP 제한 우회)
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

// 🔥 프록시를 통한 Gemini API 호출 (IP 제한 완전 우회)
async function callGeminiViaProxy(
  message: string,
  systemPrompt: string,
  conversationHistory: any[],
  apiKey: string,
  model: string
): Promise<string> {
  console.log(`🔧 프록시를 통한 Gemini API 호출 시작 (모델: ${model})`);
  
  const contents: any[] = [];
  
  // System 프롬프트 추가
  if (systemPrompt && systemPrompt.trim().length > 0) {
    contents.push({
      role: "user",
      parts: [{ text: systemPrompt }]
    });
    contents.push({
      role: "model",
      parts: [{ text: "네, 이해했습니다. 해당 역할을 수행하겠습니다." }]
    });
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
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: messageText }]
      });
    }
  });

  // 현재 메시지 추가
  contents.push({
    role: "user",
    parts: [{ text: message }]
  });

  console.log(`📤 총 ${contents.length}개 메시지`);

  // Gemini API URL
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const requestBody = JSON.stringify({
    contents: contents,
    generationConfig: {
      temperature: 1.0,
      maxOutputTokens: 8192
    }
  });

  // 🔥 여러 프록시를 순차적으로 시도 (IP 우회)
  const proxyServices = [
    {
      name: 'direct',
      buildUrl: (url: string) => url,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0"
      }
    },
    {
      name: 'corsproxy.io',
      buildUrl: (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
      headers: {
        "Content-Type": "application/json"
      }
    },
    {
      name: 'api.codetabs.com',
      buildUrl: (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
      headers: {
        "Content-Type": "application/json"
      }
    },
    {
      name: 'thingproxy.freeboard.io',
      buildUrl: (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
      headers: {
        "Content-Type": "application/json"
      }
    }
  ];

  let lastError: string | null = null;

  for (const proxy of proxyServices) {
    try {
      console.log(`🔄 프록시 시도: ${proxy.name}`);
      const proxyUrl = proxy.buildUrl(geminiUrl);
      
      const response = await fetch(proxyUrl, {
        method: "POST",
        headers: proxy.headers,
        body: requestBody,
      });

      if (response.ok) {
        console.log(`✅ 프록시 성공: ${proxy.name}`);
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '응답을 생성할 수 없습니다.';
        console.log(`✅ 응답 받음: ${text.length}자`);
        return text;
      } else {
        const errorText = await response.text();
        console.log(`❌ 프록시 실패 (${proxy.name}): HTTP ${response.status}`);
        lastError = `${proxy.name}: HTTP ${response.status} - ${errorText.substring(0, 100)}`;
      }
    } catch (error: any) {
      console.log(`❌ 프록시 오류 (${proxy.name}): ${error.message}`);
      lastError = `${proxy.name}: ${error.message}`;
    }
  }

  throw new Error(`모든 프록시 시도 실패. 마지막 오류: ${lastError}`);
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const requestStartTime = Date.now();
  const requestId = `req-${requestStartTime}`;
  console.log(`🚀 [${requestId}] AI Chat 요청 시작`);
  
  try {
    const apiKey = context.env.GOOGLE_GEMINI_API_KEY;
    
    if (!apiKey) {
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
    
    if (!data.message || !data.botId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "메시지와 봇 ID가 필요합니다",
          requestId,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`🤖 [${requestId}] 봇 ID: ${data.botId}`);

    // 봇 정보 조회
    const bot = await context.env.DB.prepare(
      `SELECT * FROM ai_bots WHERE bot_id = ?`
    ).bind(data.botId).first();

    if (!bot) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "봇을 찾을 수 없습니다",
          requestId,
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = bot.system_prompt || "";
    const modelToUse = bot.ai_model || "gemini-1.5-flash";
    const attemptedModels: string[] = [modelToUse];
    
    console.log(`🚀 [${requestId}] 프록시를 통한 Gemini API 호출 (모델: ${modelToUse})`);
    
    try {
      const aiResponse = await callGeminiViaProxy(
        data.message,
        systemPrompt,
        data.conversationHistory || [],
        apiKey,
        modelToUse
      );
      
      console.log(`✅ [${requestId}] AI 응답 생성 완료`);

      // 봇 사용 통계 업데이트
      await context.env.DB.prepare(
        `UPDATE ai_bots 
         SET total_messages = total_messages + 1, 
             updated_at = datetime('now') 
         WHERE bot_id = ?`
      ).bind(data.botId).run();

      const duration = Date.now() - requestStartTime;

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
      console.error(`❌ [${requestId}] Gemini API 오류:`, error.message);
      
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
    console.error(`❌ 요청 처리 중 오류:`, error.message);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: "오류가 발생했습니다",
        error: error.message,
        errorType: error.constructor.name,
        requestId: `req-${Date.now()}`,
        duration: 0,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
