// 교사 삭제 API
export async function onRequestDelete(context) {
  try {
    const { DB } = context.env;
    const { params } = context;
    const teacherId = params.id;

    console.log(`🗑️ 교사 삭제 요청: ${teacherId}`);

    if (!teacherId) {
      return new Response(JSON.stringify({
        success: false,
        error: "교사 ID가 필요합니다."
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 교사 정보 확인
    const teacher = await DB.prepare(`
      SELECT id, name, email, role FROM User
      WHERE id = ? AND role = 'TEACHER'
    `).bind(teacherId).first();

    if (!teacher) {
      return new Response(JSON.stringify({
        success: false,
        error: "교사를 찾을 수 없습니다."
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    console.log(`👤 삭제할 교사: ${teacher.name} (${teacher.email})`);

    // 1. 교사 권한 정보 삭제
    await DB.prepare(`
      DELETE FROM teacher_permissions
      WHERE teacherId = ?
    `).bind(teacherId).run();
    console.log("✅ 교사 권한 삭제 완료");

    // 2. 교사 반 배정 정보 삭제 (class_teachers 테이블이 있다면)
    try {
      await DB.prepare(`
        DELETE FROM class_teachers
        WHERE teacherId = ?
      `).bind(teacherId).run();
      console.log("✅ 교사 반 배정 삭제 완료");
    } catch (e) {
      // 테이블이 없을 수도 있으므로 무시
      console.log("⚠️ class_teachers 테이블 없음 (무시)");
    }

    // 3. 교사 계정 삭제
    await DB.prepare(`
      DELETE FROM User
      WHERE id = ?
    `).bind(teacherId).run();
    console.log("✅ 교사 계정 삭제 완료");

    return new Response(JSON.stringify({
      success: true,
      message: `${teacher.name} 교사가 삭제되었습니다.`,
      deletedTeacher: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("교사 삭제 오류:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "교사 삭제 중 오류가 발생했습니다.",
      details: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
