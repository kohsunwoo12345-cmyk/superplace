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
    const { code, attendanceCode, classId } = body;
    
    // code 또는 attendanceCode 둘 다 허용
    const verifyCode = code || attendanceCode;

    if (!verifyCode) {
      return new Response(
        JSON.stringify({ success: false, error: "출석 코드를 입력해주세요" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('🔍 Verifying attendance code:', verifyCode);

    // 1. 출석 코드로 학생 찾기 - 모든 필드 조회
    const attendanceCodeRecord = await DB.prepare(`
      SELECT * FROM student_attendance_codes WHERE code = ?
    `).bind(verifyCode).first();

    console.log('📋 Code lookup result:', JSON.stringify(attendanceCodeRecord));

    if (!attendanceCodeRecord) {
      console.error('❌ Code not found in database:', verifyCode);
      
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

    // 방어적 체크: attendanceCodeRecord가 유효한지 확인
    if (!attendanceCodeRecord || !attendanceCodeRecord.userId) {
      console.error('❌ Invalid attendance code record:', attendanceCodeRecord);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "출석 코드 정보가 올바르지 않습니다" 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('✅ Code found!', {
      userId: attendanceCodeRecord.userId,
      isActive: attendanceCodeRecord.isActive,
      isActiveType: typeof attendanceCodeRecord.isActive
    });

    const userId = attendanceCodeRecord.userId;

    // 2. 학생 정보 조회 (User 테이블 먼저, 없으면 users 테이블 확인)
    let student = await DB.prepare(`
      SELECT id, name, email, academyId FROM User WHERE id = ?
    `).bind(userId).first();

    console.log('👤 Student lookup (User):', student);

    let foundInUsersTable = false; // users 테이블에서 찾았는지 플래그

    // User 테이블에 없으면 users 테이블 확인 (legacy 지원)
    if (!student) {
      console.log('🔍 Trying users table for userId:', userId);
      student = await DB.prepare(`
        SELECT id, name, email, academy_id as academyId FROM users WHERE id = ?
      `).bind(userId).first();
      
      if (student) {
        console.log('✅ Found in users table:', student);
        foundInUsersTable = true; // users 테이블에서 찾음
      }
    }

    if (!student) {
      console.error('❌ Student not found in both User and users tables');
      return new Response(
        JSON.stringify({ success: false, error: "학생 정보를 찾을 수 없습니다" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // isActive 값 확인 - users 테이블에서 찾았으면 무조건 허용
    const isActiveValue = attendanceCodeRecord.isActive;
    const isActive = foundInUsersTable || // users 테이블에서 찾았으면 허용
                    isActiveValue === 1 || 
                    isActiveValue === "1" || 
                    isActiveValue === true || 
                    isActiveValue === "true" ||
                    isActiveValue === "TRUE";
    
    console.log('🔐 isActive check:', { original: isActiveValue, result: isActive, foundInUsersTable });
    
    if (!isActive) {
      console.error('❌ Code is inactive:', verifyCode, 'isActive value:', isActiveValue);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "비활성화된 출석 코드입니다"
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. 오늘 날짜 확인 (한국 시간)
    const now = new Date();
    const kstOffset = 9 * 60; // Korea is UTC+9
    const kstDate = new Date(now.getTime() + kstOffset * 60 * 1000);
    const today = kstDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentTime = kstDate.toISOString().replace('T', ' ').substring(0, 19);

    console.log('📅 Today:', today, 'Current time:', currentTime);

    // 출석 테이블 생성 및 업데이트 (attendance_records_v3)
    try {
      // 기본 테이블 생성
      await DB.prepare(`
        CREATE TABLE IF NOT EXISTS attendance_records_v3 (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          code TEXT NOT NULL,
          checkInTime TEXT NOT NULL,
          status TEXT NOT NULL,
          academyId TEXT,
          date TEXT,
          reason TEXT,
          updatedBy TEXT,
          createdAt TEXT,
          updatedAt TEXT
        )
      `).run();
      
      // date 컬럼이 없으면 추가
      try {
        await DB.prepare(`
          ALTER TABLE attendance_records_v3 ADD COLUMN date TEXT
        `).run();
      } catch (e) {
        // 컬럼이 이미 존재하면 무시
      }
      
      // reason, updatedBy 등 추가 컬럼도 확인
      try {
        await DB.prepare(`
          ALTER TABLE attendance_records_v3 ADD COLUMN reason TEXT
        `).run();
      } catch (e) {}
      
      try {
        await DB.prepare(`
          ALTER TABLE attendance_records_v3 ADD COLUMN updatedBy TEXT
        `).run();
      } catch (e) {}
      
      try {
        await DB.prepare(`
          ALTER TABLE attendance_records_v3 ADD COLUMN createdAt TEXT
        `).run();
      } catch (e) {}
      
      try {
        await DB.prepare(`
          ALTER TABLE attendance_records_v3 ADD COLUMN updatedAt TEXT
        `).run();
      } catch (e) {}
      
    } catch (createError) {
      console.warn('⚠️ Table already exists or creation failed');
    }

    // 4. 오늘 이미 출석했는지 확인 (date 필드 사용)
    const existingAttendance = await DB.prepare(`
      SELECT id, status FROM attendance_records_v3
      WHERE userId = ? AND date = ?
    `).bind(userId, today).first();

    const alreadyCheckedIn = !!existingAttendance;

    if (existingAttendance) {
      console.log('⚠️ 중복 출석 허용: 기존 출석을 업데이트합니다.', existingAttendance);
      // 중복 출석 허용: 기존 레코드를 삭제하고 새로 생성
      await env.DB.prepare(`
        DELETE FROM attendance_records_v3
        WHERE userId = ? AND date = ?
      `).bind(userId, today).run();
      console.log('✅ 기존 출석 레코드 삭제 완료');
    }

    // 5. 반 정보 조회하여 출석 시간 기준 확인
    let status = 'PRESENT'; // 기본값
    let classStartTime = '09:00'; // 기본 수업 시작 시간

    if (student.classId) {
      const classInfo = await DB.prepare(`
        SELECT id, name, startTime 
        FROM classes 
        WHERE id = ?
      `).bind(student.classId).first();

      if (classInfo && classInfo.startTime) {
        classStartTime = classInfo.startTime as string;
        console.log('📚 반 정보:', classInfo.name, '시작 시간:', classStartTime);
      }
    }

    // 현재 시간과 수업 시작 시간 비교
    const currentHHMM = kstDate.toTimeString().substring(0, 5); // HH:MM 형식
    console.log('⏰ 현재 시간:', currentHHMM, '수업 시작:', classStartTime);

    // 수업 시작 시간 이후면 지각
    if (currentHHMM > classStartTime) {
      status = 'LATE';
      console.log('⚠️ 지각 처리:', currentHHMM, '>', classStartTime);
    } else {
      status = 'PRESENT';
      console.log('✅ 출석 처리:', currentHHMM, '<=', classStartTime);
    }

    // 6. 출석 기록 생성 (attendance_records_v3에 저장)
    const attendanceId = `attendance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await DB.prepare(`
      INSERT INTO attendance_records_v3 (
        id, userId, code, checkInTime, status, academyId, date, createdAt, updatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      attendanceId,
      userId,
      verifyCode,
      currentTime,
      status,
      student.academyId || null,
      today,
      currentTime,
      'student'
    ).run();

    console.log('✅ Attendance recorded:', attendanceId, status);

    return new Response(
      JSON.stringify({
        success: true,
        userId: userId,
        academyId: student.academyId || null,
        alreadyCheckedIn: alreadyCheckedIn,
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
