interface Env {
  DB: D1Database;
}

// 🚨 긴급 수정용 API - 특정 학생 강제 업데이트
// GET /api/students/force-update?id=164&school=서울고등학교&grade=고2

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    
    const studentId = url.searchParams.get('id');
    const school = url.searchParams.get('school');
    const grade = url.searchParams.get('grade');
    const diagnosticMemo = url.searchParams.get('diagnosticMemo') || '';

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!studentId) {
      return new Response(JSON.stringify({ 
        error: "Student ID is required",
        usage: "/api/students/force-update?id=164&school=서울고등학교&grade=고2&diagnosticMemo=메모"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 1. 현재 데이터 확인
    const beforeUpdate = await DB.prepare(`
      SELECT id, name, email, phone, school, grade, diagnostic_memo, academy_id
      FROM users 
      WHERE id = ? AND role = 'STUDENT'
    `).bind(studentId).first();

    if (!beforeUpdate) {
      return new Response(JSON.stringify({ 
        error: "Student not found",
        studentId: studentId
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("📋 Before update:", beforeUpdate);

    // 2. 컬럼 존재 확인 및 추가
    try {
      await DB.prepare(`ALTER TABLE users ADD COLUMN school TEXT`).run();
      console.log("✅ Added school column");
    } catch (e) {
      console.log("ℹ️ school column already exists");
    }

    try {
      await DB.prepare(`ALTER TABLE users ADD COLUMN grade TEXT`).run();
      console.log("✅ Added grade column");
    } catch (e) {
      console.log("ℹ️ grade column already exists");
    }

    try {
      await DB.prepare(`ALTER TABLE users ADD COLUMN diagnostic_memo TEXT`).run();
      console.log("✅ Added diagnostic_memo column");
    } catch (e) {
      console.log("ℹ️ diagnostic_memo column already exists");
    }

    // 3. 강제 업데이트
    const updates: string[] = [];
    const values: any[] = [];

    if (school) {
      updates.push("school = ?");
      values.push(school);
    }
    if (grade) {
      updates.push("grade = ?");
      values.push(grade);
    }
    if (diagnosticMemo) {
      updates.push("diagnostic_memo = ?");
      values.push(diagnosticMemo);
    }

    // academy_id가 없으면 기본값 설정
    if (!beforeUpdate.academy_id) {
      updates.push("academy_id = ?");
      values.push(120); // 기본 학원 ID
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({ 
        error: "No fields to update",
        usage: "/api/students/force-update?id=164&school=서울고등학교&grade=고2"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const query = `UPDATE users SET ${updates.join(", ")} WHERE id = ? AND role = 'STUDENT'`;
    values.push(studentId);

    console.log("🔄 Executing update:", query);
    console.log("🔄 Values:", values);

    const result = await DB.prepare(query).bind(...values).run();
    console.log("✅ Update result:", result.meta);

    // 4. 업데이트 후 데이터 확인
    const afterUpdate = await DB.prepare(`
      SELECT id, name, email, phone, school, grade, diagnostic_memo, academy_id
      FROM users 
      WHERE id = ?
    `).bind(studentId).first();

    console.log("📋 After update:", afterUpdate);

    return new Response(
      JSON.stringify({
        success: true,
        message: "학생 정보가 강제 업데이트되었습니다",
        before: beforeUpdate,
        after: afterUpdate,
        rowsAffected: result.meta.changes
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Force update error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to force update",
        message: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
