interface Env {
  DB: D1Database;
}

/**
 * DELETE /api/admin/students/[id]
 * 학생 완전 삭제 (퇴원 처리)
 * - User 테이블에서 삭제
 * - students 테이블에서 삭제
 * - class_students 테이블에서 삭제
 * - user_bot_assignments 테이블에서 삭제
 * - 기타 관련 데이터 정리
 */
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const studentId = context.params.id as string;
    console.log('🗑️ Deleting student:', studentId);

    // 1. 학생 정보 확인 (role이 STUDENT인지 확인)
    const student = await DB.prepare(`
      SELECT id, name, email, role, academyId
      FROM User
      WHERE id = ? AND role = 'STUDENT'
    `).bind(studentId).first();

    if (!student) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '학생을 찾을 수 없거나 학생 계정이 아닙니다.' 
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`📋 Student found: ${student.name} (${student.email})`);

    // 2. students 테이블에서 삭제
    try {
      await DB.prepare(`
        DELETE FROM students WHERE user_id = ?
      `).bind(studentId).run();
      console.log('✅ Deleted from students table');
    } catch (err) {
      console.log('⚠️ students table delete skipped:', err);
    }

    // 3. class_students 테이블에서 삭제
    try {
      await DB.prepare(`
        DELETE FROM class_students WHERE studentId = ?
      `).bind(studentId).run();
      console.log('✅ Deleted from class_students table');
    } catch (err) {
      console.log('⚠️ class_students table delete skipped:', err);
    }

    // 4. user_bot_assignments 테이블에서 삭제 (AI 봇 할당 제거)
    try {
      await DB.prepare(`
        DELETE FROM user_bot_assignments WHERE userId = ?
      `).bind(studentId).run();
      console.log('✅ Deleted from user_bot_assignments table');
    } catch (err) {
      console.log('⚠️ user_bot_assignments table delete skipped:', err);
    }

    // 5. 출석 기록이 있다면 삭제 또는 보관 (선택적)
    // 출석 기록은 통계를 위해 보관할 수 있으므로 삭제하지 않음
    // 필요시 아래 주석 해제
    /*
    try {
      await DB.prepare(`
        DELETE FROM attendance WHERE user_id = ?
      `).bind(studentId).run();
      console.log('✅ Deleted attendance records');
    } catch (err) {
      console.log('⚠️ attendance table delete skipped:', err);
    }
    */

    // 6. 숙제 제출 기록 (선택적 보관)
    // 통계를 위해 보관 권장

    // 7. User 테이블에서 완전 삭제
    await DB.prepare(`
      DELETE FROM User WHERE id = ?
    `).bind(studentId).run();
    console.log('✅ Deleted from User table');

    // 8. 구독 사용량 감소 (학생 수 카운트)
    try {
      // academyId로 학원장 찾기
      const director = await DB.prepare(`
        SELECT id FROM User 
        WHERE academyId = ? AND role = 'DIRECTOR'
        LIMIT 1
      `).bind(student.academyId).first();

      if (director) {
        // 해당 학원장의 구독에서 current_students 감소
        await DB.prepare(`
          UPDATE user_subscriptions 
          SET current_students = CASE 
            WHEN current_students > 0 THEN current_students - 1 
            ELSE 0 
          END,
          updatedAt = ?
          WHERE userId = ? AND status = 'active'
        `).bind(new Date().toISOString(), director.id).run();
        console.log('✅ Decreased current_students count in subscription');
      }
    } catch (err) {
      console.log('⚠️ Subscription update skipped:', err);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `학생 ${student.name}이(가) 완전히 삭제되었습니다.`,
        deletedStudent: {
          id: student.id,
          name: student.name,
          email: student.email
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Delete student error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to delete student",
        message: error.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
