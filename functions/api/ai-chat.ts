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
  
  // 🌍 지역 제한 우회: OpenRouter 프록시 사용
  const useOpenRouter = true;
  
  let url = '';
  let headers: any = { "Content-Type": "application/json" };
  
  if (useOpenRouter) {
    url = 'https://openrouter.ai/api/v1/chat/completions';
    headers['Authorization'] = 'Bearer sk-or-v1-b8f5c9e3d2a1f6e4c8d7b9a2e5f1c3d6a8b4e7f2c9d1a5e3b6f8c2d4a7e9b1f5c';
    headers['HTTP-Referer'] = 'https://suplacestudy.com';
    console.log(`📤 Using OpenRouter proxy`);
  } else {
    url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`;
    console.log(`📤 URL: ${url.replace(/key=.+/, 'key=[HIDDEN]')}`);
  }

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

  // 🔧 Request Body 구성
  let requestBody: any;
  
  if (useOpenRouter) {
    // OpenRouter 형식: messages 배열
    const messages: any[] = [];
    
    // System prompt를 첫 메시지로
    if (systemPrompt && systemPrompt.trim().length > 0) {
      messages.push({
        role: "system",
        content: systemPrompt
      });
    }
    
    // Contents를 messages로 변환
    contents.forEach(item => {
      const text = item.parts?.[0]?.text || '';
      if (text) {
        messages.push({
          role: item.role === 'model' ? 'assistant' : item.role,
          content: text
        });
      }
    });
    
    requestBody = {
      model: 'google/gemini-2.0-flash-exp:free',
      messages: messages,
      temperature: 1.0,
      max_tokens: 8192
    };
    
    console.log(`📤 OpenRouter messages: ${messages.length}개`);
  } else {
    // Gemini 직접 호출 형식
    requestBody = {
      contents: contents,
      generationConfig: {
        temperature: 1.0,
        maxOutputTokens: 8192
      }
    };
    
    console.log(`📤 Gemini contents: ${contents.length}개`);
  }

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
  
  let text = '';
  if (useOpenRouter) {
    // OpenRouter 응답 형식
    text = data.choices?.[0]?.message?.content || "응답을 생성할 수 없습니다.";
    console.log(`✅ OpenRouter 응답 받음: ${text.length}자`);
  } else {
    // Gemini 직접 호출 응답 형식
    text = data.candidates?.[0]?.content?.parts?.[0]?.text || "응답을 생성할 수 없습니다.";
    console.log(`✅ Gemini 응답 받음: ${text.length}자`);
  }
  
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

    const modelToUse = bot.model || 'gemini-2.0-flash-exp';
    console.log(`✅ [${requestId}] 봇 발견: ${bot.name}`);
    console.log(`📊 [${requestId}] 모델: ${modelToUse}`);
    console.log(`📚 [${requestId}] 지식베이스: ${bot.knowledgeBase ? '있음' : '없음'}`);

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
    console.log(`📚 [${requestId}] Gemini 호출 준비`);
    console.log(`🎯 [${requestId}] 사용 모델: ${modelToUse}`);
    
    let systemPrompt = bot.systemPrompt || '';
    
    // RAG 컨텍스트를 시스템 프롬프트에 추가
    if (ragContext && ragContext.length > 0) {
      console.log(`✅ [${requestId}] RAG 컨텍스트 ${ragContext.length}개를 시스템 프롬프트에 추가`);
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
      console.log(`⚠️ [${requestId}] RAG 컨텍스트 없음, 전체 knowledgeBase 사용`);
      systemPrompt += `\n\n--- 지식 베이스 ---\n${bot.knowledgeBase}\n--- 지식 베이스 끝 ---\n\n위 지식을 참고하여 답변하세요.`;
    }

    // 🔄 재시도 로직 with fallback models (503 에러 대응 강화 - 더 많은 모델)
    const fallbackModels = [
      modelToUse,
      'gemini-1.5-flash',          // 가장 안정적
      'gemini-1.5-flash-8b',       // 초경량
      'gemini-2.0-flash-exp',      // 실험 버전
      'gemini-1.5-pro',            // 고성능
      'gemini-1.0-pro',            // 레거시 안정
      'gemini-pro'                 // 추가 안정 모델
    ];
    
    // 중복 제거
    const uniqueModels = [...new Set(fallbackModels)];
    
    let lastError: any = null;
    let retryAttempt = 0;
    const maxRetries = uniqueModels.length * 3; // 각 모델당 3번씩 시도
    const attemptedModels: string[] = [];
    
    console.log(`🔄 [${requestId}] 재시도 전략: ${uniqueModels.length}개 모델 × 3회 = 최대 ${maxRetries}회 시도`);
    
    for (let i = 0; i < maxRetries; i++) {
      const modelIndex = i % uniqueModels.length;
      const tryModel = uniqueModels[modelIndex];
      
      try {
        console.log(`🚀 [${requestId}] Gemini API 호출 시도 ${i + 1}/${maxRetries} (모델: ${tryModel})`);
        
        // 첫 시도가 아니면 짧은 백오프 적용 (빠른 재시도)
        if (i > 0) {
          // 짧은 백오프: 500ms → 1s → 1.5s → 2s → 최대 3초
          const waitTime = Math.min(500 * Math.pow(1.5, Math.min(i - 1, 5)), 3000);
          console.log(`⏳ [${requestId}] ${Math.round(waitTime)}ms 대기 후 재시도...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        aiResponse = await callGeminiDirect(
          data.message,
          systemPrompt,
          data.conversationHistory || [],
          apiKey,
          tryModel
        );
        
        console.log(`✅ [${requestId}] Gemini 응답 성공 (${aiResponse.length} 글자, 모델: ${tryModel}, 시도 횟수: ${i + 1})`);
        attemptedModels.push(tryModel);
        retryAttempt = i;
        break; // 성공하면 루프 탈출
        
      } catch (geminiError: any) {
        lastError = geminiError;
        attemptedModels.push(tryModel);
        const isRetryable = geminiError.isRetryable || geminiError.status === 503 || geminiError.status === 429 || geminiError.status === 500;
        
        console.error(`❌ [${requestId}] 모델 ${tryModel} 실패 (시도 ${i + 1}/${maxRetries}):`, geminiError.message);
        console.error(`❌ [${requestId}] 에러 상태:`, geminiError.status);
        console.error(`❌ [${requestId}] 재시도 가능:`, isRetryable);
        
        retryAttempt = i;
        
        // 재시도 불가능한 에러면 즉시 중단
        if (!isRetryable) {
          console.error(`❌ [${requestId}] 재시도 불가능한 에러, 중단`);
          break;
        }
        
        // 마지막 시도였으면 break
        if (i >= maxRetries - 1) {
          console.error(`❌ [${requestId}] 모든 재시도 실패 (총 ${i + 1}회 시도)`);
          break;
        }
      }
    }
    
    // 모든 Gemini 시도가 실패한 경우 → 에러 반환 (정확한 에러 처리)
    if (!aiResponse && lastError) {
      console.error(`❌ [${requestId}] Gemini 모든 시도 실패, 에러 반환`);
      console.error(`❌ [${requestId}] 마지막 에러:`, lastError.message);
      console.error(`❌ [${requestId}] 시도한 모델:`, attemptedModels);
      
      throw lastError; // 실제 에러를 throw해서 catch 블록에서 처리
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
        attemptedModels: attemptedModels.length > 1 ? attemptedModels : undefined,
        retryCount: retryAttempt > 0 ? retryAttempt : undefined,
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
