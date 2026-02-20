// 학생 상세 정보 조회 API
// GET /api/students/[id]

export async function onRequestGet(context) {
  const { request, env, params } = context;

  if (!env.DB) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: "Database not configured" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "인증 토큰이 필요합니다" 
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Simple token parsing (format: id|email|role)
    let userEmail = null;
    try {
      const parts = token.split('|');
      if (parts.length >= 2) {
        userEmail = parts[1]; // email is second part
      }
    } catch (e) {
      console.error('토큰 파싱 오류:', e);
    }

    const studentId = params.id;
    console.log('👨‍🎓 학생 상세 정보 조회:', { studentId, token: token.substring(0, 20) + '...', userEmail });

    if (!userEmail) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "유효하지 않은 토큰입니다" 
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // DB에서 요청자 정보 조회
    const requester = await env.DB.prepare(`
      SELECT id, email, role, academyId
      FROM User
      WHERE email = ?
    `).bind(userEmail).first();

    if (!requester) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "사용자를 찾을 수 없습니다" 
      }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 학생 기본 정보 조회
    const student = await env.DB.prepare(`
      SELECT u.id, u.email, u.name, u.phone, u.role, u.academyId,
             a.name as academy_name, a.code as academy_code
      FROM User u
      LEFT JOIN Academy a ON u.academyId = a.id
      WHERE u.id = ? AND UPPER(u.role) = 'STUDENT'
    `).bind(studentId).first();

    if (!student) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "학생을 찾을 수 없습니다" 
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 권한 확인
    if (requester.role === 'STUDENT') {
      // 학생 본인만 조회 가능
      if (requester.id !== student.id) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "본인 정보만 조회할 수 있습니다" 
        }), { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } else if (['TEACHER', 'DIRECTOR'].includes(requester.role)) {
      // 선생님/원장은 같은 학원 학생만 조회 가능
      if (requester.academyId !== student.academyId) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "같은 학원 학생만 조회할 수 있습니다" 
        }), { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    // SUPER_ADMIN, ADMIN은 모든 학생 조회 가능

    // 학생이 속한 반 조회
    let classes = [];
    try {
      const classesResult = await env.DB.prepare(`
        SELECT c.id as classId, c.name as className, c.grade, c.subject
        FROM ClassStudent cs
        JOIN Class c ON cs.classId = c.id
        WHERE cs.studentId = ?
      `).bind(studentId).all();
      classes = classesResult.results || [];
    } catch (e) {
      console.log('반 정보 조회 실패 (무시):', e.message);
    }

    // 출석 통계
    let attendanceStats = { total: 0, present: 0, late: 0, absent: 0, attendanceRate: 0 };
    try {
      const attendanceResult = await env.DB.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
          SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
          SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent
        FROM Attendance
        WHERE userId = ?
      `).bind(studentId).first();
      
      if (attendanceResult && attendanceResult.total > 0) {
        attendanceStats = {
          total: attendanceResult.total || 0,
          present: attendanceResult.present || 0,
          late: attendanceResult.late || 0,
          absent: attendanceResult.absent || 0,
          attendanceRate: Math.round(((attendanceResult.present || 0) / (attendanceResult.total || 1)) * 100)
        };
      }
    } catch (e) {
      console.log('출석 통계 조회 실패 (무시):', e.message);
    }

    // AI 챗봇 사용 횟수
    let chatCount = 0;
    try {
      const chatResult = await env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM ChatHistory
        WHERE studentId = ?
      `).bind(studentId).first();
      chatCount = chatResult?.count || 0;
    } catch (e) {
      console.log('챗봇 사용 횟수 조회 실패 (무시):', e.message);
    }

    // 숙제 제출 현황
    let homeworkStats = { total: 0, submitted: 0, submissionRate: 0 };
    try {
      const homeworkResult = await env.DB.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted
        FROM HomeworkSubmission
        WHERE userId = ?
      `).bind(studentId).first();
      
      if (homeworkResult && homeworkResult.total > 0) {
        homeworkStats = {
          total: homeworkResult.total || 0,
          submitted: homeworkResult.submitted || 0,
          submissionRate: Math.round(((homeworkResult.submitted || 0) / (homeworkResult.total || 1)) * 100)
        };
      }
    } catch (e) {
      console.log('숙제 통계 조회 실패 (무시):', e.message);
    }

    const studentDetail = {
      ...student,
      classes,
      attendanceStats,
      chatCount,
      homeworkStats
    };

    console.log('✅ 학생 상세 정보 조회 완료:', {
      studentId,
      name: student.name,
      classCount: classes.length,
      attendanceRate: attendanceStats.attendanceRate,
      chatCount
    });

    return new Response(JSON.stringify({
      success: true,
      student: studentDetail
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("학생 상세 정보 조회 오류:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "학생 상세 정보 조회 실패"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
