interface Env {
  GOOGLE_GEMINI_API_KEY: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { GOOGLE_GEMINI_API_KEY } = context.env;
    
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
      knowledgeFiles = [],
      model = "gemini-2.5-flash",
      temperature = 0.7,
      maxTokens = 2000,
      topK = 40,
      topP = 0.95,
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

    // 지식 파일 내용 추출 및 컨텍스트 생성
    let knowledgeContext = "";
    if (knowledgeFiles && knowledgeFiles.length > 0) {
      knowledgeContext = "\n\n=== 참고 자료 ===\n";
      for (const file of knowledgeFiles) {
        if (file.content && file.name) {
          // Base64 디코딩 및 텍스트 추출 시도
          try {
            // data:..;base64, 부분 제거
            const base64Content = file.content.split(',')[1] || file.content;
            const decodedContent = atob(base64Content);
            
            // 텍스트 파일인 경우 직접 사용
            if (file.type.includes('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
              knowledgeContext += `\n[파일: ${file.name}]\n${decodedContent}\n`;
            } else {
              // PDF, DOCX 등은 파일명과 메타데이터만 포함
              knowledgeContext += `\n[파일: ${file.name}]\n(파일 형식: ${file.type}, 크기: ${Math.round(file.size / 1024)}KB)\n`;
              knowledgeContext += `주의: 이 파일의 전체 내용은 현재 텍스트 추출이 필요합니다.\n`;
            }
          } catch (e) {
            // 디코딩 실패 시 파일 정보만 포함
            knowledgeContext += `\n[파일: ${file.name}]\n(읽기 오류 발생)\n`;
          }
        }
      }
      knowledgeContext += "\n=== 참고 자료 끝 ===\n\n";
    }

    // Gemini API 호출
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${GOOGLE_GEMINI_API_KEY}`;

    // 시스템 프롬프트와 지식 베이스 결합
    const fullPrompt = [
      systemPrompt || "",
      knowledgeContext,
      "위 참고 자료를 바탕으로 사용자의 질문에 정확하고 상세하게 답변해주세요.",
      `\n사용자 질문: ${message}`
    ].filter(p => p.trim()).join("\n\n");

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: fullPrompt,
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
