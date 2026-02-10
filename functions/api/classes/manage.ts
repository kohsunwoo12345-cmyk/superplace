interface Env {
  DB: D1Database;
}

/**
 * GET /api/classes/manage
 * 역할별 클래스 조회 (RBAC 적용)
 * 실제 D1 스키마에 맞춰 snake_case 컬럼명 사용
 * - ADMIN/SUPER_ADMIN/DIRECTOR: 전체 클래스 조회 (academy_id 기반)
 * - TEACHER: 배정된 클래스만 조회
 * - STUDENT: 소속된 클래스만 조회
 */
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
    const userId = url.searchParams.get("userId");
    const role = url.searchParams.get("role");
    const academyId = url.searchParams.get("academyId");

    console.log('📚 Classes manage API called:', { userId, role, academyId });

    if (!userId || !role) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "userId and role are required",
          classes: []
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const userIdNum = parseInt(userId);
    const upperRole = role.toUpperCase();
    
    let classes: any[] = [];

    // ADMIN/SUPER_ADMIN/DIRECTOR: 학원 전체 클래스 조회
    if (upperRole === 'ADMIN' || upperRole === 'SUPER_ADMIN' || upperRole === 'DIRECTOR') {
      console.log('🔑 Admin/Director access - fetching all classes');
      
      let query = `
        SELECT 
          c.id,
          c.academy_id as academyId,
          c.class_name as name,
          c.grade,
          c.description,
          c.teacher_id as teacherId,
          c.created_at as createdAt,
          c.color,
          c.schedule_days as scheduleDays,
          c.start_time as startTime,
          c.end_time as endTime,
          c.day_schedule as daySchedule,
          u.name as teacherName
        FROM classes c
        LEFT JOIN users u ON c.teacher_id = u.id
        WHERE 1=1
      `;

      const bindings: any[] = [];

      // academyId 필터 (숫자 또는 문자열 "1.0" 처리)
      if (academyId) {
        const academyIdNum = parseFloat(academyId);
        if (!isNaN(academyIdNum)) {
          query += ` AND c.academy_id = ?`;
          bindings.push(Math.floor(academyIdNum));
        }
      }

      query += ` ORDER BY c.created_at DESC`;

      console.log('📊 Admin query:', query, bindings);
      const result = await DB.prepare(query).bind(...bindings).all();
      classes = result.results || [];
      console.log('✅ Admin classes found:', classes.length);
    }
    // TEACHER: 배정된 클래스만 조회
    else if (upperRole === 'TEACHER') {
      console.log('👨‍🏫 Teacher access - fetching assigned classes');
      
      const query = `
        SELECT 
          c.id,
          c.academy_id as academyId,
          c.class_name as name,
          c.grade,
          c.description,
          c.teacher_id as teacherId,
          c.created_at as createdAt,
          c.color,
          c.schedule_days as scheduleDays,
          c.start_time as startTime,
          c.end_time as endTime,
          c.day_schedule as daySchedule,
          u.name as teacherName
        FROM classes c
        LEFT JOIN users u ON c.teacher_id = u.id
        WHERE c.teacher_id = ?
        ORDER BY c.created_at DESC
      `;

      console.log('📊 Teacher query:', query, [userIdNum]);
      const result = await DB.prepare(query).bind(userIdNum).all();
      classes = result.results || [];
      console.log('✅ Teacher classes found:', classes.length);
    }
    // STUDENT: 소속된 클래스만 조회
    else if (upperRole === 'STUDENT') {
      console.log('🎓 Student access - fetching enrolled classes');
      
      // students 테이블에서 class_id로 조회
      const query = `
        SELECT 
          c.id,
          c.academy_id as academyId,
          c.class_name as name,
          c.grade,
          c.description,
          c.teacher_id as teacherId,
          c.created_at as createdAt,
          c.color,
          c.schedule_days as scheduleDays,
          c.start_time as startTime,
          c.end_time as endTime,
          c.day_schedule as daySchedule,
          u.name as teacherName
        FROM students s
        INNER JOIN classes c ON s.class_id = c.id
        LEFT JOIN users u ON c.teacher_id = u.id
        WHERE s.user_id = ?
        ORDER BY c.created_at DESC
      `;

      console.log('📊 Student query:', query, [userIdNum]);
      const result = await DB.prepare(query).bind(userIdNum).all();
      classes = result.results || [];
      console.log('✅ Student classes found:', classes.length);
    }

    // 각 클래스에 학생 수 추가
    if (classes.length > 0) {
      console.log('📚 Fetching student counts...');
      
      for (const cls of classes) {
        // students 테이블에서 해당 class_id의 학생 수 조회
        const countResult = await DB.prepare(`
          SELECT COUNT(*) as count
          FROM students
          WHERE class_id = ?
        `).bind(cls.id).first();

        cls.studentCount = countResult?.count || 0;
        cls._count = {
          students: cls.studentCount
        };

        // 타입 변환
        cls.id = cls.id.toString();
        cls.isActive = true;
        cls.capacity = cls.studentCount;
        cls.subject = cls.grade || '';
        cls.status = 'active';

        // schedule_days가 JSON 문자열이면 파싱
        if (cls.scheduleDays && typeof cls.scheduleDays === 'string') {
          try {
            cls.scheduleDaysArray = JSON.parse(cls.scheduleDays);
          } catch (e) {
            cls.scheduleDaysArray = [];
          }
        }

        // day_schedule가 JSON 문자열이면 파싱
        if (cls.daySchedule && typeof cls.daySchedule === 'string') {
          try {
            cls.schedules = JSON.parse(cls.daySchedule);
          } catch (e) {
            cls.schedules = [];
          }
        } else {
          cls.schedules = [];
        }
      }
    }

    console.log('✅ Final classes count:', classes.length);
    console.log('📝 Classes data:', JSON.stringify(classes, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        classes: classes,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Get classes error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to get classes",
        message: error.message,
        classes: []
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
