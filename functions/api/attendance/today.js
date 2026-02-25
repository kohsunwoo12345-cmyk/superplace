// 오늘 출석 현황 조회 API
// GET /api/attendance/today

import { getUserFromAuth } from '../../_lib/auth.js';

export async function onRequestGet(context) {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    
    if (!DB) {
      return Response.json({ error: "Database not configured" }, { status: 500 });
    }

    // 인증 확인
    const userPayload = getUserFromAuth(context.request);
    
    if (!userPayload) {
      return Response.json({ 
        success: false, 
        error: "인증이 필요합니다" 
      }, { status: 401 });
    }

    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
    const role = userPayload.role?.toUpperCase();
    const academyId = userPayload.academyId;

    console.log('📊 출석 현황 조회:', { date, role, academyId });

    // 관리자는 모든 출석 조회, 학원장/선생님은 자기 학원만
    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

    // 출석 기록 조회 - User 테이블과 users 테이블 모두 조회
    let attendanceQuery = `
      SELECT 
        ar.id,
        ar.userId,
        ar.code,
        ar.checkInTime,
        ar.status,
        ar.academyId,
        COALESCE(u1.name, u2.name) as userName,
        COALESCE(u1.email, u2.email) as userEmail,
        COALESCE(u1.academyId, CAST(u2.academyId AS TEXT)) as userAcademyId,
        hs.id as homeworkId,
        hs.submittedAt as homeworkSubmittedAt,
        hg.score as homeworkScore,
        hg.feedback as homeworkFeedback,
        hg.completion as homeworkCompletion
      FROM attendance_records_v2 ar
      LEFT JOIN User u1 ON u1.id = ar.userId
      LEFT JOIN users u2 ON u2.id = ar.userId
      LEFT JOIN homework_submissions_v2 hs ON hs.code = ar.code
      LEFT JOIN homework_gradings_v2 hg ON hg.submissionId = hs.id
      WHERE SUBSTR(ar.checkInTime, 1, 10) = ?
    `;

    const queryParams = [date];

    // 관리자가 아니면 학원 필터링
    if (!isAdmin && academyId) {
      attendanceQuery += ` AND (ar.academyId = ? OR u1.academyId = ? OR u2.academyId = ?)`;
      queryParams.push(academyId, academyId, academyId);
    }

    attendanceQuery += ` ORDER BY ar.checkInTime DESC`;

    const attendanceResult = await DB.prepare(attendanceQuery).bind(...queryParams).all();

    // 통계 계산
    const records = attendanceResult.results || [];
    const totalStudents = records.length;
    const presentCount = records.filter(r => r.status === 'PRESENT' || r.status === 'VERIFIED').length;
    const lateCount = records.filter(r => r.status === 'LATE').length;
    const homeworkSubmittedCount = records.filter(r => r.homeworkId).length;
    
    let avgScore = 0;
    const scoredHomework = records.filter(r => r.homeworkScore);
    if (scoredHomework.length > 0) {
      const totalScore = scoredHomework.reduce((sum, r) => sum + (r.homeworkScore || 0), 0);
      avgScore = Math.round(totalScore / scoredHomework.length);
    }

    // 출석 기록 포맷팅
    const formattedRecords = records.map(record => ({
      id: record.id,
      userId: record.userId,
      userName: record.userName,
      userEmail: record.userEmail,
      code: record.code,
      checkInTime: record.checkInTime,
      status: record.status,
      academyId: record.userAcademyId || record.academyId,
      homework: record.homeworkId ? {
        id: record.homeworkId,
        submittedAt: record.homeworkSubmittedAt,
        score: record.homeworkScore,
        feedback: record.homeworkFeedback,
        completion: record.homeworkCompletion
      } : null
    }));

    return Response.json({
      success: true,
      date,
      statistics: {
        total: totalStudents,
        present: presentCount,
        late: lateCount,
        homeworkSubmitted: homeworkSubmittedCount,
        averageScore: avgScore
      },
      records: formattedRecords
    }, { status: 200 });

  } catch (error) {
    console.error('❌ 출석 조회 에러:', error);
    return Response.json({ 
      success: false, 
      error: "서버 오류가 발생했습니다",
      message: error.message 
    }, { status: 500 });
  }
}
