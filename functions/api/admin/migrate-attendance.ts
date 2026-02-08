interface Env {
  DB: D1Database;
}

/**
 * 출결 및 숙제 시스템 마이그레이션 API
 * 
 * POST /api/admin/migrate-attendance
 * - users 테이블에 attendance_code 컬럼 추가
 * - 출석 관련 테이블 생성
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({
          error: 'Database not configured',
          message: 'D1 database binding is not set up. Please configure the DB binding in your Cloudflare Pages settings.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Starting attendance system migration...');

    // 1. users 테이블에 attendance_code 컬럼 추가
    try {
      await DB.prepare(`
        ALTER TABLE users ADD COLUMN attendance_code TEXT
      `).run();
      console.log('✅ attendance_code column added to users table');
    } catch (error: any) {
      if (error.message?.includes('duplicate column name')) {
        console.log('⚠️  attendance_code column already exists');
      } else {
        throw error;
      }
    }

    // 2. student_attendance_codes 테이블 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS student_attendance_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        code TEXT NOT NULL UNIQUE,
        expiresAt TEXT NOT NULL,
        isUsed INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `).run();
    console.log('✅ student_attendance_codes table created');

    // 3. attendance_records 테이블 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        studentId INTEGER NOT NULL,
        codeId INTEGER NOT NULL,
        status TEXT NOT NULL,
        checkinTime TEXT NOT NULL,
        createdAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (studentId) REFERENCES users(id),
        FOREIGN KEY (codeId) REFERENCES student_attendance_codes(id)
      )
    `).run();
    console.log('✅ attendance_records table created');

    // 4. homework_submissions 테이블 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS homework_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        studentId INTEGER NOT NULL,
        attendanceId INTEGER NOT NULL,
        imageUrl TEXT NOT NULL,
        submittedAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (studentId) REFERENCES users(id),
        FOREIGN KEY (attendanceId) REFERENCES attendance_records(id)
      )
    `).run();
    console.log('✅ homework_submissions table created');

    // 5. homework_gradings 테이블 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS homework_gradings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        submissionId INTEGER NOT NULL,
        score INTEGER NOT NULL,
        feedback TEXT NOT NULL,
        strengths TEXT,
        improvements TEXT,
        gradedAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (submissionId) REFERENCES homework_submissions(id)
      )
    `).run();
    console.log('✅ homework_gradings table created');

    // 6. homework_reports 테이블 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS homework_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        gradingId INTEGER NOT NULL,
        teacherId INTEGER NOT NULL,
        directorId INTEGER,
        sentAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (gradingId) REFERENCES homework_gradings(id),
        FOREIGN KEY (teacherId) REFERENCES users(id),
        FOREIGN KEY (directorId) REFERENCES users(id)
      )
    `).run();
    console.log('✅ homework_reports table created');

    // 7. 기존 STUDENT 역할 사용자들에게 출석 코드 자동 생성
    const students = await DB.prepare(`
      SELECT id FROM users WHERE role = 'STUDENT' AND attendance_code IS NULL
    `).all();

    let generatedCount = 0;
    for (const student of students.results) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await DB.prepare(`
        UPDATE users SET attendance_code = ? WHERE id = ?
      `).bind(code, student.id).run();
      generatedCount++;
    }

    console.log(`✅ Generated ${generatedCount} attendance codes for existing students`);

    // 테이블 스키마 확인
    const usersSchema = await DB.prepare(`PRAGMA table_info(users)`).all();
    console.log('Users table schema:', usersSchema);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Attendance system migration completed successfully',
        details: {
          tablesCreated: [
            'student_attendance_codes',
            'attendance_records',
            'homework_submissions',
            'homework_gradings',
            'homework_reports'
          ],
          columnsAdded: ['attendance_code to users'],
          codesGenerated: generatedCount,
          usersTableColumns: usersSchema.results.map((col: any) => col.name)
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Migration error:', error);
    return new Response(
      JSON.stringify({
        error: 'Migration failed',
        message: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
