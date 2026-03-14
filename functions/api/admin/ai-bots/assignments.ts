interface Env {
  DB: D1Database;
}

// Simple token parser
function parseToken(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  const parts = token.split('|');
  
  if (parts.length < 3) {
    return null;
  }
  
  return {
    id: parts[0],
    email: parts[1],
    role: parts[2]
  };
}

/**
 * GET /api/admin/ai-bots/assignments
 * AI 봇 할당 목록 조회
 */
export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const { DB } = env;

  if (!DB) {
    return new Response(
      JSON.stringify({ success: false, error: "Database not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    console.log("📋 AI 봇 할당 목록 조회");

    // Parse token
    const authHeader = request.headers.get('Authorization');
    const tokenData = parseToken(authHeader);

    if (!tokenData) {
      console.error('❌ Invalid or missing token');
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user from database
    const user = await DB
      .prepare('SELECT id, email, role, academyId FROM users WHERE email = ?')
      .bind(tokenData.email)
      .first() as any;

    if (!user) {
      console.error('❌ User not found');
      return new Response(JSON.stringify({
        success: false,
        error: 'User not found'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const role = user.role ? user.role.toUpperCase() : '';
    const userAcademyId = user.academyId;

    console.log('✅ User verified:', { email: user.email, role, academyId: userAcademyId });

    // 테이블 존재 확인 및 생성
    try {
      await DB.prepare(`
        CREATE TABLE IF NOT EXISTS ai_bot_assignments (
          id TEXT PRIMARY KEY,
          botId TEXT NOT NULL,
          botName TEXT NOT NULL,
          userId TEXT NOT NULL,
          userName TEXT NOT NULL,
          userEmail TEXT NOT NULL,
          userAcademyId TEXT,
          startDate TEXT NOT NULL,
          endDate TEXT NOT NULL,
          duration INTEGER NOT NULL,
          durationUnit TEXT NOT NULL,
          status TEXT DEFAULT 'active',
          createdAt TEXT DEFAULT (datetime('now'))
        )
      `).run();
    } catch (createError: any) {
      console.warn("⚠️ 테이블 생성 경고:", createError.message);
    }

    // 할당 목록 조회 - DIRECTOR/TEACHER는 자신의 학원만
    let query = '';
    let queryParams: any[] = [];
    
    if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
      query = `
        SELECT 
          id,
          botId,
          botName,
          userId,
          userName,
          userEmail,
          userAcademyId,
          startDate,
          endDate,
          duration,
          durationUnit,
          status,
          createdAt
        FROM ai_bot_assignments
        ORDER BY createdAt DESC
        LIMIT 100
      `;
    } else if (role === 'DIRECTOR' || role === 'TEACHER') {
      if (!userAcademyId) {
        console.error('❌ Director/Teacher has no academy assigned');
        return new Response(JSON.stringify({
          success: false,
          error: 'No academy assigned',
          message: '학원이 배정되지 않았습니다'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      query = `
        SELECT 
          id,
          botId,
          botName,
          userId,
          userName,
          userEmail,
          userAcademyId,
          startDate,
          endDate,
          duration,
          durationUnit,
          status,
          createdAt
        FROM ai_bot_assignments
        WHERE userAcademyId = ?
        ORDER BY createdAt DESC
        LIMIT 100
      `;
      queryParams = [userAcademyId];
    } else {
      console.error('❌ Insufficient permissions:', role);
      return new Response(JSON.stringify({
        success: false,
        error: 'Insufficient permissions',
        message: '권한이 없습니다'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = queryParams.length > 0 
      ? await DB.prepare(query).bind(...queryParams).all()
      : await DB.prepare(query).all();

    const assignments = result.results || [];
    
    // 만료된 할당 상태 업데이트
    const now = new Date();
    const kstOffset = 9 * 60;
    const kstNow = new Date(now.getTime() + kstOffset * 60 * 1000);
    const today = kstNow.toISOString().split('T')[0];

    for (const assignment of assignments as any[]) {
      if (assignment.status === 'active' && assignment.endDate < today) {
        await DB.prepare(`
          UPDATE ai_bot_assignments
          SET status = 'expired'
          WHERE id = ?
        `).bind(assignment.id).run();
        
        assignment.status = 'expired';
      }
    }

    console.log(`✅ ${assignments.length}개의 할당 조회 완료`);

    return new Response(
      JSON.stringify({
        success: true,
        assignments,
        count: assignments.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ 할당 목록 조회 오류:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "할당 목록 조회 중 오류가 발생했습니다",
        assignments: [],
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * DELETE /api/admin/ai-bots/assignments/{assignmentId}
 * AI 봇 할당 취소
 */
export const onRequestDelete = async (context: { request: Request; env: Env; params: any }) => {
  const { request, env, params } = context;
  const { DB } = env;

  if (!DB) {
    return new Response(
      JSON.stringify({ success: false, error: "Database not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const assignmentId = params.assignmentId;

    if (!assignmentId) {
      return new Response(
        JSON.stringify({ success: false, error: "할당 ID가 필요합니다" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("❌ AI 봇 할당 취소:", assignmentId);

    // 할당 삭제
    await DB.prepare(`
      DELETE FROM ai_bot_assignments
      WHERE id = ?
    `).bind(assignmentId).run();

    console.log("✅ 할당 취소 완료");

    return new Response(
      JSON.stringify({
        success: true,
        message: "할당이 취소되었습니다",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ 할당 취소 오류:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "할당 취소 중 오류가 발생했습니다",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
