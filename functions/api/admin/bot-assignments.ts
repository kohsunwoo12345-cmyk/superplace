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
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: "DB 연결 실패" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 관리자 권한 체크는 프론트엔드에서 수행
    // 백엔드에서도 추가 검증 가능

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

    // 🆕 user_bot_assignments 테이블 생성 (학원장 개인 할당용)
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS user_bot_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        botId TEXT NOT NULL,
        assignedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        expiresAt DATETIME,
        isActive INTEGER DEFAULT 1,
        notes TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // 학원명과 봇 정보를 포함한 조인 쿼리
    const result = await db.prepare(`
      SELECT 
        ba.id,
        ba.academyId,
        a.name as academyName,
        ba.botId,
        b.name as botName,
        b.profileIcon as botIcon,
        ba.assignedAt,
        ba.expiresAt,
        ba.isActive,
        ba.notes,
        'ACADEMY' as assignmentType
      FROM bot_assignments ba
      LEFT JOIN academy a ON ba.academyId = a.id
      LEFT JOIN ai_bots b ON ba.botId = b.id
      ORDER BY ba.createdAt DESC
    `).all();

    // 🆕 학원장 개인 할당 목록도 조회 (통합 표시용)
    const userAssignmentsResult = await db.prepare(`
      SELECT 
        uba.id,
        uba.userId,
        u.name as userName,
        u.academyId,
        a.name as academyName,
        uba.botId,
        b.name as botName,
        b.profileIcon as botIcon,
        COALESCE(uba.assignedAt, uba.createdAt) as assignedAt,
        uba.expiresAt,
        uba.isActive,
        uba.notes,
        'USER' as assignmentType
      FROM user_bot_assignments uba
      LEFT JOIN users u ON uba.userId = u.id
      LEFT JOIN academy a ON u.academyId = a.id
      LEFT JOIN ai_bots b ON uba.botId = b.id
      WHERE u.role = 'DIRECTOR'
      ORDER BY uba.createdAt DESC
    `).all();

    // 두 목록 병합
    const allAssignments = [
      ...(result.results || []),
      ...(userAssignmentsResult.results || [])
    ];

    return new Response(
      JSON.stringify({
        success: true,
        assignments: allAssignments,
        academyAssignments: result.results || [],
        directorAssignments: userAssignmentsResult.results || [],
        count: allAssignments.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("봇 할당 목록 조회 오류:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "봇 할당 목록 조회 실패",
        error: error.message,
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
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: "DB 연결 실패" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data: BotAssignmentRequest = await context.request.json();
    
    if (!data.academyId || !data.botId) {
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
    const existing = await db
      .prepare("SELECT id FROM bot_assignments WHERE academyId = ? AND botId = ? AND isActive = 1")
      .bind(data.academyId, data.botId)
      .first();

    if (existing) {
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

    // 🆕 해당 학원의 학원장에게도 자동으로 봇 할당
    try {
      // 학원에 소속된 학원장(DIRECTOR) 찾기
      const directorResult = await db
        .prepare(`
          SELECT u.id as userId
          FROM users u
          WHERE u.academyId = ? AND u.role = 'DIRECTOR'
        `)
        .bind(data.academyId)
        .all();

      const directors = directorResult.results || [];

      // 각 학원장에게 개인 봇 할당 생성
      for (const director of directors) {
        await db
          .prepare(`
            INSERT INTO user_bot_assignments (userId, botId, expiresAt, isActive, notes)
            VALUES (?, ?, ?, 1, ?)
          `)
          .bind(
            director.userId,
            data.botId,
            data.expiresAt || null,
            data.notes ? `[학원 자동할당] ${data.notes}` : '[학원 자동할당]'
          )
          .run();
      }

      console.log(`✅ 학원 ${data.academyId}의 학원장 ${directors.length}명에게 봇 ${data.botId} 자동 할당 완료`);
    } catch (directorError) {
      console.error("⚠️ 학원장 자동 할당 실패 (학원 할당은 성공):", directorError);
      // 학원 할당은 성공했으므로 에러를 던지지 않음
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "봇이 학원 및 학원장에게 할당되었습니다",
        assignmentId: result.meta.last_row_id,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("봇 할당 생성 오류:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "봇 할당 실패",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
