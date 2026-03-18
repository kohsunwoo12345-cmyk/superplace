interface Env {
  DB: D1Database;
}

/**
 * POST /api/attendance/verify
 * 출석 코드로 출석 인증
 */
export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const { DB } = env;

  if (!DB) {
    return new Response(JSON.stringify({ success: false, error: "Database not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { code, classId } = body;

    if (!code) {
      return new Response(
        JSON.stringify({ success: false, error: "출석 코드를 입력해주세요" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('🔍 Verifying attendance code:', code);

    // 1. 출석 코드로 학생 찾기 - 모든 필드 조회
    const attendanceCode = await DB.prepare(`
      SELECT * FROM student_attendance_codes WHERE code = ?
    `).bind(code).first();

    console.log('📋 Code lookup result:', JSON.stringify(attendanceCode));

    if (!attendanceCode) {
      console.error('❌ Code not found in database:', code);
      
      // 데이터베이스에 코드가 있는지 전체 확인
      const allCodes = await DB.prepare(`
        SELECT code FROM student_attendance_codes LIMIT 5
      `).all();
      
      console.log('📊 Sample codes in database:', allCodes.results);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "유효하지 않은 출석 코드입니다"
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('✅ Code found!', {
      userId: attendanceCode.userId,
      isActive: attendanceCode.isActive,
      isActiveType: typeof attendanceCode.isActive
    });

    // isActive 값 확인 - 다양한 형태 허용 (1, "1", true, "true")
    const isActiveValue = attendanceCode.isActive;
    const isActive = isActiveValue === 1 || 
                    isActiveValue === "1" || 
                    isActiveValue === true || 
                    isActiveValue === "true" ||
                    isActiveValue === "TRUE";
    
    console.log('🔐 isActive check:', { original: isActiveValue, result: isActive });
    
    if (!isActive) {
      console.error('❌ Code is inactive:', code, 'isActive value:', isActiveValue);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "비활성화된 출석 코드입니다"
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = attendanceCode.userId;

    // 2. 학생 정보 조회
    // 실제 스키마: academyId (TEXT), academy_id (INTEGER), assigned_class (TEXT)
    let student = await DB.prepare(`
      SELECT id, name, email, academyId, academy_id, assigned_class as classId FROM users WHERE id = ?
    `).bind(userId).first();

    console.log('👤 users 테이블 조회 (academyId, academy_id, assigned_class):', student);

    // academyId가 없으면 academy_id를 사용
    if (student && !student.academyId && student.academy_id) {
      student.academyId = student.academy_id;
      console.log('✅ academy_id를 academyId로 설정:', student.academyId);
    }

    if (!student) {
      console.error('❌ 학생을 찾을 수 없음: userId =', userId);
      return new Response(
        JSON.stringify({ success: false, error: "학생 정보를 찾을 수 없습니다" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('✅ 학생 확인 완료:', student.name, 'academyId:', student.academyId);

    // 3. 오늘 날짜 확인 (한국 시간)
    const now = new Date();
    const kstOffset = 9 * 60; // Korea is UTC+9
    const kstDate = new Date(now.getTime() + kstOffset * 60 * 1000);
    const today = kstDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentTime = kstDate.toISOString().replace('T', ' ').substring(0, 19);

    console.log('📅 Today:', today, 'Current time:', currentTime);

    // 출석 테이블 생성 (attendance_records_v2 사용)
    try {
      await DB.prepare(`
        CREATE TABLE IF NOT EXISTS attendance_records_v2 (
          id TEXT PRIMARY KEY,
          userId INTEGER NOT NULL,
          code TEXT NOT NULL,
          checkInTime TEXT NOT NULL,
          status TEXT NOT NULL,
          academyId INTEGER
        )
      `).run();
    } catch (createError) {
      console.warn('⚠️ Table already exists or creation failed');
    }

    // 4. 오늘 이미 출석했는지 확인 (attendance_records_v2 사용)
    const existingAttendance = await DB.prepare(`
      SELECT id, status FROM attendance_records_v2
      WHERE userId = ? AND SUBSTR(checkInTime, 1, 10) = ?
    `).bind(userId, today).first();

    if (existingAttendance) {
      console.log('⚠️ 중복 출석 허용: 기존 출석을 업데이트합니다.', existingAttendance);
      // 중복 출석 허용: 기존 레코드를 삭제하고 새로 생성
      await env.DB.prepare(`
        DELETE FROM attendance_records_v2
        WHERE userId = ? AND SUBSTR(checkInTime, 1, 10) = ?
      `).bind(userId, today).run();
      console.log('✅ 기존 출석 레코드 삭제 완료');
    }

    // 5. 출석 상태 결정
    // - classId가 없으면 (반 배정 안됨) → 항상 PRESENT (출석)
    // - classId가 있으면 → 9시 기준으로 PRESENT/LATE 판정
    let status: string;
    
    if (!student.classId) {
      console.log('📌 반 배정 없음 → 출석 처리');
      status = 'PRESENT';
    } else {
      const hour = kstDate.getHours();
      status = hour < 9 ? 'PRESENT' : 'LATE';
      console.log(`⏰ 반 배정 있음 → 시간 기준 판정 (${hour}시: ${status})`);
    }

    // 6. 출석 기록 생성 (attendance_records_v2에 저장)
    const attendanceId = `attendance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await DB.prepare(`
      INSERT INTO attendance_records_v2 (
        id, userId, code, checkInTime, status, academyId
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      attendanceId,
      userId,
      code,
      currentTime,
      status,
      student.academyId || null
    ).run();

    console.log('✅ Attendance recorded:', attendanceId, status);

    return new Response(
      JSON.stringify({
        success: true,
        student: {
          id: student.id,
          name: student.name,
          email: student.email,
        },
        attendance: {
          id: attendanceId,
          date: today,
          status: status,
          checkInTime: currentTime,
        }
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Attendance verification error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "출석 인증 중 오류가 발생했습니다",
        stack: error.stack,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
