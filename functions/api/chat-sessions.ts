// API: 채팅 세션 관리
// GET /api/chat-sessions?userId=xxx - 사용자의 세션 목록 조회
// POST /api/chat-sessions - 새 세션 생성
// DELETE /api/chat-sessions/[id] - 세션 삭제

interface Env {
  DB: D1Database;
}

interface ChatSession {
  id: string;
  userId: string;
  academyId: string;
  botId: string;
  title: string;
  lastMessage: string;
  createdAt: string;
  updatedAt: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: "DB 연결 실패" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(context.request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, message: "userId가 필요합니다" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 테이블 생성
    await db.exec(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        academyId TEXT NOT NULL,
        botId TEXT NOT NULL,
        title TEXT,
        lastMessage TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 사용자의 세션 조회
    const result = await db
      .prepare(`
        SELECT * FROM chat_sessions 
        WHERE userId = ? 
        ORDER BY updatedAt DESC
        LIMIT 50
      `)
      .bind(userId)
      .all();

    return new Response(
      JSON.stringify({
        success: true,
        sessions: result.results || [],
        count: result.results?.length || 0,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("세션 조회 오류:", error);
    return new Response(
      JSON.stringify({ success: false, message: "세션 조회 실패", error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: "DB 연결 실패" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data: Partial<ChatSession> = await context.request.json();

    if (!data.id || !data.userId || !data.academyId || !data.botId) {
      return new Response(
        JSON.stringify({ success: false, message: "필수 필드가 누락되었습니다" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 테이블 생성
    await db.exec(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        academyId TEXT NOT NULL,
        botId TEXT NOT NULL,
        title TEXT,
        lastMessage TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 세션 생성
    await db
      .prepare(`
        INSERT INTO chat_sessions (id, userId, academyId, botId, title, lastMessage, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `)
      .bind(
        data.id,
        data.userId,
        data.academyId,
        data.botId,
        data.title || "새로운 대화",
        data.lastMessage || ""
      )
      .run();

    return new Response(
      JSON.stringify({ success: true, message: "세션이 생성되었습니다", sessionId: data.id }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("세션 생성 오류:", error);
    return new Response(
      JSON.stringify({ success: false, message: "세션 생성 실패", error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
