interface Env {
  DB: D1Database;
}

// 6자리 숫자 코드 생성
function generateAttendanceCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

// 출석 코드가 없는 모든 학생에게 코드 생성
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    
    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log('🔄 Starting bulk code generation for students without codes...');

    // 1. 모든 STUDENT 역할 사용자 조회
    const allStudents = await DB.prepare(`
      SELECT id, name, email, academyId, academy_id
      FROM users 
      WHERE role = 'STUDENT' OR role = 'student'
    `).all();

    console.log(`📊 Found ${allStudents.results.length} total students`);

    // 2. 출석 코드가 있는 학생 ID 목록
    const existingCodes = await DB.prepare(`
      SELECT DISTINCT userId 
      FROM student_attendance_codes 
      WHERE isActive = 1
    `).all();

    const studentsWithCodes = new Set(existingCodes.results.map(r => r.userId));
    console.log(`📋 ${studentsWithCodes.size} students already have codes`);

    // 3. 코드가 없는 학생들
    const studentsWithoutCodes = allStudents.results.filter(
      student => !studentsWithCodes.has(student.id)
    );

    console.log(`🎯 ${studentsWithoutCodes.length} students need codes`);

    let created = 0;
    let failed = 0;
    const failedStudents: any[] = [];

    // 4. 각 학생에게 코드 생성
    for (const student of studentsWithoutCodes) {
      try {
        // 고유 코드 생성 (중복 체크)
        let code = generateAttendanceCode();
        let attempts = 0;
        
        while (attempts < 20) {
          const existing = await DB.prepare(
            "SELECT id FROM student_attendance_codes WHERE code = ?"
          ).bind(code).first();
          
          if (!existing) break;
          code = generateAttendanceCode();
          attempts++;
        }

        if (attempts >= 20) {
          console.error('❌ Could not generate unique code for student:', student.id);
          failed++;
          failedStudents.push({ id: student.id, name: student.name, reason: 'unique code generation failed' });
          continue;
        }

        // 코드 저장
        const codeId = `code-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const academyIdInt = student.academy_id || (student.academyId ? parseInt(student.academyId, 10) : null);

        await DB.prepare(`
          INSERT INTO student_attendance_codes 
          (id, userId, code, academyId, isActive, createdAt)
          VALUES (?, ?, ?, ?, 1, datetime('now'))
        `).bind(codeId, student.id, code, academyIdInt).run();

        created++;
        
        if (created % 10 === 0) {
          console.log(`✅ Created ${created} codes...`);
        }
      } catch (err: any) {
        console.error('❌ Failed to create code for student:', student.id, err.message);
        failed++;
        failedStudents.push({ id: student.id, name: student.name, reason: err.message });
      }
    }

    console.log('🎉 Bulk generation complete!');
    console.log(`✅ Created: ${created}`);
    console.log(`❌ Failed: ${failed}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Bulk code generation completed",
        stats: {
          totalStudents: allStudents.results.length,
          studentsWithCodes: studentsWithCodes.size,
          studentsNeedingCodes: studentsWithoutCodes.length,
          created: created,
          failed: failed,
        },
        failedStudents: failedStudents,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("Bulk generation error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Bulk generation failed",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
