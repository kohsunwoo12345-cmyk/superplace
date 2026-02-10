interface Env {
  DB: D1Database;
}

/**
 * GET /api/admin/activate-all-codes
 * 모든 출석 코드를 강제로 활성화 (isActive = 1)
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('🔧 Activating all attendance codes...');

    // 1. 현재 상태 확인
    const beforeStats = await DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN isActive = 1 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN isActive != 1 THEN 1 ELSE 0 END) as inactive
      FROM student_attendance_codes
    `).first();

    console.log('📊 Before activation:', beforeStats);

    // 2. 모든 코드 활성화
    const updateResult = await DB.prepare(`
      UPDATE student_attendance_codes 
      SET isActive = 1
      WHERE isActive != 1 OR isActive IS NULL
    `).run();

    console.log('✅ Update result:', updateResult);

    // 3. 업데이트 후 상태 확인
    const afterStats = await DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN isActive = 1 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN isActive != 1 THEN 1 ELSE 0 END) as inactive
      FROM student_attendance_codes
    `).first();

    console.log('📊 After activation:', afterStats);

    // 4. 모든 코드 목록 조회
    const allCodes = await DB.prepare(`
      SELECT 
        sac.id,
        sac.userId,
        sac.code,
        sac.isActive,
        u.name,
        u.email
      FROM student_attendance_codes sac
      JOIN users u ON sac.userId = u.id
      WHERE u.role = 'STUDENT'
      ORDER BY u.name
    `).all();

    return new Response(
      JSON.stringify({
        success: true,
        message: '모든 출석 코드가 활성화되었습니다',
        stats: {
          before: beforeStats,
          after: afterStats,
          updated: updateResult.meta?.changes || 0,
        },
        codes: allCodes.results.map((c: any) => ({
          userId: c.userId,
          name: c.name,
          email: c.email,
          code: c.code,
          isActive: c.isActive,
        })),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Activation error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to activate codes",
        message: error.message,
        stack: error.stack,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
