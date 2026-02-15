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
    
    // 먼저 전체 데이터 확인
    const allData = await db.prepare("SELECT * FROM bot_assignments").all();
    console.log("📊 bot_assignments 테이블 전체 데이터:", allData.results?.length, "개");
    if (allData.results && allData.results.length > 0) {
      console.log("📊 첫 번째 데이터:", allData.results[0]);
    }
    
    // 기본 쿼리 (JOIN 없이)
    const basicResult = await db.prepare(`
      SELECT 
        id,
        academyId,
        botId,
        assignedAt,
        expiresAt,
        isActive,
        notes
      FROM bot_assignments
      ORDER BY createdAt DESC
    `).all();

    console.log(`✅ 기본 쿼리 결과: ${basicResult.results?.length || 0}개`);

    // 각 할당에 대해 학원명과 봇 정보를 추가
    const assignments = await Promise.all(
      (basicResult.results || []).map(async (assignment: any) => {
        // 학원명 조회 (academy 또는 academies 테이블)
        let academyName = assignment.academyId;
        try {
          const academy = await db
            .prepare("SELECT name FROM academy WHERE id = ?")
            .bind(assignment.academyId)
            .first();
          if (academy) academyName = academy.name as string;
        } catch (e) {
          try {
            const academy = await db
              .prepare("SELECT name FROM academies WHERE id = ?")
              .bind(assignment.academyId)
              .first();
            if (academy) academyName = academy.name as string;
          } catch (e2) {
            console.log("⚠️ 학원 정보 조회 실패:", assignment.academyId);
          }
        }

        // 봇 정보 조회
        let botName = "알 수 없는 봇";
        let botIcon = "🤖";
        try {
          const bot = await db
            .prepare("SELECT name, profileIcon FROM ai_bots WHERE id = ?")
            .bind(assignment.botId)
            .first();
          if (bot) {
            botName = bot.name as string;
            botIcon = bot.profileIcon as string;
          }
        } catch (e) {
          console.log("⚠️ 봇 정보 조회 실패:", assignment.botId);
        }

        return {
          ...assignment,
          academyName,
          botName,
          botIcon,
        };
      })
    );

    console.log(`✅ 최종 할당 목록: ${assignments.length}개`);

    return new Response(
      JSON.stringify({
        success: true,
        assignments: assignments,
        count: assignments.length,
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
    console.log("📊 INSERT 결과 메타:", result.meta);

    // 생성된 데이터 확인
    const inserted = await db
      .prepare("SELECT * FROM bot_assignments WHERE id = ?")
      .bind(result.meta.last_row_id)
      .first();
    
    console.log("🔍 삽입 확인:", inserted);

    if (!inserted) {
      console.error("❌ 삽입된 데이터를 찾을 수 없음!");
      return new Response(
        JSON.stringify({
          success: false,
          message: "데이터 삽입 확인 실패",
          error: "INSERT는 성공했으나 데이터를 찾을 수 없습니다",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 전체 할당 목록 조회 (디버깅)
    const allAssignments = await db.prepare("SELECT * FROM bot_assignments").all();
    console.log("📋 전체 할당 목록 수:", allAssignments.results?.length);

    return new Response(
      JSON.stringify({
        success: true,
        message: "봇이 할당되었습니다",
        assignmentId: result.meta.last_row_id,
        inserted: inserted,
        totalAssignments: allAssignments.results?.length || 0,
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
