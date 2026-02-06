interface Env {
  DB: D1Database;
}

// 한국 시간 (KST) 생성 함수
function getKoreanTime(): string {
  const now = new Date();
  const kstOffset = 9 * 60; // 분 단위
  const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
  
  const year = kstTime.getFullYear();
  const month = String(kstTime.getMonth() + 1).padStart(2, '0');
  const day = String(kstTime.getDate()).padStart(2, '0');
  const hours = String(kstTime.getHours()).padStart(2, '0');
  const minutes = String(kstTime.getMinutes()).padStart(2, '0');
  const seconds = String(kstTime.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 오늘 날짜 (KST)
function getKoreanDate(): string {
  const now = new Date();
  const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  
  const year = kstTime.getFullYear();
  const month = String(kstTime.getMonth() + 1).padStart(2, '0');
  const day = String(kstTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const body = await context.request.json() as any;
    const { code } = body;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!code) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "출석 코드를 입력해주세요." 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 출석 기록 테이블 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        userName TEXT,
        userEmail TEXT,
        code TEXT NOT NULL,
        verifiedAt TEXT NOT NULL,
        status TEXT DEFAULT 'VERIFIED',
        homeworkSubmitted INTEGER DEFAULT 0,
        homeworkSubmittedAt TEXT
      )
    `).run();

    // 코드 유효성 확인 (코드로 해당 학생 정보 조회)
    const codeRecord = await DB.prepare(`
      SELECT * FROM student_attendance_codes 
      WHERE code = ? AND isActive = 1
    `).bind(code).first();

    if (!codeRecord) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: "유효하지 않은 출석 코드입니다." 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 코드에서 학생 정보 가져오기
    const userId = codeRecord.userId;

    // 학생 정보 조회
    const user = await DB.prepare(`
      SELECT id, name, email FROM users WHERE id = ?
    `).bind(userId).first();

    const userName = user ? user.name : "알 수 없음";
    const userEmail = user ? user.email : "";

    // 오늘 이미 출석했는지 확인 (한국 시간 기준)
    const today = getKoreanDate();
    const existingRecord = await DB.prepare(`
      SELECT * FROM attendance_records 
      WHERE CAST(userId AS TEXT) = ? 
      AND substr(verifiedAt, 1, 10) = ?
    `).bind(String(userId), today).first();

    if (existingRecord) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: `${userName}님은 오늘 이미 출석하셨습니다.`,
          alreadyAttended: true,
          attendanceTime: existingRecord.verifiedAt
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 한국 시간으로 출석 기록 저장
    const koreanTime = getKoreanTime();
    const recordId = `attendance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await DB.prepare(`
      INSERT INTO attendance_records (id, userId, userName, userEmail, code, verifiedAt, status)
      VALUES (?, ?, ?, ?, ?, ?, 'VERIFIED')
    `).bind(recordId, String(userId), userName, userEmail, code, koreanTime).run();

    return new Response(
      JSON.stringify({
        success: true,
        message: `${userName}님, 출석이 완료되었습니다!`,
        recordId,
        userId,
        userName,
        userEmail,
        verifiedAt: koreanTime,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Attendance verify error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "출석 처리 중 오류가 발생했습니다",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
