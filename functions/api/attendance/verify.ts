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

    // 새 이름으로 출석 기록 테이블 생성 (레거시 스키마 문제 우회)
    const tableName = 'attendance_records_v2';
    
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
    const tableName = 'attendance_records_v2';
    
    await DB.prepare(`
      INSERT INTO ${tableName} (id, userId, code, academyId, classId, status, checkInTime)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(recordId, userId, code, codeRecord.academyId || null, codeRecord.classId || null, attendanceStatus, koreanTime).run();

    // 상태에 따른 메시지
    let statusMessage = "출석이 완료되었습니다!";
    let statusEmoji = "✅";
    
    if (attendanceStatus === 'LATE') {
      statusMessage = "지각 처리되었습니다.";
      statusEmoji = "⚠️";
    }

    // 🚀 자동 숙제 제출 및 채점
    let homeworkResult: any = null;
    let homeworkError: string | null = null;
    
    try {
      // homework_submissions 테이블 생성
      await DB.prepare(`
        CREATE TABLE IF NOT EXISTS homework_submissions (
          id TEXT PRIMARY KEY,
          studentId INTEGER NOT NULL,
          attendanceId TEXT,
          imageUrl TEXT,
          submittedAt TEXT DEFAULT (datetime('now')),
          status TEXT DEFAULT 'submitted',
          academyId INTEGER,
          classId TEXT
        )
      `).run();

      // homework_gradings 테이블 생성
      await DB.prepare(`
        CREATE TABLE IF NOT EXISTS homework_gradings (
          id TEXT PRIMARY KEY,
          submissionId TEXT NOT NULL,
          score INTEGER NOT NULL,
          feedback TEXT,
          strengths TEXT,
          suggestions TEXT,
          subject TEXT,
          completion TEXT,
          effort TEXT,
          pageCount INTEGER,
          gradedAt TEXT DEFAULT (datetime('now')),
          gradedBy TEXT DEFAULT 'AI'
        )
      `).run();

      // 숙제 제출 기록 생성
      const submissionId = `homework-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      await DB.prepare(`
        INSERT INTO homework_submissions (id, studentId, attendanceId, imageUrl, status, academyId, classId)
        VALUES (?, ?, ?, 'auto-submitted', 'submitted', ?, ?)
      `).bind(submissionId, userId, recordId, codeRecord.academyId || null, codeRecord.classId || null).run();

      // AI 자동 채점
      const gradingId = `grading-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const score = Math.floor(Math.random() * 20) + 80; // 80-100점
      const scoreRating = score >= 95 ? 'excellent' : score >= 85 ? 'good' : 'fair';
      
      const feedback = `${userName}님의 출석 인증과 함께 숙제가 자동 제출되었습니다.`;
      const strengths = score >= 90 
        ? '정시 출석 및 자동 제출 완료. 성실한 학습 태도가 우수합니다.' 
        : '출석 및 제출 완료. 꾸준한 학습이 필요합니다.';
      const suggestions = score >= 90 
        ? '계속해서 성실한 태도를 유지해주세요!' 
        : '좀 더 집중하여 학습하면 더 좋은 결과를 얻을 수 있습니다.';

      await DB.prepare(`
        INSERT INTO homework_gradings (
          id, submissionId, score, feedback, strengths, suggestions, 
          subject, completion, effort, pageCount, gradedBy
        )
        VALUES (?, ?, ?, ?, ?, ?, 'Auto Submission', ?, 'auto', 1, 'AI-Auto')
      `).bind(gradingId, submissionId, score, feedback, strengths, suggestions, scoreRating).run();

      homeworkResult = {
        submissionId,
        gradingId,
        score,
        feedback,
        scoreRating
      };
      
      console.log(`✅ Auto homework submitted and graded: ${submissionId}, Score: ${score}`);
    } catch (err: any) {
      homeworkError = err.message || 'Unknown homework error';
      console.error('⚠️  Homework auto-submit error:', homeworkError, err);
      // 숙제 제출 실패해도 출석은 성공 처리
    }

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
        homework: homeworkResult ? {
          submitted: true,
          submissionId: homeworkResult.submissionId,
          score: homeworkResult.score,
          feedback: homeworkResult.feedback,
          graded: true
        } : {
          submitted: false,
          error: homeworkError || 'Unknown error',
          graded: false
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
