// API: AI 챗봇 대화
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
  imageUrl?: string; // ✅ 이미지 URL 추가
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

    // 대화 히스토리 구성
    const history = data.conversationHistory || [];
    
    // Gemini API 호출
    const model = bot.model || "gemini-2.0-flash-exp";
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;
    
    // 시스템 프롬프트 + 대화 히스토리 + 현재 메시지
    const contents: any[] = [];
    
    // 시스템 프롬프트를 첫 메시지로
    if (bot.systemPrompt) {
      contents.push({
        role: "user",
        parts: [{ text: `시스템 지침: ${bot.systemPrompt}` }]
      });
      contents.push({
        role: "model",
        parts: [{ text: "알겠습니다. 지침을 따르겠습니다." }]
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

    console.log(`📤 Gemini API 호출 중... (${contents.length}개 메시지, 이미지: ${data.imageUrl ? '있음' : '없음'})`);


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
    const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 
                      "응답을 생성할 수 없습니다.";

    console.log(`✅ Gemini 응답: ${aiResponse.substring(0, 100)}...`);

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
