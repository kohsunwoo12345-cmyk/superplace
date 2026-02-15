// API: 봇 할당 목록 조회 및 생성
// GET /api/admin/bot-assignments - 목록 조회
// POST /api/admin/bot-assignments - 새 할당 생성

interface Env {
  DB: D1Database;
}

interface BotAssignmentRequest {
  academyId: string;
  botId: string;
  expiresAt?: string | null;
  notes?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    console.log("🔍 bot-assignments GET 요청 시작");
    
    if (!db) {
      console.error("❌ DB 연결 실패");
      return new Response(JSON.stringify({ success: false, message: "DB 연결 실패" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("📋 테이블 생성 확인 중...");
    // bot_assignments 테이블이 없으면 생성
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

    console.log("🔍 할당 목록 조회 중...");
    // 학원명과 봇 정보를 포함한 조인 쿼리
    // academy 대신 academies 테이블명 사용 시도
    const result = await db.prepare(`
      SELECT 
        ba.id,
        ba.academyId,
        COALESCE(a.name, ba.academyId) as academyName,
        ba.botId,
        COALESCE(b.name, '알 수 없는 봇') as botName,
        COALESCE(b.profileIcon, '🤖') as botIcon,
        ba.assignedAt,
        ba.expiresAt,
        ba.isActive,
        ba.notes
      FROM bot_assignments ba
      LEFT JOIN academies a ON ba.academyId = a.id
      LEFT JOIN ai_bots b ON ba.botId = b.id
      ORDER BY ba.createdAt DESC
    `).all();

    console.log(`✅ ${result.results?.length || 0}개의 할당 조회 완료`);

    return new Response(
      JSON.stringify({
        success: true,
        assignments: result.results || [],
        count: result.results?.length || 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ 봇 할당 목록 조회 오류:", error);
    console.error("❌ 오류 상세:", error.message, error.stack);
    return new Response(
      JSON.stringify({
        success: false,
        message: "봇 할당 목록 조회 실패",
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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    console.log("🔍 bot-assignments POST 요청 시작");
    
    if (!db) {
      console.error("❌ DB 연결 실패");
      return new Response(JSON.stringify({ success: false, message: "DB 연결 실패" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 테이블 생성 (없으면)
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

    const data: BotAssignmentRequest = await context.request.json();
    console.log("📥 받은 데이터:", data);
    
    if (!data.academyId || !data.botId) {
      console.error("❌ 필수 필드 누락:", { academyId: data.academyId, botId: data.botId });
      return new Response(
        JSON.stringify({
          success: false,
          message: "학원 ID와 봇 ID는 필수입니다",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 중복 체크
    console.log("🔍 중복 체크 중...");
    const existing = await db
      .prepare("SELECT id FROM bot_assignments WHERE academyId = ? AND botId = ? AND isActive = 1")
      .bind(data.academyId, data.botId)
      .first();

    if (existing) {
      console.log("⚠️ 이미 존재하는 할당:", existing);
      return new Response(
        JSON.stringify({
          success: false,
          message: "이미 해당 학원에 이 봇이 할당되어 있습니다",
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 새 할당 생성
    console.log("💾 새 할당 생성 중...");
    const result = await db
      .prepare(`
        INSERT INTO bot_assignments (academyId, botId, expiresAt, notes, isActive)
        VALUES (?, ?, ?, ?, 1)
      `)
      .bind(
        data.academyId,
        data.botId,
        data.expiresAt || null,
        data.notes || null
      )
      .run();

    console.log("✅ 할당 생성 완료:", result.meta.last_row_id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "봇이 할당되었습니다",
        assignmentId: result.meta.last_row_id,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ 봇 할당 생성 오류:", error);
    console.error("❌ 오류 상세:", error.message, error.stack);
    return new Response(
      JSON.stringify({
        success: false,
        message: "봇 할당 실패",
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
