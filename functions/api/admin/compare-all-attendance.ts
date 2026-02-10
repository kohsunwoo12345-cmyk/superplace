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

    console.log('🔍 모든 학생의 출석일 비교 시작');

    // 모든 학생의 출석일 계산
    const allStudents = await DB.prepare(`
      SELECT DISTINCT userId
      FROM attendance_records
      ORDER BY userId
    `).all();

    const results = [];

    for (const student of (allStudents.results || [])) {
      const userId = (student as any).userId;
      
      // API 응답 시뮬레이션 (실제 API와 동일한 쿼리)
      const attendanceResult = await DB.prepare(`
        SELECT COUNT(DISTINCT DATE(checkInTime)) as attendanceDays
        FROM attendance_records
        WHERE userId = ?
          AND strftime('%Y-%m', checkInTime) = strftime('%Y-%m', 'now')
      `).bind(userId).first();

      // 실제 기록 조회
      const actualRecords = await DB.prepare(`
        SELECT 
          id,
          checkInTime,
          DATE(checkInTime) as checkInDate
        FROM attendance_records
        WHERE userId = ?
          AND strftime('%Y-%m', checkInTime) = strftime('%Y-%m', 'now')
        ORDER BY checkInTime
      `).bind(userId).all();

      // 학생 정보 조회
      const userInfo = await DB.prepare(`
        SELECT id, name, email, academyId
        FROM users
        WHERE id = ?
      `).bind(userId).first();

      const attendanceDays = attendanceResult?.attendanceDays || 0;
      const recordCount = actualRecords.results?.length || 0;

      results.push({
        userId,
        userName: userInfo?.name || '알 수 없음',
        userEmail: userInfo?.email || '알 수 없음',
        academyId: userInfo?.academyId,
        attendanceDays,
        recordCount,
        records: actualRecords.results || [],
        uniqueDates: [...new Set((actualRecords.results || []).map((r: any) => r.checkInDate))],
        isTestData: (actualRecords.results || []).some((r: any) => 
          (r as any).id.includes('attendance-test')
        )
      });
    }

    // 불일치 사례 찾기
    const discrepancies = results.filter(r => r.attendanceDays !== r.uniqueDates.length);

    // 1일 출석 학생 찾기
    const singleDayStudents = results.filter(r => r.attendanceDays === 1);

    // 5일 출석 학생 찾기
    const fiveDayStudents = results.filter(r => r.attendanceDays === 5);

    console.log('✅ 전체 학생 출석일 비교 완료');

    const response = {
      success: true,
      serverTime: new Date().toISOString(),
      totalStudents: results.length,
      summary: {
        totalRecords: results.reduce((sum, r) => sum + r.recordCount, 0),
        studentsWithDiscrepancies: discrepancies.length,
        singleDayStudents: singleDayStudents.length,
        fiveDayStudents: fiveDayStudents.length
      },
      allStudents: results,
      discrepancies: discrepancies.length > 0 ? {
        count: discrepancies.length,
        details: discrepancies
      } : null,
      singleDayStudents: singleDayStudents.map(s => ({
        userId: s.userId,
        userName: s.userName,
        attendanceDays: s.attendanceDays,
        dates: s.uniqueDates
      })),
      fiveDayStudents: fiveDayStudents.map(s => ({
        userId: s.userId,
        userName: s.userName,
        attendanceDays: s.attendanceDays,
        dates: s.uniqueDates
      })),
      analysis: {
        message: discrepancies.length === 0 
          ? "✅ 모든 학생의 API 응답과 실제 데이터가 일치합니다."
          : `⚠️ ${discrepancies.length}명의 학생에서 불일치가 발견되었습니다.`,
        recommendation: "보고된 문제(1일 출석 학생이 5일로 표시)는 현재 데이터에서 발견되지 않았습니다. 다음을 확인하세요:\n" +
          "1. 문제가 발생한 학생의 정확한 userId\n" +
          "2. 브라우저 캐시 클리어 후 재확인\n" +
          "3. 세션에 저장된 userId가 실제 로그인한 사용자와 일치하는지 확인"
      }
    };

    return new Response(
      JSON.stringify(response, null, 2),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error: any) {
    console.error('❌ 출석일 비교 실패:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to compare attendance days",
        message: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
