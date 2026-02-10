interface Env {
  DB: D1Database;
}

/**
 * POST /api/admin/fix-attendance-codes
 * 출석 코드 문제 해결 - isActive 활성화 및 코드 생성
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const results = {
      totalStudents: 0,
      updatedCodes: 0,
      createdCodes: 0,
      errors: [] as string[],
      skipped: 0,
    };

    // 1. 테이블 존재 확인 및 생성
    console.log('📋 Ensuring student_attendance_codes table exists...');
    
    try {
      await DB.prepare(`
        CREATE TABLE IF NOT EXISTS student_attendance_codes (
          id TEXT PRIMARY KEY,
          userId INTEGER NOT NULL,
          code TEXT NOT NULL UNIQUE,
          academyId INTEGER,
          classId TEXT,
          isActive INTEGER DEFAULT 1,
          createdAt TEXT DEFAULT (datetime('now')),
          expiresAt TEXT
        )
      `).run();
      
      // 인덱스 생성
      await DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_attendance_codes_userId ON student_attendance_codes(userId)
      `).run();
      
      await DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_attendance_codes_code ON student_attendance_codes(code)
      `).run();
      
      console.log('✅ Table and indexes ensured');
    } catch (e: any) {
      console.error('❌ Table creation error:', e);
      results.errors.push(`Table creation: ${e.message}`);
    }

    // 2. 모든 학생 조회
    console.log('👥 Fetching all students...');
    const students = await DB.prepare(`
      SELECT id, name, email, academy_id FROM users WHERE role = 'STUDENT'
    `).all();

    console.log(`📊 Found ${students.results.length} students`);
    results.totalStudents = students.results.length;

    // 3. 각 학생의 코드 확인 및 생성/업데이트
    for (const student of students.results) {
      try {
        // 기존 코드 확인
        const existingCode = await DB.prepare(`
          SELECT * FROM student_attendance_codes WHERE userId = ?
        `).bind(student.id).first();

        if (existingCode) {
          // 기존 코드가 있으면 활성화
          if (existingCode.isActive !== 1) {
            await DB.prepare(`
              UPDATE student_attendance_codes 
              SET isActive = 1 
              WHERE userId = ?
            `).bind(student.id).run();
            
            console.log(`✅ Activated code ${existingCode.code} for student ${student.name}`);
            results.updatedCodes++;
          } else {
            console.log(`⏭️ Student ${student.name} already has active code ${existingCode.code}`);
            results.skipped++;
          }
          continue;
        }

        // 기존 코드가 없으면 새로 생성
        let code = '';
        let attempts = 0;
        const maxAttempts = 20;

        while (attempts < maxAttempts) {
          code = Math.floor(100000 + Math.random() * 900000).toString();
          
          const duplicate = await DB.prepare(`
            SELECT id FROM student_attendance_codes WHERE code = ?
          `).bind(code).first();

          if (!duplicate) {
            break;
          }
          attempts++;
        }

        if (attempts >= maxAttempts) {
          results.errors.push(`Failed to generate unique code for student ${student.id}`);
          continue;
        }

        // 코드 저장
        const codeId = `code-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await DB.prepare(`
          INSERT INTO student_attendance_codes (id, userId, code, academyId, isActive)
          VALUES (?, ?, ?, ?, 1)
        `).bind(codeId, student.id, code, student.academy_id || null).run();

        console.log(`✅ Created code ${code} for student ${student.name} (ID: ${student.id})`);
        results.createdCodes++;

      } catch (error: any) {
        console.error(`❌ Error processing student ${student.id}:`, error);
        results.errors.push(`Student ${student.id}: ${error.message}`);
      }
    }

    // 4. 결과 확인
    const finalCodes = await DB.prepare(`
      SELECT 
        sac.id,
        sac.userId,
        sac.code,
        sac.isActive,
        sac.academyId,
        u.name,
        u.email
      FROM student_attendance_codes sac
      JOIN users u ON sac.userId = u.id
      WHERE u.role = 'STUDENT'
      ORDER BY u.name
    `).all();

    return new Response(
      JSON.stringify({
        success: true,
        message: '출석 코드 문제 해결 완료',
        results: {
          ...results,
          finalCount: finalCodes.results.length,
        },
        codes: finalCodes.results.map(c => ({
          userId: c.userId,
          name: c.name,
          email: c.email,
          code: c.code,
          isActive: c.isActive,
          academyId: c.academyId,
        })),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Fix attendance codes error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fix attendance codes",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
