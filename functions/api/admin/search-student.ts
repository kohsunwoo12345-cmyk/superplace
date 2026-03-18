/**
 * Search for students by name
 */

interface Env {
  DB: D1Database;
}

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
    const url = new URL(request.url);
    const name = url.searchParams.get('name');

    if (!name) {
      return new Response(
        JSON.stringify({ success: false, error: "Name parameter required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('🔍 Searching for student with name:', name);

    // Search for students by name (LIKE query)
    const students = await DB.prepare(`
      SELECT 
        id, 
        name, 
        email, 
        phone,
        role,
        academyId,
        academy_id,
        grade,
        school,
        student_code,
        created_at as createdAt,
        isWithdrawn
      FROM users 
      WHERE name LIKE ? 
      AND role = 'STUDENT'
      ORDER BY id
    `).bind(`%${name}%`).all();

    console.log(`✅ Found ${students.results?.length || 0} students`);

    // For each student, get their attendance code
    const studentsWithCodes = await Promise.all(
      (students.results || []).map(async (student: any) => {
        try {
          const code = await DB.prepare(`
            SELECT code, isActive 
            FROM student_attendance_codes 
            WHERE userId = ? AND isActive = 1
            ORDER BY createdAt DESC
            LIMIT 1
          `).bind(student.id).first();

          return {
            ...student,
            attendanceCode: code?.code || null,
            hasActiveCode: !!code
          };
        } catch (error) {
          return {
            ...student,
            attendanceCode: null,
            hasActiveCode: false
          };
        }
      })
    );

    return new Response(
      JSON.stringify({ 
        success: true, 
        students: studentsWithCodes,
        count: studentsWithCodes.length
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('❌ Search error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Search failed",
        stack: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
