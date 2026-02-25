// DEBUG API: User 테이블 직접 조회
// GET /api/debug/check-user-table?id=<student_id>

export async function onRequestGet(context) {
  const { request, env } = context;
  const { DB } = env;

  if (!DB) {
    return Response.json({ error: "DB not configured" }, { status: 500 });
  }

  try {
    const url = new URL(request.url);
    const studentId = url.searchParams.get('id');

    if (!studentId) {
      return Response.json({ error: "id parameter required" }, { status: 400 });
    }

    // User 테이블 직접 조회 (조건 없이)
    const userRecord = await DB.prepare(`
      SELECT * FROM User WHERE id = ?
    `).bind(studentId).first();

    // users 테이블도 조회
    const usersRecord = await DB.prepare(`
      SELECT * FROM users WHERE id = ?
    `).bind(studentId).first();

    // 최근 5개 학생 조회 (비교용)
    const recentStudents = await DB.prepare(`
      SELECT id, name, role, academyId, createdAt 
      FROM User 
      WHERE role = 'STUDENT' 
      ORDER BY createdAt DESC 
      LIMIT 5
    `).all();

    return Response.json({
      success: true,
      requestedId: studentId,
      foundInUser: userRecord ? true : false,
      foundInUsers: usersRecord ? true : false,
      userTableRecord: userRecord,
      usersTableRecord: usersRecord,
      recentStudentsInUserTable: recentStudents.results || []
    }, { status: 200 });

  } catch (error) {
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
