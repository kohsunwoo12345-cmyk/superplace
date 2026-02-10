interface Env {
  DB: D1Database;
}

/**
 * GET /api/students/chat-history?studentId={studentId}
 * 학생의 AI 챗봇 대화 내역 조회
 */
export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const { DB } = env;

  if (!DB) {
    return new Response(JSON.stringify({ success: false, error: "Database not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(request.url);
    const studentId = url.searchParams.get("studentId");
    const limit = parseInt(url.searchParams.get("limit") || "50");

    if (!studentId) {
      return new Response(
        JSON.stringify({ success: false, error: "studentId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('💬 Fetching chat history for student:', studentId);

    // AI 챗봇 대화 내역 조회 (chat_messages 테이블 또는 유사 테이블)
    // 테이블 구조: id, student_id, message, role (user/assistant), created_at
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
      LIMIT ?
    `;

    let chatHistory = [];
    
    try {
      const result = await DB.prepare(query).bind(parseInt(studentId), limit).all();
      chatHistory = result.results || [];
      console.log(`✅ Found ${chatHistory.length} chat messages`);
    } catch (dbError: any) {
      // 테이블이 없는 경우 빈 배열 반환
      console.warn('⚠️ chat_messages table may not exist:', dbError.message);
      chatHistory = [];
    }

    return new Response(
      JSON.stringify({
        success: true,
        chatHistory: chatHistory,
        count: chatHistory.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Fetch chat history error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "채팅 내역 조회 중 오류가 발생했습니다",
        chatHistory: [],
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
