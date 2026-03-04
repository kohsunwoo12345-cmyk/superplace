interface Env {
  GOOGLE_GEMINI_API_KEY: string;
  VECTORIZE: VectorizeIndex;
  DB: D1Database;
}

// Gemini API로 쿼리 임베딩 생성
async function generateQueryEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: {
          parts: [{ text }]
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini Embedding API error: ${error}`);
  }

  const data = await response.json();
  return data.embedding.values;
}

// Vectorize에서 관련 지식 검색
async function searchKnowledge(
  vectorize: VectorizeIndex,
  queryEmbedding: number[],
  botId: string,
  topK: number = 3
): Promise<string> {
  try {
    const results = await vectorize.query(queryEmbedding, {
      topK,
      filter: { botId }
    });

    if (!results.matches || results.matches.length === 0) {
      return '';
    }

    // 검색된 청크들을 하나의 컨텍스트로 결합
    const context = results.matches
      .map((match: any, idx: number) => {
        const text = match.metadata?.text || '';
        const score = match.score?.toFixed(3) || 'N/A';
        return `[관련 지식 ${idx + 1}] (유사도: ${score})\n${text}`;
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
    const { GOOGLE_GEMINI_API_KEY, VECTORIZE, DB } = context.env;
    
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
        ).bind(botId, userId).first();
        
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
        
        // 4. 학원 전체 할당 인원 체크 (우선순위 기반)
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
        
        console.log(`✅ 봇 접근 권한 확인 완료: userId=${userId}, botId=${botId}, rank=${studentRank}/${totalSlots}`);
      } catch (accessError: any) {
        console.error('⚠️ 봇 접근 권한 체크 실패:', accessError);
        // 권한 체크 실패 시에도 계속 진행 (관리자 계정 등)
      }
    }

    let knowledgeContext = '';
    let ragEnabled = false;

    // 🔥 RAG: Vectorize에서 관련 지식 검색
    if (enableRAG && botId && VECTORIZE && GOOGLE_GEMINI_API_KEY) {
      try {
        console.log(`🔍 RAG enabled for bot ${botId}, searching knowledge...`);
        
        // 1. 사용자 메시지를 임베딩으로 변환
        const queryEmbedding = await generateQueryEmbedding(message, GOOGLE_GEMINI_API_KEY);
        console.log(`  └─ Query embedding generated (${queryEmbedding.length} dimensions)`);
        
        // 2. Vectorize에서 유사한 지식 검색
        knowledgeContext = await searchKnowledge(VECTORIZE, queryEmbedding, botId, 3);
        
        if (knowledgeContext) {
          ragEnabled = true;
          console.log(`✅ RAG context found (${knowledgeContext.length} characters)`);
        } else {
          console.log(`ℹ️ No relevant knowledge found in Vectorize for bot ${botId}`);
        }
      } catch (ragError: any) {
        console.error('⚠️ RAG search failed, continuing without RAG:', ragError.message);
        // RAG 실패해도 일반 채팅은 계속 진행
      }
    }

    // Gemini API 버전 선택 로직
    let apiVersion = 'v1beta';
    if (model.includes('1.0')) {
      apiVersion = 'v1';
    }
    
    const geminiEndpoint = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${GOOGLE_GEMINI_API_KEY}`;

    // 🔥 RAG 적용: 지식 컨텍스트를 시스템 프롬프트에 추가
    let enhancedSystemPrompt = systemPrompt || '';
    
    if (knowledgeContext) {
      enhancedSystemPrompt = `${systemPrompt}

📚 **참고 지식:**
아래는 사용자 질문과 관련된 지식 베이스 내용입니다. 이 정보를 참고하여 답변하세요.

${knowledgeContext}

---

위 지식을 바탕으로 사용자의 질문에 정확하고 상세하게 답변해주세요.`;
    }

    const requestBody = {
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

    const geminiResponse = await fetch(geminiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error("Gemini API Error:", errorData);
      
      return new Response(
        JSON.stringify({
          error: "Gemini API request failed",
          details: errorData,
        }),
        {
          status: geminiResponse.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const geminiData = await geminiResponse.json();

    // Gemini 응답 파싱
    const responseText =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text ||
      "응답을 생성할 수 없습니다.";

    return new Response(
      JSON.stringify({
        response: responseText,
        model: model,
        ragEnabled,
        knowledgeUsed: ragEnabled,
        usage: {
          promptTokens: geminiData.usageMetadata?.promptTokenCount || 0,
          completionTokens: geminiData.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: geminiData.usageMetadata?.totalTokenCount || 0,
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
