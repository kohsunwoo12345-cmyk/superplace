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

    let chatHistory = [];
    
    // 패턴 1: chat_messages (snake_case)
    try {
      const result = await DB.prepare(`
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
      `).bind(parseInt(studentId), limit).all();
      chatHistory = result.results || [];
      console.log(`✅ Found ${chatHistory.length} chat messages (chat_messages)`);
    } catch (e1: any) {
      console.warn('⚠️ chat_messages 테이블 조회 실패, 다른 패턴 시도:', e1.message);
      
      // 패턴 2: ChatHistory (PascalCase)
      try {
        const result = await DB.prepare(`
          SELECT 
            id,
            studentId,
            message,
            role,
            createdAt
          FROM ChatHistory
          WHERE studentId = ?
          ORDER BY createdAt DESC
          LIMIT ?
        `).bind(parseInt(studentId), limit).all();
        chatHistory = result.results || [];
        console.log(`✅ Found ${chatHistory.length} chat messages (ChatHistory)`);
      } catch (e2: any) {
        console.warn('⚠️ ChatHistory 테이블도 조회 실패:', e2.message);
        
        // 패턴 3: ai_chat_history
        try {
          const result = await DB.prepare(`
            SELECT 
              id,
              student_id as studentId,
              message,
              role,
              created_at as createdAt
            FROM ai_chat_history
            WHERE student_id = ?
            ORDER BY created_at DESC
            LIMIT ?
          `).bind(parseInt(studentId), limit).all();
          chatHistory = result.results || [];
          console.log(`✅ Found ${chatHistory.length} chat messages (ai_chat_history)`);
        } catch (e3: any) {
          console.warn('⚠️ 모든 채팅 테이블 조회 실패, 빈 배열 반환:', e3.message);
          chatHistory = [];
        }
      }
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
