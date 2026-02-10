// API: 채팅 세션 삭제
// DELETE /api/chat-sessions/[id]

interface Env {
  DB: D1Database;
}

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: "DB 연결 실패" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const sessionId = context.params.id as string;

    if (!sessionId) {
      return new Response(
        JSON.stringify({ success: false, message: "세션 ID가 필요합니다" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 세션과 관련 메시지 삭제
    await db.prepare("DELETE FROM chat_messages WHERE sessionId = ?").bind(sessionId).run();
    await db.prepare("DELETE FROM chat_sessions WHERE id = ?").bind(sessionId).run();

    return new Response(
      JSON.stringify({ success: true, message: "세션이 삭제되었습니다" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("세션 삭제 오류:", error);
    return new Response(
      JSON.stringify({ success: false, message: "세션 삭제 실패", error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
