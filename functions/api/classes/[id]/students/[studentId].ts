interface Env {
  DB: D1Database;
}

/**
 * DELETE /api/classes/[id]/students/[studentId]
 * 클래스에서 학생 제거
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

    const classId = context.params.id as string;
    const studentId = context.params.studentId as string;

    console.log('➖ Remove student from class:', classId, studentId);

    // students 테이블의 class_id를 NULL로 설정
    const studentIdInt = parseInt(String(studentId).split('.')[0]);
    await DB.prepare(`
      UPDATE students 
      SET class_id = NULL 
      WHERE user_id = ? AND class_id = ?
    `).bind(studentIdInt, parseInt(classId)).run();

    console.log(`✅ Student ${studentId} removed from class ${classId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "학생이 제외되었습니다"
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Remove student error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to remove student",
        message: error.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
