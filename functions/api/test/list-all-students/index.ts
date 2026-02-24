/**
 * GET /api/test/list-all-students
 * User 테이블의 모든 STUDENT 역할 사용자 조회 및 출석 코드 매칭 상태 확인
 */

interface Env {
  DB: D1Database;
}

export const onRequestGet = async (context: { env: Env }) => {
  const { DB } = context.env;

  if (!DB) {
    return new Response(JSON.stringify({ success: false, error: "Database not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    console.log('🔍 모든 학생 데이터 조회 시작...');

    // 1. User 테이블에서 STUDENT role을 가진 모든 사용자 조회
    const studentsResult = await DB.prepare(`
      SELECT id, name, email, phone, role, academyId, createdAt, approved
      FROM User
      WHERE role = 'STUDENT'
      ORDER BY createdAt DESC
    `).all();

    const students = studentsResult.results || [];
    console.log(`📊 총 학생 수: ${students.length}`);

    // 2. 각 학생에 대해 출석 코드 확인
    const studentsWithCodes = [];
    for (const student of students) {
      // 해당 학생의 출석 코드 조회
      const codesResult = await DB.prepare(`
        SELECT code, isActive, createdAt
        FROM student_attendance_codes
        WHERE userId = ? AND isActive = 1
        ORDER BY createdAt DESC
        LIMIT 5
      `).bind(student.id).all();

      const codes = codesResult.results || [];

      studentsWithCodes.push({
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        academyId: student.academyId,
        createdAt: student.createdAt,
        approved: student.approved,
        codesCount: codes.length,
        codes: codes.map((c: any) => c.code),
        status: codes.length > 0 ? '✅ 코드 있음' : '❌ 코드 없음'
      });
    }

    // 3. student_attendance_codes 테이블의 모든 활성 코드 조회
    const allCodesResult = await DB.prepare(`
      SELECT code, userId, isActive, createdAt
      FROM student_attendance_codes
      WHERE isActive = 1
      ORDER BY createdAt DESC
      LIMIT 100
    `).all();

    const allCodes = allCodesResult.results || [];
    console.log(`📊 총 활성 코드 수: ${allCodes.length}`);

    // 4. User 테이블에 없는 userId를 가진 코드들 찾기
    const orphanedCodes = [];
    for (const codeEntry of allCodes) {
      const userExists = students.some((s: any) => s.id === codeEntry.userId);
      if (!userExists) {
        orphanedCodes.push({
          code: codeEntry.code,
          userId: codeEntry.userId,
          createdAt: codeEntry.createdAt,
          status: '❌ User 테이블에 학생 정보 없음'
        });
      }
    }

    console.log(`❌ 고아 코드 (orphaned codes): ${orphanedCodes.length}개`);

    // 5. 코드가 없는 학생들
    const studentsWithoutCodes = studentsWithCodes.filter(s => s.codesCount === 0);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          totalStudents: students.length,
          studentsWithCodes: studentsWithCodes.filter(s => s.codesCount > 0).length,
          studentsWithoutCodes: studentsWithoutCodes.length,
          totalActiveCodes: allCodes.length,
          orphanedCodes: orphanedCodes.length
        },
        students: studentsWithCodes,
        studentsWithoutCodes: studentsWithoutCodes,
        orphanedCodes: orphanedCodes.slice(0, 20), // 처음 20개만
        recommendation: orphanedCodes.length > 0 ? 
          `❌ ${orphanedCodes.length}개의 코드가 존재하지 않는 학생을 가리키고 있습니다. 이 코드들을 비활성화하거나 해당 학생을 다시 생성해야 합니다.` :
          `✅ 모든 코드가 올바른 학생과 연결되어 있습니다.`
      }, null, 2),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ List students error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "학생 목록 조회 중 오류가 발생했습니다",
        stack: error.stack
      }, null, 2),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
