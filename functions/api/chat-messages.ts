// API: 채팅 메시지 관리
// GET /api/chat-messages?sessionId=xxx - 세션의 메시지 조회
// POST /api/chat-messages - 새 메시지 저장

interface Env {
  DB: D1Database;
}

interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  audioUrl?: string;
  createdAt: string;
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
    const sessionId = url.searchParams.get("sessionId");
    const userId = url.searchParams.get("userId"); // 사용자 확인용 (옵션)

    if (!sessionId) {
      return new Response(
        JSON.stringify({ success: false, message: "sessionId가 필요합니다" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 테이블 생성
    await db.exec(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        sessionId TEXT NOT NULL,
        userId TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        imageUrl TEXT,
        audioUrl TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // userId가 제공된 경우, 세션 소유자 확인
    if (userId) {
      const sessionCheck = await db
        .prepare(`SELECT userId FROM chat_sessions WHERE id = ?`)
        .bind(sessionId)
        .first();
      
      if (sessionCheck && sessionCheck.userId !== userId) {
        console.error(`⚠️ 권한 없음: 사용자 ${userId}가 세션 ${sessionId} 접근 시도`);
        return new Response(
          JSON.stringify({ success: false, message: "권한이 없습니다" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // 메시지 조회
    console.log(`📖 메시지 조회 시작: sessionId=${sessionId}, userId=${userId}`);
    
    const result = await db
      .prepare(`
        SELECT * FROM chat_messages 
        WHERE sessionId = ? 
        ORDER BY createdAt ASC
      `)
      .bind(sessionId)
      .all();

    console.log(`📊 메시지 조회 결과:`, {
      success: result.success,
      count: result.results?.length,
      meta: result.meta
    });

    const messages = result.results || [];

    return new Response(
      JSON.stringify({
        success: true,
        messages: messages,
        count: messages.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("메시지 조회 오류:", error);
    return new Response(
      JSON.stringify({ success: false, message: "메시지 조회 실패", error: error.message }),
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

    const data: Partial<ChatMessage> = await context.request.json();

    if (!data.id || !data.sessionId || !data.userId || !data.role || !data.content) {
      return new Response(
        JSON.stringify({ success: false, message: "필수 필드가 누락되었습니다" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 테이블 생성
    await db.exec(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        sessionId TEXT NOT NULL,
        userId TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        imageUrl TEXT,
        audioUrl TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 메시지 저장
    await db
      .prepare(`
        INSERT INTO chat_messages (id, sessionId, userId, role, content, imageUrl, audioUrl, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)
      .bind(
        data.id,
        data.sessionId,
        data.userId,
        data.role,
        data.content,
        data.imageUrl || null,
        data.audioUrl || null
      )
      .run();

    // 세션의 lastMessage 업데이트
    await db
      .prepare(`
        UPDATE chat_sessions 
        SET lastMessage = ?, updatedAt = datetime('now')
        WHERE id = ?
      `)
      .bind(data.content.substring(0, 100), data.sessionId)
      .run();

    return new Response(
      JSON.stringify({ success: true, message: "메시지가 저장되었습니다" }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("메시지 저장 오류:", error);
    return new Response(
      JSON.stringify({ success: false, message: "메시지 저장 실패", error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
