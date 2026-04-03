// API: AI 챗봇 대화 (Gemini 직접 호출 → Worker 프록시 → OpenAI fallback)
// POST /api/ai-chat

interface Env {
  GOOGLE_GEMINI_API_KEY: string;
  OPENAI_API_KEY: string;
  Novita_AI_API: string;
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

// Gemini 모델명을 OpenAI 호환 모델명으로 변환
function getOpenAIModelFallback(geminiModel: string): string {
  // Gemini 2.5 계열 → GPT-4o-mini (가장 안정적)
  if (geminiModel.includes('2.5') || geminiModel.includes('2-5')) {
    return 'gpt-4o-mini';
  }
  // Gemini 1.5 Pro → GPT-4o-mini
  if (geminiModel.includes('1.5-pro') || geminiModel.includes('pro')) {
    return 'gpt-4o-mini';
  }
  // 기본값
  return 'gpt-4o-mini';
}

// OpenAI API 호출 (최종 fallback)
async function callOpenAI(
  message: string,
  systemPrompt: string,
  conversationHistory: any[],
  apiKey: string,
  geminiModel: string
): Promise<string> {
  const openAIModel = getOpenAIModelFallback(geminiModel);
  console.log(`🔵 OpenAI fallback 호출 (모델: ${openAIModel})`);

  const messages: any[] = [];

  // 시스템 프롬프트
  if (systemPrompt && systemPrompt.trim().length > 0) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  // 대화 기록
  conversationHistory.forEach(msg => {
    const content = msg.content || (msg.parts && msg.parts[0] && msg.parts[0].text) || '';
    if (content) {
      messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content,
      });
    }
  });

  // 현재 메시지
  messages.push({ role: 'user', content: message });

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: openAIModel,
      messages,
      max_tokens: 4096,
      temperature: 0.9,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ OpenAI API 오류 (${response.status}):`, errorText.substring(0, 200));
    throw new Error(`OpenAI API 오류: ${response.status} - ${errorText.substring(0, 100)}`);
  }

  const data: any = await response.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('OpenAI 응답에 텍스트가 없습니다.');
  }

  console.log(`✅ OpenAI 응답 받음: ${text.length}자`);
  return text;
}

// Novita AI (DeepSeek) fallback
async function callNovitaAI(
  message: string,
  systemPrompt: string,
  conversationHistory: any[],
  apiKey: string
): Promise<string> {
  console.log(`🟣 Novita AI fallback 호출`);

  const messages: any[] = [];

  if (systemPrompt && systemPrompt.trim().length > 0) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  conversationHistory.forEach(msg => {
    const content = msg.content || (msg.parts && msg.parts[0] && msg.parts[0].text) || '';
    if (content) {
      messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content,
      });
    }
  });

  messages.push({ role: 'user', content: message });

  const response = await fetch('https://api.novita.ai/v3/openai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek/deepseek-chat-v3-0324',
      messages,
      max_tokens: 4096,
      temperature: 0.9,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Novita AI 오류 (${response.status}):`, errorText.substring(0, 200));
    throw new Error(`Novita AI 오류: ${response.status} - ${errorText.substring(0, 100)}`);
  }

  const data: any = await response.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('Novita AI 응답에 텍스트가 없습니다.');
  }

  console.log(`✅ Novita AI 응답 받음: ${text.length}자`);
  return text;
}

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
      geminiApiKey,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Worker 프록시 오류 (${response.status}):`, errorText.substring(0, 200));
    throw new Error(`Worker 프록시 오류: ${response.status} - ${errorText.substring(0, 200)}`);
  }

  const data: any = await response.json();

  if (!data.success) {
    const errMsg = data.error || 'Worker 프록시에서 응답을 생성할 수 없습니다.';
    // Gemini 지역 제한 오류이면 LOCATION_RESTRICTED로 감싸서 상위에서 fallback 처리
    if (errMsg.includes('User location is not supported') || errMsg.includes('400')) {
      throw new Error(`WORKER_LOCATION_RESTRICTED:${errMsg}`);
    }
    throw new Error(errMsg);
  }

  console.log(`✅ Worker 프록시 응답 받음: ${data.response?.length}자`);
  return data.response;
}

// Gemini API 직접 호출
async function callGeminiDirect(
  message: string,
  systemPrompt: string,
  conversationHistory: any[],
  apiKey: string,
  model: string
): Promise<string> {
  console.log(`🚀 Gemini API 직접 호출 (모델: ${model})`);

  const contents: any[] = [];

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

  contents.push({
    role: "user",
    parts: [{ text: message }]
  });

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
    const geminiApiKey = context.env.GOOGLE_GEMINI_API_KEY;
    const openAIApiKey = context.env.OPENAI_API_KEY;
    const novitaApiKey = context.env.Novita_AI_API;

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

    let aiResponse: string = '';
    let usedProvider = 'gemini-direct';

    // ===== 1단계: Gemini 직접 호출 =====
    if (geminiApiKey) {
      try {
        console.log(`🚀 [${requestId}] [1단계] Gemini 직접 호출 (${modelToUse})`);
        aiResponse = await callGeminiDirect(
          data.message,
          systemPrompt,
          data.conversationHistory || [],
          geminiApiKey,
          modelToUse
        );
        usedProvider = 'gemini-direct';
        console.log(`✅ [${requestId}] [1단계] 성공`);
      } catch (directError: any) {
        console.warn(`⚠️ [${requestId}] [1단계] 직접 호출 실패: ${directError.message}`);

        // ===== 2단계: Worker 프록시 fallback (지역 제한 우회 시도) =====
        const isLocationError = directError.message.startsWith('LOCATION_RESTRICTED:')
          || directError.message.includes('User location is not supported')
          || directError.message.includes('400');

        if (isLocationError) {
          try {
            console.log(`🔄 [${requestId}] [2단계] Worker 프록시 fallback`);
            aiResponse = await callGeminiViaWorker(
              data.message,
              systemPrompt,
              data.conversationHistory || [],
              geminiApiKey,
              modelToUse
            );
            usedProvider = 'gemini-worker-proxy';
            console.log(`✅ [${requestId}] [2단계] Worker 프록시 성공`);
          } catch (workerError: any) {
            console.warn(`⚠️ [${requestId}] [2단계] Worker 프록시 실패: ${workerError.message}`);
            // Worker도 실패 → 3단계 OpenAI로 계속
          }
        }
      }
    }

    // ===== 3단계: OpenAI fallback =====
    if (!aiResponse && openAIApiKey) {
      try {
        console.log(`🔵 [${requestId}] [3단계] OpenAI fallback`);
        aiResponse = await callOpenAI(
          data.message,
          systemPrompt,
          data.conversationHistory || [],
          openAIApiKey,
          modelToUse
        );
        usedProvider = 'openai-fallback';
        console.log(`✅ [${requestId}] [3단계] OpenAI 성공`);
      } catch (openAIError: any) {
        console.warn(`⚠️ [${requestId}] [3단계] OpenAI 실패: ${openAIError.message}`);
      }
    }

    // ===== 4단계: Novita AI (DeepSeek) fallback =====
    if (!aiResponse && novitaApiKey) {
      try {
        console.log(`🟣 [${requestId}] [4단계] Novita AI fallback`);
        aiResponse = await callNovitaAI(
          data.message,
          systemPrompt,
          data.conversationHistory || [],
          novitaApiKey
        );
        usedProvider = 'novita-fallback';
        console.log(`✅ [${requestId}] [4단계] Novita AI 성공`);
      } catch (novitaError: any) {
        console.warn(`⚠️ [${requestId}] [4단계] Novita AI 실패: ${novitaError.message}`);
      }
    }

    // 모든 단계 실패
    if (!aiResponse) {
      console.error(`❌ [${requestId}] 모든 AI 호출 실패`);
      return new Response(
        JSON.stringify({
          success: false,
          message: "AI 서비스에 일시적으로 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.",
          requestId,
          duration: Date.now() - requestStartTime,
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ [${requestId}] AI 응답 완료 (provider: ${usedProvider})`);

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
        provider: usedProvider,
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
    console.error(`❌ [${Date.now()}] 요청 처리 중 오류:`, error.message);

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
