interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 숙제 제출 테이블 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS homework_submissions (
        id TEXT PRIMARY KEY,
        userId INTEGER NOT NULL,
        attendanceRecordId TEXT,
        imageUrl TEXT,
        score INTEGER,
        feedback TEXT,
        subject TEXT,
        completion TEXT,
        effort TEXT,
        strengths TEXT,
        suggestions TEXT,
        submittedAt TEXT NOT NULL,
        gradedAt TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (attendanceRecordId) REFERENCES attendance_records(id)
      )
    `).run();

    // 출석 기록 테이블에 숙제 관련 컬럼 추가
    try {
      await DB.prepare(`
        ALTER TABLE attendance_records 
        ADD COLUMN homeworkSubmitted INTEGER DEFAULT 0
      `).run();
    } catch (e) {
      // 이미 컬럼이 존재하면 무시
      console.log("homeworkSubmitted column already exists");
    }

    try {
      await DB.prepare(`
        ALTER TABLE attendance_records 
        ADD COLUMN homeworkSubmittedAt TEXT
      `).run();
    } catch (e) {
      // 이미 컬럼이 존재하면 무시
      console.log("homeworkSubmittedAt column already exists");
    }

    // 테이블 정보 확인
    const tableInfo = await DB.prepare(`
      PRAGMA table_info(homework_submissions)
    `).all();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Homework submissions table created successfully",
        tableInfo: tableInfo.results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Migration error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Migration failed",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
