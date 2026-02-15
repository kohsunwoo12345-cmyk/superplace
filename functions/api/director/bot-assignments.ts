interface Env {
  DB: D1Database;
}

function getKoreanTime(): string {
  const now = new Date();
  const kstOffset = 9 * 60;
  const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
  
  const year = kstTime.getFullYear();
  const month = String(kstTime.getMonth() + 1).padStart(2, '0');
  const day = String(kstTime.getDate()).padStart(2, '0');
  const hours = String(kstTime.getHours()).padStart(2, '0');
  const minutes = String(kstTime.getMinutes()).padStart(2, '0');
  const seconds = String(kstTime.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// GET: 학원장의 봇 할당 목록 조회
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // director_bot_assignments 테이블에서 할당 목록 조회
    const assignmentsResult = await DB.prepare(`
      SELECT 
        id,
        bot_id as botId,
        user_id as userId,
        user_role as userRole,
        assigned_at as assignedAt,
        expires_at as expiresAt,
        created_by as createdBy
      FROM director_bot_assignments
      ORDER BY assigned_at DESC
    `).all();

    const assignments = assignmentsResult.results || [];
    
    // 각 할당에 대한 봇과 사용자 정보 조회
    const enrichedAssignments = await Promise.all(
      assignments.map(async (assignment: any) => {
        // 봇 정보 조회
        let botInfo = null;
        try {
          botInfo = await DB.prepare(`
            SELECT name, profileIcon
            FROM ai_bots
            WHERE id = ?
          `).bind(assignment.botId).first();
        } catch (e) {
          console.error('Failed to fetch bot info:', e);
        }

        // 사용자 정보 조회
        let userInfo = null;
        try {
          userInfo = await DB.prepare(`
            SELECT name, email
            FROM users
            WHERE id = ?
          `).bind(assignment.userId).first();
        } catch (e) {
          console.error('Failed to fetch user info:', e);
        }

        // 만료 여부 체크
        const now = new Date();
        const expiresAt = assignment.expiresAt ? new Date(assignment.expiresAt) : null;
        const isExpired = expiresAt && expiresAt < now;

        return {
          id: assignment.id,
          botId: assignment.botId,
          botName: botInfo?.name || 'Unknown Bot',
          botIcon: botInfo?.profileIcon || '🤖',
          userId: assignment.userId,
          userName: userInfo?.name || 'Unknown User',
          userEmail: userInfo?.email || '',
          userRole: assignment.userRole,
          assignedAt: assignment.assignedAt,
          expiresAt: assignment.expiresAt,
          status: isExpired ? 'EXPIRED' : 'ACTIVE'
        };
      })
    );

    return new Response(
      JSON.stringify({
        success: true,
        assignments: enrichedAssignments
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Failed to fetch assignments:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch assignments",
        message: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// POST: 새 봇 할당
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const body: any = await context.request.json();
    const { botId, userId, userRole, expiresAt } = body;

    console.log('➕ Director bot assignment request:', { botId, userId, userRole, expiresAt });

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!botId || !userId || !userRole) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: botId, userId, userRole" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const koreanTime = getKoreanTime();

    // director_bot_assignments 테이블 생성 (없으면)
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS director_bot_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bot_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        user_role TEXT NOT NULL,
        assigned_at TEXT NOT NULL,
        expires_at TEXT,
        created_by INTEGER,
        created_at TEXT NOT NULL,
        FOREIGN KEY (bot_id) REFERENCES ai_bots(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `).run();

    // 할당 생성
    const result = await DB.prepare(`
      INSERT INTO director_bot_assignments 
        (bot_id, user_id, user_role, assigned_at, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      botId,
      userId,
      userRole,
      koreanTime,
      expiresAt || null,
      koreanTime
    ).run();

    const assignmentId = result.meta.last_row_id;
    console.log('✅ Director bot assignment created:', assignmentId);

    return new Response(
      JSON.stringify({
        success: true,
        assignmentId,
        message: "봇이 할당되었습니다"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Failed to create assignment:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to create assignment",
        message: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
