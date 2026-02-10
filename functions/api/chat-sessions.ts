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
  const db = context.env.DB;
  
  try {
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

    console.log(`📂 세션 조회 시작: userId=${userId}`);

    // 테이블 생성 (exec 대신 batch 사용)
    try {
      await db.batch([
        db.prepare(`
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
        `)
      ]);
    } catch (createError) {
      console.log('⚠️ 테이블 생성 시도 중 오류 (이미 존재할 수 있음):', createError);
    }

    // 세션 조회
    const selectStmt = db.prepare(`
      SELECT * FROM chat_sessions 
      WHERE userId = ? 
      ORDER BY updatedAt DESC 
      LIMIT 50
    `).bind(userId);
    
    const queryResult = await selectStmt.all();
    const sessions = queryResult?.results || [];
    
    console.log(`✅ ${sessions.length}개 세션 찾음`);
    
    return new Response(
      JSON.stringify({
        success: true,
        sessions: sessions,
        count: sessions.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("세션 조회 오류:", error);
    console.error("오류 메시지:", error.message);
    console.error("오류 스택:", error.stack);
    
    // 테이블이 없는 경우 빈 배열 반환
    if (error.message && (error.message.includes('no such table') || error.message.includes('does not exist'))) {
      console.log('ℹ️ 테이블이 없음 - 빈 배열 반환');
      return new Response(
        JSON.stringify({
          success: true,
          sessions: [],
          count: 0,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "세션 조회 실패", 
        error: error.message,
        stack: error.stack 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  
  try {
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

    console.log(`💾 세션 저장/업데이트: ${data.id}`);

    // 테이블 생성 (batch 사용)
    try {
      await db.batch([
        db.prepare(`
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
        `)
      ]);
    } catch (createError) {
      console.log('⚠️ 테이블 생성 시도 중 오류 (이미 존재할 수 있음)');
    }

    // 기존 세션 확인
    const checkStmt = db.prepare(`SELECT id FROM chat_sessions WHERE id = ?`).bind(data.id);
    const existingSession = await checkStmt.first();
    
    if (existingSession) {
      // 업데이트
      console.log(`🔄 기존 세션 업데이트: ${data.id}`);
      const updateStmt = db.prepare(`
        UPDATE chat_sessions 
        SET title = ?, lastMessage = ?, botId = ?, updatedAt = datetime('now')
        WHERE id = ?
      `).bind(
        data.title || "새로운 대화",
        data.lastMessage || "",
        data.botId,
        data.id
      );
      
      await updateStmt.run();
      
      return new Response(
        JSON.stringify({ success: true, message: "세션이 업데이트되었습니다", sessionId: data.id }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      // 새로 생성
      console.log(`✨ 새 세션 생성: ${data.id}`);
      const insertStmt = db.prepare(`
        INSERT INTO chat_sessions (id, userId, academyId, botId, title, lastMessage, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        data.id,
        data.userId,
        data.academyId,
        data.botId,
        data.title || "새로운 대화",
        data.lastMessage || ""
      );
      
      await insertStmt.run();

      return new Response(
        JSON.stringify({ success: true, message: "세션이 생성되었습니다", sessionId: data.id }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    console.error("세션 생성/업데이트 오류:", error);
    console.error("오류 스택:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "세션 생성 실패", 
        error: error.message,
        stack: error.stack 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
