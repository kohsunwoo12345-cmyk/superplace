interface Env {
  DB: D1Database;
}

/**
 * POST /api/admin/ai-bots/assign
 * AI 봇을 사용자에게 할당
 */
export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const { DB } = env;

  if (!DB) {
    return new Response(
      JSON.stringify({ success: false, error: "Database not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await request.json();
    const { botId, userId, duration, durationUnit } = body;

    if (!botId || !userId || !duration || !durationUnit) {
      return new Response(
        JSON.stringify({ success: false, error: "필수 필드가 누락되었습니다" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("🤖 AI 봇 할당 요청:", { botId, userId, duration, durationUnit });

    // 사용자 확인
    const user = await DB.prepare("SELECT * FROM users WHERE id = ?")
      .bind(userId)
      .first();

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: "사용자를 찾을 수 없습니다" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // AI 봇 확인
    const bot = await DB.prepare("SELECT * FROM ai_bots WHERE id = ?")
      .bind(botId)
      .first();

    if (!bot) {
      return new Response(
        JSON.stringify({ success: false, error: "AI 봇을 찾을 수 없습니다" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 시작일 및 종료일 계산 (한국 시간 KST)
    const now = new Date();
    const kstOffset = 9 * 60; // KST = UTC+9
    const kstNow = new Date(now.getTime() + kstOffset * 60 * 1000);
    const startDate = kstNow.toISOString().split('T')[0];

    let endDate: Date;
    if (durationUnit === "day") {
      endDate = new Date(kstNow.getTime() + duration * 24 * 60 * 60 * 1000);
    } else if (durationUnit === "month") {
      endDate = new Date(kstNow);
      endDate.setMonth(endDate.getMonth() + duration);
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "잘못된 기간 단위입니다" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const endDateStr = endDate.toISOString().split('T')[0];

    // 할당 테이블 생성 (없으면)
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS ai_bot_assignments (
        id TEXT PRIMARY KEY,
        botId TEXT NOT NULL,
        botName TEXT NOT NULL,
        userId INTEGER NOT NULL,
        userName TEXT NOT NULL,
        userEmail TEXT NOT NULL,
        startDate TEXT NOT NULL,
        endDate TEXT NOT NULL,
        duration INTEGER NOT NULL,
        durationUnit TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        createdAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (botId) REFERENCES ai_bots(id),
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `).run();

    // 할당 ID 생성
    const assignmentId = `assignment-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // 할당 저장
    await DB.prepare(`
      INSERT INTO ai_bot_assignments 
      (id, botId, botName, userId, userName, userEmail, startDate, endDate, duration, durationUnit, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `).bind(
      assignmentId,
      botId,
      bot.name as string,
      userId,
      user.name as string,
      user.email as string,
      startDate,
      endDateStr,
      duration,
      durationUnit
    ).run();

    console.log("✅ AI 봇 할당 완료:", assignmentId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "AI 봇이 성공적으로 할당되었습니다",
        assignment: {
          id: assignmentId,
          botId,
          botName: bot.name,
          userId,
          userName: user.name,
          userEmail: user.email,
          startDate,
          endDate: endDateStr,
          duration,
          durationUnit,
          status: "active",
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ AI 봇 할당 오류:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "AI 봇 할당 중 오류가 발생했습니다",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
