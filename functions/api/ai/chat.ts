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
