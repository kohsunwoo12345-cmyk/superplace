// Test API for students list
interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  try {
    const { DB } = context.env;
    
    // 1. 모든 학생 조회 (필터 없이)
    const allStudents = await DB.prepare(`
      SELECT id, name, email, role, academyId, status 
      FROM User 
      WHERE UPPER(role) = 'STUDENT'
      LIMIT 20
    `).all();
    
    // 2. 활성 학생만
    const activeStudents = await DB.prepare(`
      SELECT id, name, email, role, academyId, status 
      FROM User 
      WHERE UPPER(role) = 'STUDENT' 
        AND (status IS NULL OR status = 'ACTIVE')
      LIMIT 20
    `).all();
    
    // 3. 학원별 그룹
    const byAcademy = await DB.prepare(`
      SELECT academyId, COUNT(*) as count, GROUP_CONCAT(name) as names
      FROM User 
      WHERE UPPER(role) = 'STUDENT' 
        AND (status IS NULL OR status = 'ACTIVE')
      GROUP BY academyId
    `).all();
    
    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      totalStudents: allStudents.results?.length || 0,
      activeStudents: activeStudents.results?.length || 0,
      allStudentsList: allStudents.results || [],
      activeStudentsList: activeStudents.results || [],
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
