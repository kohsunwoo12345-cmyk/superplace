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

    console.log("📥 출석 인증 요청:", { code, codeType: typeof code, codeLength: code?.length });

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

    // 코드를 문자열로 변환 및 trim
    const cleanCode = String(code).trim();
    console.log("🧹 정제된 코드:", { cleanCode, cleanCodeLength: cleanCode.length });

    // 새 이름으로 출석 기록 테이블 생성 (레거시 스키마 문제 우회)
    const tableName = 'attendance_records_v2';
    
    // 테이블 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id TEXT PRIMARY KEY,
        userId INTEGER NOT NULL,
        code TEXT NOT NULL,
        checkInTime TEXT DEFAULT (datetime('now')),
        academyId INTEGER,
        classId TEXT,
        status TEXT DEFAULT 'PRESENT',
        note TEXT
      )
    `).run();

    // student_attendance_codes 테이블도 확인 및 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS student_attendance_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        code TEXT NOT NULL UNIQUE,
        academyId INTEGER,
        classId TEXT,
        expiresAt TEXT,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT DEFAULT (datetime('now'))
      )
    `).run();

    // 코드 유효성 확인 (코드로 해당 학생 정보 조회)
    const codeRecord = await DB.prepare(`
      SELECT * FROM student_attendance_codes 
      WHERE code = ? AND isActive = 1
    `).bind(cleanCode).first();

    console.log("🔍 코드 조회 결과:", codeRecord ? "찾음" : "없음", { searchCode: cleanCode });

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

    // 중복 출석 허용 - 하루에 여러 번 출석 가능
    
    // 출석 시간 기준으로 상태 자동 판별
    const koreanTime = getKoreanTime();
    const currentTime = new Date();
    const hours = currentTime.getUTCHours() + 9; // KST
    const minutes = currentTime.getUTCMinutes();
    
    // 출석 기준 시간: 09:00 (정시), 09:30 (지각)
    let attendanceStatus = 'VERIFIED'; // 기본: 출석
    
    if (hours > 9 || (hours === 9 && minutes > 30)) {
      attendanceStatus = 'LATE'; // 지각 (9시 30분 이후)
    }
    
    // 결석 판정은 별도 프로세스에서 처리 (예: 자정에 출석하지 않은 학생 자동 결석 처리)

    const recordId = `attendance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await DB.prepare(`
      INSERT INTO ${tableName} (id, userId, code, academyId, classId, status, checkInTime)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(recordId, userId, cleanCode, codeRecord.academyId || null, codeRecord.classId || null, attendanceStatus, koreanTime).run();

    // 상태에 따른 메시지
    let statusMessage = "출석이 완료되었습니다!";
    let statusEmoji = "✅";
    
    if (attendanceStatus === 'LATE') {
      statusMessage = "지각 처리되었습니다.";
      statusEmoji = "⚠️";
    }

    // 출석만 기록, 숙제는 사진 촬영 후 별도 제출
    return new Response(
      JSON.stringify({
        success: true,
        message: `${statusEmoji} ${userName}님, ${statusMessage}`,
        recordId,
        userId,
        userName,
        userEmail,
        verifiedAt: koreanTime,
        status: attendanceStatus,
        statusText: attendanceStatus === 'LATE' ? '지각' : '출석',
        attendanceCode: cleanCode,
        // 숙제는 아직 미제출 상태
        homework: {
          submitted: false,
          message: '숙제 사진을 촬영해주세요'
        }
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
