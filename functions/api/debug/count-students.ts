// Direct student count API - no auth required for debugging
interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  try {
    const { DB } = context.env;
    
    // 1. 전체 User 수
    const totalUsers = await DB.prepare(`
      SELECT COUNT(*) as count FROM User
    `).first();
    
    // 2. 학생 수 (대소문자 무관)
    const totalStudents = await DB.prepare(`
      SELECT COUNT(*) as count FROM User WHERE UPPER(role) = 'STUDENT'
    `).first();
    
    // 3. 활성 학생 수
    const activeStudents = await DB.prepare(`
      SELECT COUNT(*) as count FROM User 
      WHERE UPPER(role) = 'STUDENT' 
        AND (status IS NULL OR status = 'ACTIVE')
    `).first();
    
    // 4. 실제 학생 목록 (최대 10명)
    const students = await DB.prepare(`
      SELECT id, name, email, role, academyId, status
      FROM User 
      WHERE UPPER(role) = 'STUDENT'
      LIMIT 10
    `).all();
    
    // 5. 학원별 학생 수
    const byAcademy = await DB.prepare(`
      SELECT academyId, COUNT(*) as count
      FROM User 
      WHERE UPPER(role) = 'STUDENT'
      GROUP BY academyId
    `).all();
    
    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      counts: {
        totalUsers: totalUsers?.count || 0,
        totalStudents: totalStudents?.count || 0,
        activeStudents: activeStudents?.count || 0
      },
      students: students.results || [],
      byAcademy: byAcademy.results || []
    }, null, 2), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
