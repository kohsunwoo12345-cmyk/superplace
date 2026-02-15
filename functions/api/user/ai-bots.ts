// API: 사용자별 할당된 AI 봇 조회
// GET /api/user/ai-bots?academyId=xxx

interface Env {
  DB: D1Database;
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

    // URL에서 academyId 가져오기
    const url = new URL(context.request.url);
    const academyId = url.searchParams.get("academyId");

    if (!academyId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "academyId가 필요합니다",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`🔍 사용자 봇 조회 - academyId: ${academyId}`);

    // bot_assignments 테이블 생성 (없으면)
    console.log("📋 테이블 생성 확인 중...");
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS bot_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        academyId TEXT NOT NULL,
        botId TEXT NOT NULL,
        assignedBy TEXT,
        assignedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        expiresAt DATETIME,
        isActive INTEGER DEFAULT 1,
        notes TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    console.log("✅ 테이블 생성/확인 완료");

    // 할당된 봇 ID 조회
    console.log(`🔍 academyId ${academyId}에 할당된 봇 ID 조회 중...`);
    
    // 현재 시간 확인
    const nowQuery = await db.prepare("SELECT datetime('now') as currentTime").first();
    console.log(`⏰ 현재 서버 시간: ${nowQuery?.currentTime}`);
    
    // 모든 할당 조회 (만료 체크 전)
    const allAssignments = await db.prepare(`
      SELECT botId, expiresAt, isActive,
             CASE 
               WHEN expiresAt IS NULL THEN 'NO_EXPIRY'
               WHEN datetime(expiresAt) > datetime('now') THEN 'VALID'
               ELSE 'EXPIRED'
             END as status
      FROM bot_assignments
      WHERE academyId = ?
    `).bind(academyId).all();
    
    console.log(`📊 전체 할당 ${allAssignments.results?.length || 0}개 (만료 체크 전)`);
    if (allAssignments.results && allAssignments.results.length > 0) {
      allAssignments.results.forEach((a: any) => {
        console.log(`  - botId: ${a.botId}, expiresAt: ${a.expiresAt}, isActive: ${a.isActive}, status: ${a.status}`);
      });
    }
    
    const assignments = await db.prepare(`
      SELECT botId, expiresAt
      FROM bot_assignments
      WHERE academyId = ?
        AND isActive = 1
        AND (expiresAt IS NULL OR datetime(expiresAt) > datetime('now'))
    `).bind(academyId).all();

    console.log(`📊 유효한 할당 ${assignments.results?.length || 0}개 (만료 체크 후)`);
    if (assignments.results && assignments.results.length > 0) {
      console.log("📊 유효한 할당 목록:", assignments.results);
    }

    if (!assignments.results || assignments.results.length === 0) {
      console.log("⚠️ 할당된 봇이 없습니다");
      return new Response(
        JSON.stringify({
          success: true,
          bots: [],
          count: 0,
          message: "할당된 봇이 없습니다",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 각 봇 정보 조회
    const bots = [];
    for (const assignment of assignments.results) {
      try {
        const bot = await db.prepare(`
          SELECT 
            id, name, description, systemPrompt, welcomeMessage,
            starterMessage1, starterMessage2, starterMessage3,
            profileIcon, profileImage, model, temperature,
            maxTokens, topK, topP, language, isActive
          FROM ai_bots
          WHERE id = ? AND isActive = 1
        `).bind(assignment.botId).first();

        if (bot) {
          bots.push({
            ...bot,
            expiresAt: assignment.expiresAt,
          });
          console.log(`✅ 봇 정보 조회 성공: ${bot.name} (${bot.id})`);
        } else {
          console.warn(`⚠️ 봇을 찾을 수 없음: ${assignment.botId}`);
        }
      } catch (error) {
        console.error(`❌ 봇 정보 조회 실패: ${assignment.botId}`, error);
      }
    }

    console.log(`✅ 최종 반환할 봇 ${bots.length}개`);

    return new Response(
      JSON.stringify({
        success: true,
        bots: bots,
        count: bots.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("사용자 봇 조회 오류:", error);
    console.error("오류 스택:", error.stack);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: "봇 조회 실패",
        error: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
