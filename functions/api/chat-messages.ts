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

// chat_messages 테이블 마이그레이션
async function migrateChatMessagesTable(db: D1Database): Promise<void> {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        sessionId TEXT NOT NULL,
        userId TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        imageUrl TEXT,
        audioUrl TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
  } catch (e) {
    console.log('ℹ️ chat_messages 테이블 이미 존재');
  }
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
    const sessionId = url.searchParams.get("sessionId");
    const userId = url.searchParams.get("userId");

    if (!sessionId) {
      return new Response(
        JSON.stringify({ success: false, message: "sessionId가 필요합니다" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`📖 메시지 조회: sessionId=${sessionId}`);

    // 테이블 마이그레이션
    await migrateChatMessagesTable(db);

    // userId가 제공된 경우, 세션 소유자 확인
    if (userId) {
      try {
        const checkStmt = db.prepare(`SELECT userId FROM chat_sessions WHERE id = ?`).bind(sessionId);
        const sessionCheck = await checkStmt.first();
        
        if (sessionCheck && sessionCheck.userId !== userId) {
          console.error(`⚠️ 권한 없음: 사용자 ${userId}가 세션 ${sessionId} 접근 시도`);
          return new Response(
            JSON.stringify({ success: false, message: "권한이 없습니다" }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
      } catch (sessionErr: any) {
        console.warn('⚠️ 세션 권한 확인 실패 (계속 진행):', sessionErr.message);
      }
    }

    // 메시지 조회
    const selectStmt = db.prepare(`
      SELECT * FROM chat_messages 
      WHERE sessionId = ? 
      ORDER BY createdAt ASC
    `).bind(sessionId);
    
    const queryResult = await selectStmt.all();
    const messages = queryResult?.results || [];
    
    console.log(`✅ ${messages.length}개 메시지 찾음`);

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
    console.error("오류 스택:", error.stack);
    
    // 테이블이 없는 경우 빈 배열 반환
    if (error.message && (error.message.includes('no such table') || error.message.includes('does not exist'))) {
      console.log('ℹ️ 테이블이 없음 - 빈 배열 반환');
      return new Response(
        JSON.stringify({
          success: true,
          messages: [],
          count: 0,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "메시지 조회 실패", 
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

    const data: Partial<ChatMessage> = await context.request.json();

    if (!data.id || !data.sessionId || !data.userId || !data.role || !data.content) {
      return new Response(
        JSON.stringify({ success: false, message: "필수 필드가 누락되었습니다" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`💾 메시지 저장: ${data.id}`);

    // 테이블 마이그레이션
    await migrateChatMessagesTable(db);

    // 메시지 저장
    const insertStmt = db.prepare(`
      INSERT INTO chat_messages (id, sessionId, userId, role, content, imageUrl, audioUrl, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      data.id,
      data.sessionId,
      data.userId,
      data.role,
      data.content,
      data.imageUrl || null,
      data.audioUrl || null
    );
    
    await insertStmt.run();

    // 세션의 lastMessage 업데이트 (botId 컬럼 에러 방어)
    try {
      const updateStmt = db.prepare(`
        UPDATE chat_sessions 
        SET lastMessage = ?, updatedAt = datetime('now')
        WHERE id = ?
      `).bind(data.content.substring(0, 100), data.sessionId);
      
      await updateStmt.run();
    } catch (updateErr: any) {
      console.warn('⚠️ chat_sessions lastMessage 업데이트 실패 (무시):', updateErr.message);
    }

    return new Response(
      JSON.stringify({ success: true, message: "메시지가 저장되었습니다" }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("메시지 저장 오류:", error);
    console.error("오류 스택:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "메시지 저장 실패", 
        error: error.message,
        stack: error.stack 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
