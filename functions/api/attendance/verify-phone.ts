// 전화번호로 출석 인증 API
export async function onRequestPost(context: any) {
  const { request, env } = context;
  const { DB } = env;

  try {
    const body = await request.json();
    const { phone } = body;

    console.log('📱 전화번호로 출석 인증 요청:', phone);

    if (!phone) {
      return new Response(JSON.stringify({
        success: false,
        error: '전화번호를 입력해주세요.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 전화번호 정규화 (010-1234-5678 → 01012345678)
    const normalizedPhone = phone.replace(/\D/g, '');

    if (normalizedPhone.length < 10 || normalizedPhone.length > 11) {
      return new Response(JSON.stringify({
        success: false,
        error: '올바른 전화번호를 입력해주세요.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 학생 조회 (User 테이블 우선, users 테이블 fallback)
    let student = null;

    // User 테이블 조회
    try {
      student = await DB.prepare(`
        SELECT * FROM User 
        WHERE phone = ? AND role = 'STUDENT'
      `).bind(normalizedPhone).first();

      if (!student) {
        // 하이픈 포함된 형식도 시도
        const phoneWithHyphen = normalizedPhone.replace(/^(\d{3})(\d{4})(\d{4})$/, '$1-$2-$3');
        student = await DB.prepare(`
          SELECT * FROM User 
          WHERE phone = ? AND role = 'STUDENT'
        `).bind(phoneWithHyphen).first();
      }
    } catch (e) {
      console.log('User 테이블 조회 실패:', e.message);
    }

    // users 테이블 조회 (fallback)
    if (!student) {
      try {
        student = await DB.prepare(`
          SELECT * FROM users 
          WHERE phone = ? AND role = 'STUDENT'
        `).bind(normalizedPhone).first();

        if (!student) {
          const phoneWithHyphen = normalizedPhone.replace(/^(\d{3})(\d{4})(\d{4})$/, '$1-$2-$3');
          student = await DB.prepare(`
            SELECT * FROM users 
            WHERE phone = ? AND role = 'STUDENT'
          `).bind(phoneWithHyphen).first();
        }
      } catch (e) {
        console.log('users 테이블 조회 실패:', e.message);
      }
    }

    if (!student) {
      console.error('❌ 전화번호로 학생을 찾을 수 없음:', normalizedPhone);
      return new Response(JSON.stringify({
        success: false,
        error: '해당 전화번호로 등록된 학생을 찾을 수 없습니다.',
        debug: { phone: normalizedPhone }
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ 학생 발견:', { id: student.id, name: student.name, phone: student.phone });

    // 한국 시간 계산
    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const today = koreaTime.toISOString().split('T')[0];
    const currentTime = koreaTime.toISOString().split('T')[1].split('.')[0];

    console.log('📅 현재 한국 시간:', { today, currentTime });

    // 오늘 이미 출석했는지 확인 (attendance_records_v2 사용)
    let existingAttendance = null;
    try {
      existingAttendance = await DB.prepare(`
        SELECT * FROM attendance_records_v2
        WHERE userId = ? AND SUBSTR(checkInTime, 1, 10) = ?
        ORDER BY id DESC LIMIT 1
      `).bind(student.id, today).first();
    } catch (e) {
      console.log('attendance_records_v2 조회 실패:', e.message);
    }

    if (existingAttendance) {
      console.log('ℹ️ 이미 출석 완료:', existingAttendance);
      return new Response(JSON.stringify({
        success: true,
        student: student,
        attendance: existingAttendance,
        alreadyCheckedIn: true,
        message: '이미 오늘 출석하셨습니다.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 출석 시간 체크 (9시 이후면 지각)
    const hour = parseInt(currentTime.split(':')[0]);
    const minute = parseInt(currentTime.split(':')[1]);
    const isLate = hour > 9 || (hour === 9 && minute > 0);

    console.log('⏰ 출석 시각:', { hour, minute, isLate });

    // 새 출석 기록 생성 (attendance_records_v2 사용)
    const attendanceStatus = isLate ? 'LATE' : 'PRESENT';
    const recordId = `${student.id}-${today}-${Date.now()}`;

    try {
      // 테이블 생성 (없을 경우 대비)
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

      // 출석 기록 삽입
      await DB.prepare(`
        INSERT INTO attendance_records_v2 (id, userId, code, checkInTime, status, academyId)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        recordId,
        student.id,
        normalizedPhone,  // 전화번호를 code로 저장
        `${today} ${currentTime}`,
        attendanceStatus,
        student.academyId || student.academy_id || null
      ).run();

      console.log('✅ 출석 기록 생성 완료');

      // 생성된 출석 기록 조회
      const newAttendance = await DB.prepare(`
        SELECT * FROM attendance_records_v2
        WHERE userId = ? AND SUBSTR(checkInTime, 1, 10) = ?
        ORDER BY id DESC LIMIT 1
      `).bind(student.id, today).first();

      return new Response(JSON.stringify({
        success: true,
        student: student,
        attendance: newAttendance,
        alreadyCheckedIn: false,
        message: attendanceStatus === 'LATE' ? '지각 처리되었습니다.' : '출석 완료되었습니다.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (e: any) {
      console.error('❌ 출석 기록 생성 실패:', e.message);
      return new Response(JSON.stringify({
        success: false,
        error: '출석 기록 생성에 실패했습니다.',
        details: e.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error: any) {
    console.error('❌ 전화번호 출석 인증 오류:', error);
    return new Response(JSON.stringify({
      success: false,
      error: '서버 오류가 발생했습니다.',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
