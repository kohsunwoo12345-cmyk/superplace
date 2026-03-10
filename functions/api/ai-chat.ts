// API: AI 챗봇 대화
// POST /api/ai-chat

interface Env {
  GOOGLE_GEMINI_API_KEY: string;
  Novita_AI_API: string; // DeepSeek 모델용 (Novita AI)
  ALL_AI_API_KEY: string; // DeepSeek 모델용 (레거시)
  OPENAI_API_KEY: string; // GPT 모델용
  DB: D1Database;
  VECTORIZE?: VectorizeIndex; // RAG용 벡터 DB (optional)
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
  imageUrl?: string; // ✅ 이미지 URL 추가
}

// Gemini Embedding API로 임베딩 생성
async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: {
          parts: [{ text }]
        }
      })
    }
  );
  
  if (!response.ok) {
    console.error('❌ Embedding API error:', response.status);
    throw new Error(`Embedding API failed: ${response.status}`);
  }
  
  const data = await response.json();
  return data.embedding.values;
}

// RAG: 질문과 관련된 지식 베이스 청크 검색
async function searchKnowledgeBase(
  question: string,
  botId: string,
  apiKey: string,
  vectorize: VectorizeIndex | undefined,
  topK: number = 5
): Promise<string> {
  if (!vectorize) {
    console.log('⚠️ Vectorize not available, using fallback');
    return '';
  }
  
  try {
    console.log(`🔍 RAG 검색 시작: "${question.substring(0, 50)}..."`);
    
    // 질문 임베딩 생성
    const queryEmbedding = await generateEmbedding(question, apiKey);
    console.log(`✅ 질문 임베딩 생성 완료 (${queryEmbedding.length}차원)`);
    
    // 유사도 검색 (메타데이터에 텍스트 포함됨)
    const searchResults = await vectorize.query(queryEmbedding, {
      topK: topK,
      filter: { botId: botId },
      returnMetadata: true
    });
    
    if (!searchResults.matches || searchResults.matches.length === 0) {
      console.log('📭 관련 지식 베이스 없음');
      return '';
    }
    
    console.log(`📚 ${searchResults.matches.length}개 관련 청크 발견`);
    
    // 메타데이터에서 텍스트 추출 (Vectorize 메타데이터에 저장된 텍스트 사용)
    const relevantContext = searchResults.matches
      .map((match: any, index: number) => {
        const text = match.metadata?.text || '';
        const score = match.score?.toFixed(3) || 'N/A';
        const fileName = match.metadata?.fileName || 'Unknown';
        return `[관련 지식 ${index + 1}] (파일: ${fileName}, 유사도: ${score})\n${text}`;
      })
      .join('\n\n---\n\n');
    
    console.log(`✅ RAG 컨텍스트 생성 완료 (${relevantContext.length}자)`);
    
    return relevantContext;
  } catch (error) {
    console.error('❌ RAG 검색 오류:', error);
    return '';
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const apiKey = context.env.GOOGLE_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error("❌ GOOGLE_GEMINI_API_KEY가 설정되지 않았습니다");
      return new Response(
        JSON.stringify({
          success: false,
          message: "API 키가 설정되지 않았습니다. 관리자에게 문의하세요.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const data: ChatRequest = await context.request.json();
    
    if (!data.message || !data.botId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "메시지와 봇 ID가 필요합니다",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`🤖 AI 챗봇 요청 - botId: ${data.botId}, message: ${data.message.substring(0, 50)}...`);

    // 봇 정보 조회
    const db = context.env.DB;
    const bot = await db
      .prepare("SELECT * FROM ai_bots WHERE id = ? AND isActive = 1")
      .bind(data.botId)
      .first();

    if (!bot) {
      console.error(`❌ 봇을 찾을 수 없음: ${data.botId}`);
      return new Response(
        JSON.stringify({
          success: false,
          message: "봇을 찾을 수 없습니다",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`✅ 봇 발견: ${bot.name} (model: ${bot.model})`);
    console.log(`🎛️ Generation Config:`, {
      temperature: bot.temperature || 0.7,
      topK: bot.topK || 40,
      topP: bot.topP || 0.95,
      maxOutputTokens: bot.maxTokens || 2000
    });
    
    // 🔥 RAG: Vectorize에서 관련 지식 검색
    let ragContext = '';
    let useVectorizeRAG = false;
    
    // knowledgeBase가 있고 Vectorize가 설정되어 있으면 RAG 활성화
    if (bot.knowledgeBase && bot.knowledgeBase.trim().length > 0 && context.env.VECTORIZE) {
      console.log('🤖 RAG 모드 활성화 - Vectorize 검색 시작');
      useVectorizeRAG = true;
      ragContext = await searchKnowledgeBase(
        data.message,
        data.botId,
        apiKey,
        context.env.VECTORIZE,
        5 // Top 5 관련 청크
      );
      
      if (ragContext) {
        console.log(`✅ RAG 컨텍스트 적용 (${ragContext.length}자)`);
      } else {
        console.log('⚠️ RAG 검색 결과 없음 - 기존 Knowledge Base 사용');
        useVectorizeRAG = false; // Vectorize 실패 시 기존 KB 사용
      }
    } else if (bot.knowledgeBase && bot.knowledgeBase.trim().length > 0) {
      console.log(`📚 Vectorize 없음 - 기존 Knowledge Base 직접 사용 (${bot.knowledgeBase.length} chars)`);
    } else {
      console.log('📭 Knowledge Base 없음 - 일반 대화 모드');
    }

    // 대화 히스토리 구성
    const history = data.conversationHistory || [];
    
    // 🔥 모델별 API 엔드포인트 설정
    const model = bot.model || "gemini-2.5-flash";
    let apiUrl = '';
    let apiKey_used = '';
    let isDeepSeek = false;
    let isOpenAI = false;
    
    // DeepSeek OCR-2 (Novita AI)
    if (model === 'deepseek-ocr-2') {
      apiUrl = 'https://api.novita.ai/v3/openai/chat/completions';
      apiKey_used = context.env.Novita_AI_API || context.env.ALL_AI_API_KEY;
      isDeepSeek = true;
      console.log('🔧 DeepSeek OCR-2 via Novita AI');
    }
    // OpenAI GPT models
    else if (model.startsWith('gpt-')) {
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      apiKey_used = context.env.OPENAI_API_KEY;
      isOpenAI = true;
      console.log(`🔧 OpenAI ${model}`);
    }
    // Gemini models (default)
    else {
      apiUrl = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;
      apiKey_used = apiKey;
      console.log(`🔧 Gemini ${model}`);
    }
    
    // 시스템 프롬프트 + 대화 히스토리 + 현재 메시지
    const contents: any[] = [];
    
    // 시스템 프롬프트를 첫 메시지로 (RAG 컨텍스트 또는 기존 지식 베이스 포함)
    if (bot.systemPrompt || ragContext || bot.knowledgeBase) {
      let systemMessage = "";
      
      if (bot.systemPrompt) {
        systemMessage += `시스템 지침:\n${bot.systemPrompt}`;
      }
      
      // RAG 모드: Vectorize에서 검색한 관련 컨텍스트 추가
      if (ragContext && useVectorizeRAG) {
        systemMessage += `\n\n--- 관련 자료 (RAG) ---\n${ragContext}\n--- 자료 끝 ---\n\n위 자료를 참고하여 질문에 답변하세요.`;
        console.log(`✅ RAG 컨텍스트 추가 (${ragContext.length}자)`);
      }
      // 기존 모드: 전체 지식 베이스 추가 (Vectorize 미사용 또는 실패 시)
      else if (bot.knowledgeBase && !useVectorizeRAG) {
        systemMessage += `\n\n--- 지식 베이스 (Knowledge Base) ---\n${bot.knowledgeBase}\n--- 지식 베이스 끝 ---\n\n위 지식 베이스의 정보를 참고하여 질문에 답변하세요.`;
        console.log(`✅ Knowledge Base 추가 (${bot.knowledgeBase.length}자)`);
      }
      
      contents.push({
        role: "user",
        parts: [{ text: systemMessage }]
      });
      contents.push({
        role: "model",
        parts: [{ text: "알겠습니다. 지침과 자료를 참고하여 답변하겠습니다." }]
      });
    }
    
    // 대화 히스토리
    for (const msg of history) {
      contents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      });
    }
    
    // 현재 메시지 (이미지 포함 가능)
    const currentMessageParts: any[] = [];
    
    // 이미지가 있는 경우
    if (data.imageUrl) {
      console.log(`🖼️ 이미지 포함됨 (길이: ${data.imageUrl.length})`);
      
      // base64 이미지를 Gemini 형식으로 변환
      // data:image/jpeg;base64,/9j/4AAQ... 형태를 분리
      const base64Match = data.imageUrl.match(/^data:image\/(.*?);base64,(.*)$/);
      
      if (base64Match) {
        const mimeType = `image/${base64Match[1]}`;
        const base64Data = base64Match[2];
        
        console.log(`📷 이미지 타입: ${mimeType}`);
        
        // 텍스트 먼저 추가
        currentMessageParts.push({ text: data.message });
        
        // 이미지 데이터 추가
        currentMessageParts.push({
          inline_data: {
            mime_type: mimeType,
            data: base64Data
          }
        });
      } else {
        console.warn("⚠️ 이미지 형식이 올바르지 않습니다. 텍스트만 전송합니다.");
        currentMessageParts.push({ text: data.message });
      }
    } else {
      // 텍스트만 있는 경우
      currentMessageParts.push({ text: data.message });
    }
    
    contents.push({
      role: "user",
      parts: currentMessageParts
    });

    console.log(`📤 AI API 호출 중... (${contents.length}개 메시지, 이미지: ${data.imageUrl ? '있음' : '없음'})`);

    let aiResponse = '';
    
    // 🔥 DeepSeek 또는 OpenAI: OpenAI 호환 형식
    if (isDeepSeek || isOpenAI) {
      // OpenAI 형식의 messages 배열로 변환
      const messages: any[] = [];
      
      // 시스템 프롬프트 준비
      if (bot.systemPrompt || ragContext || bot.knowledgeBase) {
        let systemMessage = "";
        
        if (bot.systemPrompt) {
          systemMessage += bot.systemPrompt;
        }
        
        if (ragContext && useVectorizeRAG) {
          systemMessage += `\n\n--- 관련 자료 (RAG) ---\n${ragContext}\n--- 자료 끝 ---\n\n위 자료를 참고하여 질문에 답변하세요.`;
        } else if (bot.knowledgeBase && !useVectorizeRAG) {
          systemMessage += `\n\n--- 지식 베이스 ---\n${bot.knowledgeBase}\n--- 지식 베이스 끝 ---\n\n위 지식 베이스를 참고하여 질문에 답변하세요.`;
        }
        
        messages.push({
          role: "system",
          content: systemMessage
        });
      }
      
      // 대화 히스토리
      for (const msg of history) {
        messages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content
        });
      }
      
      // 현재 메시지
      if (data.imageUrl && isDeepSeek) {
        // DeepSeek OCR-2: 이미지 + 텍스트
        messages.push({
          role: "user",
          content: [
            { type: "text", text: data.message },
            { type: "image_url", image_url: { url: data.imageUrl } }
          ]
        });
      } else {
        // 텍스트만
        messages.push({
          role: "user",
          content: data.message
        });
      }
      
      const requestBody: any = {
        model: isDeepSeek ? 'deepseek/deepseek-ocr-2' : model,
        messages: messages,
        temperature: bot.temperature || 0.7,
        max_tokens: bot.maxTokens || 2000,
        top_p: bot.topP || 0.95
      };
      
      console.log(`📤 ${isDeepSeek ? 'DeepSeek' : 'OpenAI'} API 호출 중...`);
      
      const apiResponse = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey_used}`
        },
        body: JSON.stringify(requestBody),
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error(`❌ ${isDeepSeek ? 'DeepSeek' : 'OpenAI'} API 오류:`, apiResponse.status, errorText);
        return new Response(
          JSON.stringify({
            success: false,
            message: "AI 응답 생성 중 오류가 발생했습니다",
            error: errorText,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const apiData = await apiResponse.json();
      aiResponse = apiData.choices?.[0]?.message?.content || "응답을 생성할 수 없습니다.";
      console.log(`✅ ${isDeepSeek ? 'DeepSeek' : 'OpenAI'} 응답: ${aiResponse.substring(0, 100)}...`);
    }
    // 🔥 Gemini: Gemini 형식
    else {
      const geminiResponse = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: contents,
          generationConfig: {
            temperature: bot.temperature || 0.7,
            topK: bot.topK || 40,
            topP: bot.topP || 0.95,
            maxOutputTokens: bot.maxTokens || 2000,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_NONE"
            }
          ]
        }),
      });

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error("❌ Gemini API 오류:", geminiResponse.status, errorText);
        return new Response(
          JSON.stringify({
            success: false,
            message: "AI 응답 생성 중 오류가 발생했습니다",
            error: errorText,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const geminiData = await geminiResponse.json();
      aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 
                        "응답을 생성할 수 없습니다.";

      console.log(`✅ Gemini 응답: ${aiResponse.substring(0, 100)}...`);
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
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ AI 챗봇 오류:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
