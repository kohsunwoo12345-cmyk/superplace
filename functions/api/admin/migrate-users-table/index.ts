/**
 * POST /api/admin/migrate-users-table
 * users 테이블의 학생 데이터를 User 테이블로 마이그레이션
 * (학원장이 생성한 학생들을 실제 시스템에서 사용 가능하도록)
 */

interface Env {
  DB: D1Database;
}

// 6자리 숫자 출석 코드 생성
function generateAttendanceCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

export const onRequestPost = async (context: { env: Env }) => {
  const { DB } = context.env;

  if (!DB) {
    return new Response(JSON.stringify({ success: false, error: "Database not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    console.log('🔄 users 테이블 → User 테이블 마이그레이션 시작...');

    const logs: string[] = [];
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // 1. users 테이블에서 모든 STUDENT 조회
    const usersResult = await DB.prepare(`
      SELECT id, name, email, phone, password, role, school, grade, 
             academy_id, academyId, created_at, createdAt
      FROM users
      WHERE role = 'STUDENT'
      ORDER BY id
    `).all();

    const usersData = usersResult.results || [];
    console.log(`📊 users 테이블에서 ${usersData.length}명의 학생 발견`);
    logs.push(`📊 users 테이블에서 ${usersData.length}명의 학생 발견`);

    // 2. 각 학생을 User 테이블로 마이그레이션
    for (const user of usersData) {
      try {
        // User 테이블에 이미 존재하는지 확인 (phone으로 중복 체크)
        const existingUser = await DB.prepare(`
          SELECT id FROM User WHERE phone = ?
        `).bind(user.phone).first();

        if (existingUser) {
          logs.push(`⏭️ 건너뜀: ${user.name} (${user.phone}) - 이미 User 테이블에 존재`);
          skippedCount++;
          continue;
        }

        // User 테이블에 삽입
        const newUserId = `student-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();
        const academyId = user.academy_id || user.academyId;

        await DB.prepare(`
          INSERT INTO User (
            id, name, email, phone, password, role,
            school, grade, academyId, approved, createdAt, updatedAt
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
        `).bind(
          newUserId,
          user.name,
          user.email,
          user.phone,
          user.password,
          'STUDENT',
          user.school || null,
          user.grade || null,
          academyId || null,
          user.created_at || user.createdAt || now,
          now
        ).run();

        console.log(`✅ 마이그레이션: ${user.name} (${user.phone}) → ${newUserId}`);

        // 출석 코드 생성
        let attendanceCode = generateAttendanceCode();
        let attempts = 0;
        while (attempts < 20) {
          const existing = await DB.prepare(
            "SELECT id FROM student_attendance_codes WHERE code = ?"
          ).bind(attendanceCode).first();
          
          if (!existing) break;
          attendanceCode = generateAttendanceCode();
          attempts++;
        }

        // 출석 코드 저장
        const codeId = `code-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const koreanTime = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);
        
        await DB.prepare(`
          INSERT INTO student_attendance_codes (id, userId, code, academyId, isActive, createdAt)
          VALUES (?, ?, ?, ?, 1, ?)
        `).bind(codeId, newUserId, attendanceCode, academyId || null, koreanTime).run();

        logs.push(`✅ ${user.name} (${user.phone}) → User 테이블 + 출석 코드: ${attendanceCode}`);
        migratedCount++;

        // 너무 빨리 실행되지 않도록 약간의 딜레이 (타임스탬프 중복 방지)
        await new Promise(resolve => setTimeout(resolve, 10));

      } catch (error: any) {
        console.error(`❌ 마이그레이션 실패: ${user.name} (${user.phone}) - ${error.message}`);
        logs.push(`❌ 실패: ${user.name} (${user.phone}) - ${error.message}`);
        errorCount++;
      }
    }

    console.log(`✅ 마이그레이션 완료: ${migratedCount}명 성공, ${skippedCount}명 건너뜀, ${errorCount}명 실패`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `마이그레이션 완료: ${migratedCount}명의 학생이 User 테이블로 이동되었습니다`,
        summary: {
          total: usersData.length,
          migrated: migratedCount,
          skipped: skippedCount,
          errors: errorCount
        },
        logs: logs.slice(0, 50) // 처음 50개 로그만
      }, null, 2),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Migration error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "마이그레이션 중 오류가 발생했습니다",
        stack: error.stack
      }, null, 2),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
