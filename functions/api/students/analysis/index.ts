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
 * POST /api/students/analysis
 * Gemini API를 사용하여 학생의 AI 대화 기반 역량 분석
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

    console.log('🧠 Analyzing student competency for:', studentId);

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
      console.log(`✅ Found ${chatHistory.length} chat messages for analysis`);
    } catch (dbError: any) {
      console.warn('⚠️ chat_messages table may not exist:', dbError.message);
      chatHistory = [];
    }

    // 2. 채팅 내역이 없는 경우
    if (chatHistory.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          analysis: {
            summary: "분석할 대화 내역이 없습니다.",
            strengths: [],
            weaknesses: [],
            recommendations: ["AI 챗봇과 대화를 시작하여 학습 역량을 분석받으세요."],
            chatCount: 0,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Gemini API 호출 준비
    const conversationText = chatHistory
      .slice(0, 50) // 최근 50개만 분석
      .reverse() // 시간순 정렬
      .map(msg => `${msg.role === 'user' ? '학생' : 'AI'}: ${msg.message}`)
      .join('\n\n');

    const prompt = `다음은 한 학생이 AI 챗봇과 나눈 대화 내역입니다. 이 학생의 학습 역량을 분석하고, 부족한 부분과 강점, 개선 방안을 제시해주세요.

대화 내역:
${conversationText}

다음 형식으로 JSON 응답을 제공해주세요:
{
  "summary": "전반적인 학습 패턴 요약 (2-3문장)",
  "strengths": ["강점1", "강점2", "강점3"],
  "weaknesses": ["부족한 역량1", "부족한 역량2", "부족한 역량3"],
  "recommendations": ["개선 방안1", "개선 방안2", "개선 방안3"]
}

한국어로 작성하고, 구체적이고 실용적인 분석을 제공해주세요.`;

    // 4. Gemini API 호출
    const geminiApiKey = GEMINI_API_KEY || 'AIzaSyDSKFT7gvtwYe01z0JWqFDz3PHSxZiKyoE'; // 환경 변수 또는 기본 키
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`;

    console.log('🔄 Calling Gemini API for analysis...');
    
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
          maxOutputTokens: 2048,
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
      
      // JSON 추출 (코드 블록 제거)
      let jsonText = responseText.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\s*/, '').replace(/```\s*$/, '');
      }
      
      analysisResult = JSON.parse(jsonText);
      analysisResult.chatCount = chatHistory.length;
      
      console.log('✅ Analysis completed successfully');
    } catch (parseError) {
      console.error('❌ Failed to parse Gemini response:', parseError);
      
      // 파싱 실패 시 기본 응답
      analysisResult = {
        summary: "AI 분석 중 오류가 발생했습니다. 다시 시도해주세요.",
        strengths: ["분석 데이터 처리 중"],
        weaknesses: ["분석 데이터 처리 중"],
        recommendations: ["잠시 후 다시 시도해주세요."],
        chatCount: chatHistory.length,
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisResult,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Student analysis error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "학생 역량 분석 중 오류가 발생했습니다",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
