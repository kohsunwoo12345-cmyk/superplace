/**
 * GET /api/test/validate-codes
 * 모든 출석 코드의 유효성을 검증하고 실제 User 테이블 데이터와 매칭
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
    console.log('🔍 출석 코드 유효성 검증 시작...');

    // 1. 모든 활성 출석 코드 조회
    const codesResult = await DB.prepare(`
      SELECT code, userId, isActive, createdAt
      FROM student_attendance_codes
      WHERE isActive = 1
      ORDER BY createdAt DESC
      LIMIT 50
    `).all();

    const codes = codesResult.results || [];
    console.log(`📊 총 활성 코드 수: ${codes.length}`);

    // 2. 각 코드에 대해 User 테이블에서 실제 정보 조회
    const validatedCodes = [];
    const invalidCodes = [];

    for (const codeEntry of codes) {
      const userResult = await DB.prepare(`
        SELECT id, name, email, role
        FROM User
        WHERE id = ?
      `).bind(codeEntry.userId).first();

      if (userResult) {
        validatedCodes.push({
          code: codeEntry.code,
          userId: codeEntry.userId,
          isActive: codeEntry.isActive,
          student: {
            id: userResult.id,
            name: userResult.name,
            email: userResult.email,
            role: userResult.role
          },
          status: '✅ 정상'
        });
      } else {
        invalidCodes.push({
          code: codeEntry.code,
          userId: codeEntry.userId,
          isActive: codeEntry.isActive,
          student: null,
          status: '❌ User 테이블에 학생 정보 없음'
        });
      }
    }

    console.log(`✅ 정상 코드: ${validatedCodes.length}개`);
    console.log(`❌ 문제 코드: ${invalidCodes.length}개`);

    // 3. 학생 추가 테스트용으로 User 테이블의 STUDENT role 확인
    const studentsResult = await DB.prepare(`
      SELECT id, name, email, role
      FROM User
      WHERE role = 'STUDENT'
      ORDER BY createdAt DESC
      LIMIT 10
    `).all();

    const recentStudents = studentsResult.results || [];
    console.log(`👥 최근 학생 수: ${recentStudents.length}`);

    // 4. 각 최근 학생이 코드를 가지고 있는지 확인
    const studentsWithCodeStatus = [];
    for (const student of recentStudents) {
      const codeResult = await DB.prepare(`
        SELECT code, isActive
        FROM student_attendance_codes
        WHERE userId = ? AND isActive = 1
      `).bind(student.id).first();

      studentsWithCodeStatus.push({
        student: {
          id: student.id,
          name: student.name,
          email: student.email
        },
        hasCode: !!codeResult,
        code: codeResult ? codeResult.code : null,
        status: codeResult ? '✅ 코드 있음' : '❌ 코드 없음'
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          totalActiveCodes: codes.length,
          validCodes: validatedCodes.length,
          invalidCodes: invalidCodes.length,
          recentStudents: recentStudents.length
        },
        validCodes: validatedCodes.slice(0, 10), // 처음 10개만
        invalidCodes: invalidCodes.slice(0, 10), // 처음 10개만
        studentsWithCodeStatus: studentsWithCodeStatus,
        message: validatedCodes.length > 0 
          ? `✅ ${validatedCodes.length}개의 정상 작동 코드가 있습니다.`
          : `❌ 정상 작동하는 코드가 없습니다. 코드 재생성이 필요합니다.`
      }, null, 2),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Validation error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "코드 검증 중 오류가 발생했습니다",
        stack: error.stack
      }, null, 2),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
