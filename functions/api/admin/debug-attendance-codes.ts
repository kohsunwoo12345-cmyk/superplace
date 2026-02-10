interface Env {
  DB: D1Database;
}

/**
 * GET /api/admin/debug-attendance-codes
 * 출석 코드 디버그 - 모든 학생 코드 상태 확인
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

    // 1. 모든 학생 조회
    const students = await DB.prepare(`
      SELECT id, name, email, role FROM users WHERE role = 'STUDENT' ORDER BY name
    `).all();

    console.log(`📊 Total students: ${students.results.length}`);

    // 2. 각 학생의 출석 코드 확인
    const studentCodesStatus = [];
    
    for (const student of students.results) {
      // 출석 코드 조회
      const code = await DB.prepare(`
        SELECT * FROM student_attendance_codes WHERE userId = ?
      `).bind(student.id).first();

      studentCodesStatus.push({
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email,
        hasCode: !!code,
        code: code?.code || null,
        isActive: code?.isActive || 0,
        academyId: code?.academyId || null,
        createdAt: code?.createdAt || null,
      });
    }

    // 3. 통계
    const stats = {
      totalStudents: students.results.length,
      withCodes: studentCodesStatus.filter(s => s.hasCode).length,
      withoutCodes: studentCodesStatus.filter(s => !s.hasCode).length,
      activeCodes: studentCodesStatus.filter(s => s.isActive === 1).length,
      inactiveCodes: studentCodesStatus.filter(s => s.isActive === 0).length,
    };

    // 4. 테이블 스키마 확인
    const tableInfo = await DB.prepare(`
      PRAGMA table_info(student_attendance_codes)
    `).all();

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        tableSchema: tableInfo.results,
        students: studentCodesStatus,
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      }
    );

  } catch (error: any) {
    console.error("Debug attendance codes error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to debug attendance codes",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
