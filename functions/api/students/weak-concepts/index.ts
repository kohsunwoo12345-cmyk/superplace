interface Env {
  DB: D1Database;
  GEMINI_API_KEY: string;
}

interface ChatMessage {
  id: number;
  studentId: number;
  message: string;
  role: string;
  createdAt: string;
}

/**
 * POST /api/students/weak-concepts
 * Gemini API를 사용하여 학생의 부족한 개념 분석
 */
export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const { DB, GEMINI_API_KEY } = env;

  if (!DB) {
    return new Response(JSON.stringify({ success: false, error: "Database not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { studentId } = body;

    if (!studentId) {
      return new Response(
        JSON.stringify({ success: false, error: "studentId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('🔍 Analyzing weak concepts for student:', studentId);

    // 1. 학생의 채팅 내역 가져오기
    let chatHistory: ChatMessage[] = [];
    
    try {
      const query = `
        SELECT 
          id,
          student_id as studentId,
          message,
          role,
          created_at as createdAt
        FROM chat_messages
        WHERE student_id = ?
        ORDER BY created_at DESC
        LIMIT 100
      `;
      
      const result = await DB.prepare(query).bind(parseInt(studentId)).all();
      chatHistory = result.results as any[] || [];
      console.log(`✅ Found ${chatHistory.length} chat messages for concept analysis`);
    } catch (dbError: any) {
      console.warn('⚠️ chat_messages table may not exist:', dbError.message);
      chatHistory = [];
    }

    // 2. 채팅 내역이 없는 경우
    if (chatHistory.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          weakConcepts: [],
          summary: "분석할 대화 내역이 없습니다.",
          recommendations: ["AI 챗봇과 대화를 시작하여 부족한 개념을 파악하세요."],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Gemini API 호출 준비
    const conversationText = chatHistory
      .slice(0, 50)
      .reverse()
      .map(msg => `${msg.role === 'user' ? '학생' : 'AI'}: ${msg.message}`)
      .join('\n\n');

    const prompt = `다음은 한 학생이 AI 챗봇과 나눈 학습 대화 내역입니다. 이 학생이 질문한 내용과 AI의 답변을 분석하여, 학생이 이해하지 못하거나 부족한 개념들을 파악해주세요.

대화 내역:
${conversationText}

다음 형식으로 JSON 응답을 제공해주세요:
{
  "summary": "학생의 전반적인 이해도 요약 (2-3문장)",
  "weakConcepts": [
    {
      "concept": "개념명",
      "description": "부족한 이유 설명",
      "severity": "high/medium/low",
      "relatedTopics": ["관련 주제1", "관련 주제2"]
    }
  ],
  "recommendations": [
    {
      "concept": "개념명",
      "action": "구체적인 학습 방법"
    }
  ]
}

한국어로 작성하고, 최대 5개의 부족한 개념을 찾아주세요. 구체적이고 실용적인 분석을 제공해주세요.`;

    // 4. Gemini API 호출
    const geminiApiKey = GEMINI_API_KEY || 'AIzaSyDSKFT7gvtwYe01z0JWqFDz3PHSxZiKyoE';
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`;

    console.log('🔄 Calling Gemini API for weak concept analysis...');
    
    const geminiResponse = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 3048,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('❌ Gemini API error:', errorText);
      throw new Error(`Gemini API failed: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('✅ Gemini API response received');

    // 5. Gemini 응답 파싱
    let analysisResult;
    try {
      const responseText = geminiData.candidates[0].content.parts[0].text;
      
      let jsonText = responseText.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\s*/, '').replace(/```\s*$/, '');
      }
      
      analysisResult = JSON.parse(jsonText);
      
      console.log('✅ Weak concept analysis completed successfully');
    } catch (parseError) {
      console.error('❌ Failed to parse Gemini response:', parseError);
      
      analysisResult = {
        summary: "AI 분석 중 오류가 발생했습니다.",
        weakConcepts: [],
        recommendations: [],
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...analysisResult,
        chatCount: chatHistory.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Weak concepts analysis error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "부족한 개념 분석 중 오류가 발생했습니다",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
