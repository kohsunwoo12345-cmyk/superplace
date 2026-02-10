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

    // 테이블 생성 및 컬럼 추가
    await DB.batch([
      DB.prepare(`
        CREATE TABLE IF NOT EXISTS homework_assignments (
          id TEXT PRIMARY KEY,
          teacherId INTEGER NOT NULL,
          teacherName TEXT,
          academyId TEXT,
          title TEXT NOT NULL,
          description TEXT,
          subject TEXT,
          dueDate TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          status TEXT DEFAULT 'active',
          targetType TEXT DEFAULT 'all'
        )
      `),
      DB.prepare(`
        CREATE TABLE IF NOT EXISTS homework_assignment_targets (
          id TEXT PRIMARY KEY,
          assignmentId TEXT NOT NULL,
          studentId INTEGER NOT NULL,
          studentName TEXT,
          status TEXT DEFAULT 'pending',
          submittedAt TEXT,
          score INTEGER,
          submissionId TEXT,
          createdAt TEXT NOT NULL,
          FOREIGN KEY (assignmentId) REFERENCES homework_assignments(id)
        )
      `)
    ]);

    // 기존 테이블에 submissionId 컬럼 추가 (없으면)
    try {
      await DB.prepare(`
        ALTER TABLE homework_assignment_targets 
        ADD COLUMN submissionId TEXT
      `).run();
      console.log('✅ submissionId 컬럼 추가됨');
    } catch (e) {
      // 이미 컬럼이 존재하면 무시
      console.log('ℹ️ submissionId 컬럼 이미 존재');
    }

    console.log('✅ 숙제 테이블 확인 완료');

    // URL에서 파라미터 추출
    const url = new URL(context.request.url);
    const teacherId = url.searchParams.get("teacherId");
    const academyId = url.searchParams.get("academyId");

    if (!teacherId) {
      return new Response(
        JSON.stringify({ success: false, error: "Teacher ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 교사가 생성한 숙제 목록 조회
    let query = `
      SELECT 
        ha.id,
        ha.teacherId,
        ha.teacherName,
        ha.title,
        ha.description,
        ha.subject,
        ha.dueDate,
        ha.createdAt,
        ha.status,
        ha.targetType,
        COUNT(DISTINCT hat.studentId) as targetStudentCount,
        COUNT(DISTINCT CASE WHEN hat.status = 'submitted' THEN hat.studentId END) as submittedCount
      FROM homework_assignments ha
      LEFT JOIN homework_assignment_targets hat ON ha.id = hat.assignmentId
      WHERE ha.teacherId = ?
    `;

    const bindings: any[] = [parseInt(teacherId)];

    if (academyId) {
      // academyId를 문자열로도 비교 (DB에 "1.0" 같은 문자열로 저장될 수 있음)
      query += ` AND (CAST(ha.academyId AS TEXT) = ? OR ha.academyId = ?)`;
      bindings.push(String(academyId), parseInt(academyId));
    }

    query += `
      GROUP BY ha.id
      ORDER BY ha.createdAt DESC
    `;

    const assignments = await DB.prepare(query).bind(...bindings).all();

    // 각 숙제별 제출 현황 조회
    const assignmentsWithDetails = await Promise.all(
      (assignments.results || []).map(async (assignment: any) => {
        // 대상 학생 목록
        const targets = await DB.prepare(`
          SELECT 
            hat.studentId,
            hat.studentName,
            hat.status,
            hat.submissionId,
            hs.score,
            hs.submittedAt
          FROM homework_assignment_targets hat
          LEFT JOIN homework_submissions hs ON hat.submissionId = hs.id
          WHERE hat.assignmentId = ?
        `).bind(assignment.id).all();

        return {
          ...assignment,
          targets: targets.results || [],
        };
      })
    );

    // 통계 계산
    const totalAssignments = assignments.results?.length || 0;
    const activeAssignments = (assignments.results || []).filter((a: any) => a.status === 'active').length;
    const totalSubmissions = (assignments.results || []).reduce((sum: number, a: any) => sum + (a.submittedCount || 0), 0);

    return new Response(
      JSON.stringify({
        success: true,
        assignments: assignmentsWithDetails,
        summary: {
          totalAssignments,
          activeAssignments,
          totalSubmissions,
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Get teacher homework error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to get teacher homework",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
