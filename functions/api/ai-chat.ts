// API: AI 챗봇 대화 (Gemini API 직접 호출 + 지역 제한 시 Worker 프록시 fallback)
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

const WORKER_URL = 'https://physonsuperplacestudy.kohsunwoo12345.workers.dev';
const WORKER_API_KEY = 'gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u';

// Worker 프록시를 통한 Gemini API 호출 (지역 제한 우회)
async function callGeminiViaWorker(
  message: string,
  systemPrompt: string,
  conversationHistory: any[],
  geminiApiKey: string,
  model: string
): Promise<string> {
  console.log(`🔄 Worker 프록시를 통한 Gemini 호출 (모델: ${model})`);

  const response = await fetch(`${WORKER_URL}/gemini-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': WORKER_API_KEY,
    },
    body: JSON.stringify({
      message,
      systemPrompt,
      conversationHistory,
      model,
      geminiApiKey, // Pages Function의 유효한 API 키를 Worker에 전달
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Worker 프록시 오류 (${response.status}):`, errorText.substring(0, 200));
    throw new Error(`Worker 프록시 오류: ${response.status} - ${errorText.substring(0, 100)}`);
  }

  const data: any = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Worker 프록시에서 응답을 생성할 수 없습니다.');
  }

  console.log(`✅ Worker 프록시 응답 받음: ${data.response?.length}자`);
  return data.response;
}

// Gemini API 직접 호출 (Cloudflare Workers는 서버사이드이므로 직접 호출 가능)
async function callGeminiDirect(
  message: string,
  systemPrompt: string,
  conversationHistory: any[],
  apiKey: string,
  model: string
): Promise<string> {
  console.log(`🚀 Gemini API 직접 호출 (모델: ${model})`);

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

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(geminiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 1.0,
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Gemini API 오류 (${response.status}):`, errorText.substring(0, 300));
    
    // 지역 제한 오류인지 확인
    if (response.status === 400 && errorText.includes('User location is not supported')) {
      throw new Error(`LOCATION_RESTRICTED:${errorText.substring(0, 100)}`);
    }
    
    throw new Error(`Gemini API 오류: ${response.status} - ${errorText.substring(0, 100)}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    console.error('❌ Gemini 응답에 텍스트 없음:', JSON.stringify(data).substring(0, 200));
    throw new Error('AI 응답을 생성할 수 없습니다.');
  }

  console.log(`✅ Gemini 응답 받음: ${text.length}자`);
  return text;
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
      `SELECT * FROM ai_bots WHERE id = ?`
    ).bind(data.botId).first() as any;

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

    const systemPrompt = (bot.systemPrompt as string) || "";
    const modelToUse = (bot.model as string) || "gemini-1.5-flash";

    let aiResponse: string;
    let usedWorkerProxy = false;

    // 1단계: Gemini 직접 호출 시도
    try {
      console.log(`🚀 [${requestId}] Gemini 직접 호출 시도 (모델: ${modelToUse})`);
      aiResponse = await callGeminiDirect(
        data.message,
        systemPrompt,
        data.conversationHistory || [],
        apiKey,
        modelToUse
      );
      console.log(`✅ [${requestId}] 직접 호출 성공`);
    } catch (directError: any) {
      console.warn(`⚠️ [${requestId}] 직접 호출 실패: ${directError.message}`);
      
      // 지역 제한 오류이거나 기타 오류 -> Worker 프록시로 fallback
      if (directError.message.startsWith('LOCATION_RESTRICTED:') || directError.message.includes('400')) {
        console.log(`🔄 [${requestId}] Worker 프록시로 fallback`);
        try {
          aiResponse = await callGeminiViaWorker(
            data.message,
            systemPrompt,
            data.conversationHistory || [],
            apiKey,
            modelToUse
          );
          usedWorkerProxy = true;
          console.log(`✅ [${requestId}] Worker 프록시 호출 성공`);
        } catch (workerError: any) {
          console.error(`❌ [${requestId}] Worker 프록시도 실패: ${workerError.message}`);
          return new Response(
            JSON.stringify({
              success: false,
              message: "서버 내부 오류가 발생했습니다.",
              error: workerError.message,
              requestId,
              duration: Date.now() - requestStartTime,
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      } else {
        return new Response(
          JSON.stringify({
            success: false,
            message: "서버 내부 오류가 발생했습니다.",
            error: directError.message,
            requestId,
            duration: Date.now() - requestStartTime,
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    console.log(`✅ [${requestId}] AI 응답 생성 완료 (workerProxy: ${usedWorkerProxy})`);

    // 봇 사용 통계 업데이트 (실패해도 응답은 계속)
    try {
      await context.env.DB.prepare(
        `UPDATE ai_bots 
         SET usageCount = COALESCE(usageCount, 0) + 1, 
             updatedAt = datetime('now') 
         WHERE id = ?`
      ).bind(data.botId).run();
    } catch (statsErr: any) {
      console.warn('⚠️ 봇 사용 통계 업데이트 실패 (무시):', statsErr.message);
    }

    const duration = Date.now() - requestStartTime;

    return new Response(
      JSON.stringify({
        success: true,
        response: aiResponse,
        workerRAGUsed: usedWorkerProxy,
        ragContextCount: 0,
        requestId,
        duration,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error(`❌ 요청 처리 중 오류:`, error.message);

    return new Response(
      JSON.stringify({
        success: false,
        message: "서버 내부 오류가 발생했습니다.",
        error: error.message,
        requestId: `req-${Date.now()}`,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
