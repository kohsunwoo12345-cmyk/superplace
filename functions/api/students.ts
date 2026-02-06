interface Env {
  DB: D1Database;
}

// 학생 목록 조회 (역할 및 권한 기반 필터링)
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const academyId = url.searchParams.get('academyId');
    const role = url.searchParams.get('role');
    const userId = url.searchParams.get('userId'); // 요청한 사용자 ID

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log('🔍 Students API called with:', { role, academyId, userId });

    let query = '';
    const params: any[] = [];

    // 역할별 쿼리 분기
    const isGlobalAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
    
    if (role === 'DIRECTOR' || isGlobalAdmin) {
      // 원장: 해당 학원의 모든 학생
      // 관리자: 모든 학원의 모든 학생
      query = `
        SELECT 
          u.id,
          u.email,
          u.name,
          u.phone,
          u.role,
          u.academyId,
          a.name as academyName,
          u.primaryClassId,
          c.name as className,
          u.createdAt,
          u.lastLoginAt
        FROM users u
        LEFT JOIN classes c ON u.primaryClassId = c.id
        LEFT JOIN academy a ON CAST(u.academyId AS TEXT) = CAST(a.id AS TEXT)
        WHERE u.role = 'STUDENT'
      `;

      // 관리자가 아닌 경우에만 academyId 필터링
      if (!isGlobalAdmin && academyId) {
        query += ` AND (CAST(u.academyId AS TEXT) = ? OR u.academyId = ?)`;
        params.push(String(academyId), parseInt(academyId));
        console.log('🔍 Filtering by academyId:', academyId, 'for DIRECTOR');
      } else if (isGlobalAdmin) {
        console.log('✅ Global admin - showing all students');
      }

      query += ` ORDER BY u.createdAt DESC`;
    } else if (role === 'TEACHER' && userId) {
      // 선생님: 권한 확인
      // 1. 선생님의 권한 조회
      const permissions = await DB.prepare(`
        SELECT canViewAllStudents FROM teacher_permissions
        WHERE teacherId = ? AND academyId = ?
      `).bind(parseInt(userId), parseInt(academyId || '0')).first();

      if (permissions && permissions.canViewAllStudents === 1) {
        // 전체 학생 조회 권한이 있으면 학원의 모든 학생
        query = `
          SELECT 
            u.id,
            u.email,
            u.name,
            u.phone,
            u.role,
            u.academyId,
            u.primaryClassId,
            c.name as className,
            u.createdAt,
            u.lastLoginAt
          FROM users u
          LEFT JOIN classes c ON u.primaryClassId = c.id
          WHERE u.role = 'STUDENT' AND u.academyId = ?
          ORDER BY u.createdAt DESC
        `;
        params.push(parseInt(academyId || '0'));
      } else {
        // 배정된 반의 학생만 조회
        query = `
          SELECT DISTINCT
            u.id,
            u.email,
            u.name,
            u.phone,
            u.role,
            u.academyId,
            u.primaryClassId,
            c.name as className,
            u.createdAt,
            u.lastLoginAt
          FROM users u
          INNER JOIN class_students cs ON u.id = cs.studentId
          INNER JOIN classes c ON cs.classId = c.id
          LEFT JOIN classes pc ON u.primaryClassId = pc.id
          WHERE u.role = 'STUDENT' 
            AND c.teacherId = ?
            AND cs.status = 'active'
          ORDER BY u.createdAt DESC
        `;
        params.push(parseInt(userId));
      }
    } else {
      // 그 외의 경우 (학생 등): 빈 결과 반환
      return new Response(
        JSON.stringify({
          success: true,
          students: [],
          count: 0,
          message: "권한이 없습니다",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const result = await DB.prepare(query).bind(...params).all();

    // 각 학생의 반 정보 추가
    const studentsWithClasses = await Promise.all(
      (result.results || []).map(async (student: any) => {
        const classes = await DB.prepare(`
          SELECT 
            c.id,
            c.name,
            c.subject,
            cs.enrolledAt
          FROM class_students cs
          JOIN classes c ON cs.classId = c.id
          WHERE cs.studentId = ? AND cs.status = 'active'
        `).bind(student.id).all();

        return {
          ...student,
          classes: classes.results || [],
        };
      })
    );

    return new Response(
      JSON.stringify({
        success: true,
        students: studentsWithClasses,
        count: studentsWithClasses.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Fetch students error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch students",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
