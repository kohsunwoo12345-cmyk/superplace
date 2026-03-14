// ClassStudent 테이블 상세 진단 API
interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  
  if (!DB) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const url = new URL(context.request.url);
    const classId = url.searchParams.get('classId');
    const studentId = url.searchParams.get('studentId');

    const result: any = {
      timestamp: new Date().toISOString(),
      queries: []
    };

    // 1. ClassStudent 테이블 스키마
    try {
      const schema = await DB.prepare(`
        SELECT sql FROM sqlite_master 
        WHERE type='table' AND name='ClassStudent'
      `).first();
      result.classStudentSchema = schema;
    } catch (e: any) {
      result.classStudentSchemaError = e.message;
    }

    // 2. ClassStudent 전체 데이터 (최대 20개)
    try {
      const allData = await DB.prepare(`
        SELECT * FROM ClassStudent
        ORDER BY enrolledAt DESC
        LIMIT 20
      `).all();
      result.allClassStudents = {
        count: allData.results?.length || 0,
        data: allData.results
      };
    } catch (e: any) {
      result.allClassStudentsError = e.message;
    }

    // 3. 특정 classId로 조회
    if (classId) {
      try {
        const byClass = await DB.prepare(`
          SELECT 
            cs.*,
            u.name as studentName,
            u.email as studentEmail,
            c.name as className
          FROM ClassStudent cs
          LEFT JOIN users u ON cs.studentId = u.id
          LEFT JOIN Class c ON cs.classId = c.id
          WHERE cs.classId = ?
        `).bind(classId).all();
        
        result.byClassId = {
          classId,
          count: byClass.results?.length || 0,
          students: byClass.results
        };
      } catch (e: any) {
        result.byClassIdError = e.message;
      }
    }

    // 4. 특정 studentId로 조회
    if (studentId) {
      try {
        const byStudent = await DB.prepare(`
          SELECT 
            cs.*,
            c.name as className,
            c.grade as classGrade,
            c.description as classDescription
          FROM ClassStudent cs
          LEFT JOIN Class c ON cs.classId = c.id
          WHERE cs.studentId = ?
        `).bind(studentId).all();
        
        result.byStudentId = {
          studentId,
          count: byStudent.results?.length || 0,
          classes: byStudent.results
        };
      } catch (e: any) {
        result.byStudentIdError = e.message;
      }
    }

    // 5. Class 테이블의 학생 수 집계
    try {
      const classStats = await DB.prepare(`
        SELECT 
          c.id,
          c.name,
          c.grade,
          COUNT(cs.id) as studentCount
        FROM Class c
        LEFT JOIN ClassStudent cs ON c.id = cs.classId
        WHERE c.isActive = 1
        GROUP BY c.id, c.name, c.grade
        ORDER BY c.name
      `).all();
      
      result.classStats = classStats.results;
    } catch (e: any) {
      result.classStatsError = e.message;
    }

    // 6. 최근 추가된 ClassStudent 레코드 (마지막 10개)
    try {
      const recent = await DB.prepare(`
        SELECT 
          cs.*,
          u.name as studentName,
          c.name as className,
          datetime(cs.enrolledAt) as enrolledAtFormatted
        FROM ClassStudent cs
        LEFT JOIN users u ON cs.studentId = u.id
        LEFT JOIN Class c ON cs.classId = c.id
        ORDER BY cs.enrolledAt DESC
        LIMIT 10
      `).all();
      
      result.recentEnrollments = recent.results;
    } catch (e: any) {
      result.recentEnrollmentsError = e.message;
    }

    return new Response(JSON.stringify(result, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({
      error: 'Failed to diagnose ClassStudent table',
      message: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
