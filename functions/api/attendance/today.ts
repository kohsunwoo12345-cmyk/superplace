interface Env {
  DB: D1Database;
}

// 한국 시간 (KST) 날짜 문자열 생성
function getKoreanDate(): string {
  const now = new Date();
  const kstOffset = 9 * 60; // 분 단위
  const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
  
  const year = kstTime.getFullYear();
  const month = String(kstTime.getMonth() + 1).padStart(2, '0');
  const day = String(kstTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

// 한국 시간 ISO 문자열로 변환
function toKoreanISO(dateStr: string): string {
  return `${dateStr}T00:00:00+09:00`;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const url = new URL(context.request.url);
    const date = url.searchParams.get("date") || getKoreanDate();
    const academyId = url.searchParams.get("academyId");
    const role = url.searchParams.get("role");

    console.log("📊 Attendance API called with:", { date, academyId, role });

    // 해당 날짜의 출석 기록 조회
    let query = `
      SELECT 
        ar.id,
        ar.userId,
        ar.code,
        ar.verifiedAt,
        ar.status,
        ar.homeworkSubmitted,
        ar.homeworkSubmittedAt,
        u.name as userName,
        u.email as userEmail,
        u.academyId,
        hs.score,
        hs.subject,
        hs.feedback
      FROM attendance_records ar
      LEFT JOIN users u ON ar.userId = u.id
      LEFT JOIN homework_submissions hs ON ar.id = hs.attendanceRecordId
      WHERE DATE(ar.verifiedAt) = ?
    `;
    const params: any[] = [date];

    // 학원별 필터링 (SUPER_ADMIN, ADMIN이 아닌 모든 경우)
    // DIRECTOR, TEACHER 등은 자신의 학원 데이터만 조회
    if (academyId) {
      const isGlobalAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';
      if (!isGlobalAdmin) {
        // 문자열과 정수 모두 비교
        query += ` AND (CAST(u.academyId AS TEXT) = ? OR u.academyId = ?)`;
        params.push(String(academyId), parseInt(academyId));
        console.log("🔍 Filtering by academyId:", academyId, "(both string and int)", "for role:", role);
      } else {
        console.log("✅ Global admin - showing all data");
      }
    } else {
      console.warn("⚠️ No academyId provided!");
    }

    query += ` ORDER BY ar.verifiedAt DESC`;

    const result = await DB.prepare(query).bind(...params).all();

    const records = (result.results || []).map((row: any) => ({
      id: row.id,
      userId: row.userId,
      userName: row.userName,
      userEmail: row.userEmail,
      code: row.code,
      verifiedAt: row.verifiedAt,
      status: row.status,
      homeworkSubmitted: row.homeworkSubmitted === 1,
      homeworkSubmittedAt: row.homeworkSubmittedAt,
      academyId: row.academyId,
      homework: row.score ? {
        score: row.score,
        subject: row.subject,
        feedback: row.feedback,
      } : null,
    }));

    // 통계 계산
    const totalAttendance = records.length;
    const homeworkSubmitted = records.filter(r => r.homeworkSubmitted).length;
    const homeworkPending = totalAttendance - homeworkSubmitted;
    const averageScore = records
      .filter(r => r.homework?.score)
      .reduce((sum, r) => sum + (r.homework?.score || 0), 0) / (homeworkSubmitted || 1);

    return new Response(
      JSON.stringify({
        success: true,
        date,
        statistics: {
          totalAttendance,
          homeworkSubmitted,
          homeworkPending,
          averageScore: Math.round(averageScore * 10) / 10,
        },
        records,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Failed to fetch attendance records:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch attendance records",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
