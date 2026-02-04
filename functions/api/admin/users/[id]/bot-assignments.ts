interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const userId = context.params.id as string;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 봇 할당 테이블 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS user_bot_assignments (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        botId TEXT NOT NULL,
        startDate TEXT NOT NULL,
        endDate TEXT NOT NULL,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (botId) REFERENCES ai_bots(id)
      )
    `).run();

    // 봇 할당 정보 조회 (봇 이름 포함)
    const assignmentsResult = await DB.prepare(
      `SELECT 
        a.id, a.userId, a.botId, a.startDate, a.endDate, a.isActive,
        b.name as botName
       FROM user_bot_assignments a
       LEFT JOIN ai_bots b ON a.botId = b.id
       WHERE a.userId = ?
       ORDER BY datetime(a.createdAt) DESC`
    ).bind(userId).all();

    const assignments = assignmentsResult?.results || [];

    // 만료된 할당 자동 비활성화
    const now = new Date().toISOString().split('T')[0];
    for (const assignment of assignments as any[]) {
      if (assignment.isActive && assignment.endDate < now) {
        await DB.prepare(`
          UPDATE user_bot_assignments 
          SET isActive = 0 
          WHERE id = ?
        `).bind(assignment.id).run();
        assignment.isActive = 0;
      }
    }

    return new Response(JSON.stringify({ assignments }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Bot assignments error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch bot assignments",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// 봇 할당 추가/수정
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const userId = context.params.id as string;
    const body = await context.request.json() as any;

    const { botId, startDate, endDate } = body;

    if (!botId || !startDate || !endDate) {
      return new Response(
        JSON.stringify({ error: "botId, startDate, and endDate are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 봇 할당 테이블 생성 (없을 경우)
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS user_bot_assignments (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        botId TEXT NOT NULL,
        startDate TEXT NOT NULL,
        endDate TEXT NOT NULL,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT DEFAULT (datetime('now'))
      )
    `).run();

    // 새 할당 ID 생성
    const assignmentId = `assignment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 봇 할당 추가
    await DB.prepare(`
      INSERT INTO user_bot_assignments (id, userId, botId, startDate, endDate, isActive)
      VALUES (?, ?, ?, ?, ?, 1)
    `).bind(assignmentId, userId, botId, startDate, endDate).run();

    return new Response(
      JSON.stringify({
        success: true,
        assignmentId,
        message: "Bot assignment created successfully",
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Bot assignment creation error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to create bot assignment",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// 봇 할당 삭제
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const userId = context.params.id as string;
    const url = new URL(context.request.url);
    const assignmentId = url.searchParams.get("assignmentId");

    if (!assignmentId) {
      return new Response(
        JSON.stringify({ error: "assignmentId is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    await DB.prepare(`
      DELETE FROM user_bot_assignments
      WHERE id = ? AND userId = ?
    `).bind(assignmentId, userId).run();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Bot assignment deleted successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Bot assignment deletion error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to delete bot assignment",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
