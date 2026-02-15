interface Env {
  DB: D1Database;
}

interface EditStudentRequest {
  studentId: number;
  name?: string;
  phone?: string;
  email?: string;
  school?: string;
  grade?: string;
  diagnosticMemo?: string;
  password?: string;
}

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const requestBody: EditStudentRequest = await context.request.json();
    const { studentId, name, phone, email, school, grade, diagnosticMemo, password } = requestBody;

    console.log("📝 Edit student request:", { 
      studentId, 
      hasName: !!name,
      hasPhone: !!phone,
      hasEmail: !!email,
      hasSchool: !!school,
      hasGrade: !!grade,
      hasDiagnosticMemo: !!diagnosticMemo,
      hasPassword: !!password
    });

    // 필수 필드 검증
    if (!studentId) {
      return new Response(JSON.stringify({ error: "Student ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 업데이트할 필드만 포함
    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name);
    }
    if (phone !== undefined) {
      updates.push("phone = ?");
      values.push(phone);
    }
    if (email !== undefined) {
      updates.push("email = ?");
      values.push(email);
    }
    if (school !== undefined) {
      updates.push("school = ?");
      values.push(school);
    }
    if (grade !== undefined) {
      updates.push("grade = ?");
      values.push(grade);
    }
    if (diagnosticMemo !== undefined) {
      updates.push("diagnostic_memo = ?");
      values.push(diagnosticMemo);
    }
    if (password !== undefined) {
      updates.push("password = ?");
      values.push(password);
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({ error: "No fields to update" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // UPDATE 쿼리 실행
    const query = `UPDATE users SET ${updates.join(", ")} WHERE id = ? AND role = 'STUDENT'`;
    values.push(studentId);

    console.log("🔄 Updating student:", { studentId, query, valuesCount: values.length });
    
    const result = await DB.prepare(query).bind(...values).run();

    console.log("✅ Student updated successfully:", { studentId, rowsAffected: result.meta.changes });

    if (result.meta.changes === 0) {
      return new Response(
        JSON.stringify({
          error: "Student not found or no changes made",
          message: "학생을 찾을 수 없거나 변경사항이 없습니다",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "학생 정보가 수정되었습니다",
        studentId: studentId,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Student edit error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to edit student",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
