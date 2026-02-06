interface Env {
  DB: D1Database;
}

// 한국 시간 (KST) 생성 함수
function getKoreanTime(): string {
  const now = new Date();
  // UTC 시간에 9시간 추가 (KST = UTC+9)
  const kstOffset = 9 * 60; // 분 단위
  const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
  
  // YYYY-MM-DD HH:MM:SS 형식으로 변환
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
    const { userId, code } = body;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!userId || !code) {
      return new Response(
        JSON.stringify({ error: "userId and code are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 출석 기록 테이블 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        code TEXT NOT NULL,
        verifiedAt TEXT NOT NULL,
        status TEXT DEFAULT 'VERIFIED',
        homeworkSubmitted INTEGER DEFAULT 0,
        homeworkSubmittedAt TEXT
      )
    `).run();

    // 코드 유효성 확인 및 사용자 일치 확인
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

    // 코드 소유자와 요청한 사용자가 일치하는지 확인
    const codeUserId = String(codeRecord.userId);
    const requestUserId = String(userId);
    
    if (codeUserId !== requestUserId) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: "본인의 출석 코드가 아닙니다." 
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

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
          message: "오늘 이미 출석하셨습니다." 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 한국 시간으로 출석 기록 저장
    const koreanTime = getKoreanTime();
    const recordId = `attendance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await DB.prepare(`
      INSERT INTO attendance_records (id, userId, code, verifiedAt, status)
      VALUES (?, ?, ?, ?, 'VERIFIED')
    `).bind(recordId, String(userId), code, koreanTime).run();

    return new Response(
      JSON.stringify({
        success: true,
        message: "출석이 인증되었습니다.",
        recordId,
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
        error: "Failed to verify attendance",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
