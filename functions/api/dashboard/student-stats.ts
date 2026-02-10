interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    
    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const url = new URL(context.request.url);
    const userId = url.searchParams.get('userId');
    const academyId = url.searchParams.get('academyId');

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "userId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('📊 학생 통계 조회:', { userId, academyId });

    // 1. 출석일 계산 (이번 달)
    const attendanceResult = await DB.prepare(`
      SELECT COUNT(DISTINCT DATE(checkInTime)) as attendanceDays
      FROM attendance_records
      WHERE userId = ?
        AND strftime('%Y-%m', checkInTime) = strftime('%Y-%m', 'now')
    `).bind(parseInt(userId)).first();

    console.log('✅ 출석일:', attendanceResult);

    // 2. 완료 과제 계산 (이번 달)
    const homeworkResult = await DB.prepare(`
      SELECT COUNT(*) as completedHomework
      FROM homework_submissions
      WHERE userId = ?
        AND strftime('%Y-%m', submittedAt) = strftime('%Y-%m', 'now')
    `).bind(parseInt(userId)).first();

    console.log('✅ 완료 과제:', homeworkResult);

    // 3. 평균 점수 계산 (전체)
    const scoreResult = await DB.prepare(`
      SELECT AVG(score) as averageScore
      FROM homework_submissions
      WHERE userId = ?
        AND score IS NOT NULL
    `).bind(parseInt(userId)).first();

    console.log('✅ 평균 점수:', scoreResult);

    // 4. 학습 시간 계산 (이번 주) - 임시로 출석 횟수 * 2시간으로 계산
    const studyTimeResult = await DB.prepare(`
      SELECT COUNT(*) * 2 as studyHours
      FROM attendance_records
      WHERE userId = ?
        AND date(checkInTime) >= date('now', 'weekday 0', '-7 days')
    `).bind(parseInt(userId)).first();

    console.log('✅ 학습 시간 (추정):', studyTimeResult);

    // 5. 제출할 과제 목록 (미제출, 마감일 임박 순)
    const pendingHomeworkResult = await DB.prepare(`
      SELECT 
        ha.id,
        ha.title,
        ha.subject,
        ha.dueDate,
        CAST((julianday(ha.dueDate) - julianday('now')) AS INTEGER) as daysLeft
      FROM homework_assignment_targets hat
      JOIN homework_assignments ha ON hat.assignmentId = ha.id
      WHERE hat.studentId = ?
        AND hat.status = 'pending'
        AND datetime(ha.dueDate) > datetime('now')
      ORDER BY ha.dueDate ASC
      LIMIT 5
    `).bind(parseInt(userId)).all();

    console.log('✅ 제출할 과제:', pendingHomeworkResult);

    // 6. 학원 정보 조회
    let academyName = null;
    if (academyId) {
      // academyId가 "1.0" 형식일 수 있으므로 parseFloat → Math.floor로 정수 변환
      const academyIdInt = Math.floor(parseFloat(academyId));
      const academyResult = await DB.prepare(`
        SELECT name FROM academy WHERE CAST(id AS TEXT) = ? OR id = ? OR id = ?
      `).bind(String(academyId), academyIdInt, String(academyIdInt)).first();
      
      if (academyResult) {
        academyName = academyResult.name;
        console.log('✅ 학원 이름:', academyName);
      } else {
        // academy가 없는 경우 기본 메시지
        academyName = '소속 학원 미설정';
        console.warn('⚠️ 학원을 찾을 수 없음:', academyId, '→ 기본 메시지 사용');
      }
    } else {
      // academyId가 없는 경우
      academyName = '소속 학원 정보 없음';
      console.warn('⚠️ academyId가 없음');
    }

    // 7. 오늘의 일정 (임시: 빈 배열 - classes 테이블 구조에 따라 수정 필요)
    const todaySchedule: any[] = [];

    // 응답 데이터 구성
    const stats = {
      success: true,
      attendanceDays: attendanceResult?.attendanceDays || 0,
      completedHomework: homeworkResult?.completedHomework || 0,
      averageScore: Math.round(scoreResult?.averageScore || 0),
      studyHours: Math.round(studyTimeResult?.studyHours || 0),
      pendingHomework: (pendingHomeworkResult.results || []).map((hw: any) => ({
        id: hw.id,
        title: hw.title,
        subject: hw.subject,
        dueDate: hw.dueDate,
        daysLeft: hw.daysLeft
      })),
      todaySchedule,
      academyName
    };

    console.log('📊 최종 통계:', stats);

    return new Response(
      JSON.stringify(stats),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error: any) {
    console.error('❌ 학생 통계 조회 실패:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch student stats",
        message: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
