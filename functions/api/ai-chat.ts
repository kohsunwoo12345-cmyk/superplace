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
  knowledgeFiles?: Array<{
    name: string;
    size: number;
    type: string;
    content: string;
  }>; // ✅ 지식 파일 추가
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

    // DB에서 가져온 knowledgeFiles 파싱 (DB에 JSON 문자열로 저장됨)
    let botKnowledgeFiles: any[] = [];
    if (bot.knowledgeFiles) {
      try {
        botKnowledgeFiles = JSON.parse(bot.knowledgeFiles as string);
        console.log(`📚 DB에서 지식 파일 ${botKnowledgeFiles.length}개 로드됨`);
      } catch (e) {
        console.error("❌ knowledgeFiles 파싱 오류:", e);
      }
    }

    // 클라이언트에서 전송된 파일과 DB 파일 병합 (클라이언트 우선)
    const finalKnowledgeFiles = data.knowledgeFiles && data.knowledgeFiles.length > 0
      ? data.knowledgeFiles
      : botKnowledgeFiles;

    // 지식 파일 처리
    let knowledgeContext = "";
    
    if (finalKnowledgeFiles.length > 0) {
      console.log(`📚 지식 파일 ${finalKnowledgeFiles.length}개 처리 중...`);
      knowledgeContext = "\n\n=== 📚 참고 자료 (Knowledge Base) ===\n\n";
      
      for (const file of finalKnowledgeFiles) {
        try {
          console.log(`📄 처리 중: ${file.name} (${file.type})`);
          
          // Base64 디코딩
          const base64Content = file.content.includes(',') 
            ? file.content.split(',')[1] 
            : file.content;
          
          const decodedContent = atob(base64Content);
          
          // 파일 타입에 따라 처리
          if (file.type.includes('text/') || 
              file.name.endsWith('.txt') || 
              file.name.endsWith('.md')) {
            // 텍스트 파일: 전체 내용 포함
            knowledgeContext += `\n📄 [${file.name}]\n`;
            knowledgeContext += `${'='.repeat(50)}\n`;
            knowledgeContext += `${decodedContent}\n`;
            knowledgeContext += `${'='.repeat(50)}\n\n`;
            console.log(`✅ 텍스트 파일 추출 완료: ${file.name} (${decodedContent.length} 문자)`);
          } else if (file.type.includes('pdf') || file.name.endsWith('.pdf')) {
            // PDF: 메타데이터만 (향후 텍스트 추출 구현)
            knowledgeContext += `\n📑 [${file.name}]\n`;
            knowledgeContext += `파일 형식: PDF\n`;
            knowledgeContext += `크기: ${Math.round(file.size / 1024)}KB\n`;
            knowledgeContext += `⚠️ PDF 텍스트 추출은 향후 구현 예정입니다.\n\n`;
            console.log(`⚠️ PDF 파일: ${file.name} (텍스트 추출 미지원)`);
          } else if (file.type.includes('word') || 
                     file.name.endsWith('.docx') || 
                     file.name.endsWith('.doc')) {
            // DOCX: 메타데이터만 (향후 텍스트 추출 구현)
            knowledgeContext += `\n📝 [${file.name}]\n`;
            knowledgeContext += `파일 형식: Word 문서\n`;
            knowledgeContext += `크기: ${Math.round(file.size / 1024)}KB\n`;
            knowledgeContext += `⚠️ Word 문서 텍스트 추출은 향후 구현 예정입니다.\n\n`;
            console.log(`⚠️ Word 문서: ${file.name} (텍스트 추출 미지원)`);
          } else {
            // 기타 파일: 정보만
            knowledgeContext += `\n📎 [${file.name}]\n`;
            knowledgeContext += `파일 형식: ${file.type}\n`;
            knowledgeContext += `크기: ${Math.round(file.size / 1024)}KB\n\n`;
            console.log(`ℹ️ 기타 파일: ${file.name}`);
          }
        } catch (error) {
          console.error(`❌ 파일 처리 오류: ${file.name}`, error);
          knowledgeContext += `\n❌ [${file.name}] - 읽기 오류\n\n`;
        }
      }
      
      knowledgeContext += "\n=== 참고 자료 끝 ===\n\n";
      knowledgeContext += "💡 위의 참고 자료를 바탕으로 사용자의 질문에 정확하고 상세하게 답변해주세요.\n";
      knowledgeContext += "참고 자료에 관련 정보가 있다면 반드시 활용하고, 출처를 명시해주세요.\n\n";
      
      console.log(`✅ 지식 베이스 구성 완료 (${knowledgeContext.length} 문자)`);
    }

    // 대화 히스토리 구성
    const history = data.conversationHistory || [];
    
    // Gemini API 호출
    const model = bot.model || "gemini-2.0-flash-exp";
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;
    
    // 시스템 프롬프트 + 대화 히스토리 + 현재 메시지
    const contents: any[] = [];
    
    // 시스템 프롬프트 + 지식 베이스를 첫 메시지로
    let systemMessage = "";
    if (bot.systemPrompt) {
      systemMessage += `시스템 지침:\n${bot.systemPrompt}\n\n`;
    }
    if (knowledgeContext) {
      systemMessage += knowledgeContext;
    }
    
    if (systemMessage) {
      contents.push({
        role: "user",
        parts: [{ text: systemMessage }]
      });
      contents.push({
        role: "model",
        parts: [{ text: "알겠습니다. 지침과 참고 자료를 숙지했습니다. 질문해주세요." }]
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
