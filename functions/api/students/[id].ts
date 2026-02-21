// 학생 상세 정보 조회 API
// GET /api/students/[id]

import { decodeToken } from '../../_lib/auth';

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;

  if (!env.DB) {
    return Response.json({ 
      success: false, 
      error: "Database not configured" 
    }, { status: 500 });
  }

  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ 
        success: false, 
        error: "인증 토큰이 필요합니다" 
      }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // auth.ts의 decodeToken 사용
    const payload = decodeToken(token);
    
    if (!payload) {
      return Response.json({ 
        success: false, 
        error: "유효하지 않은 토큰입니다" 
      }, { status: 401 });
    }

    const userEmail = payload.email;
    const studentId = params.id;
    console.log('👨‍🎓 학생 상세 정보 조회:', { studentId, userEmail });

    // 패턴 시도: 요청자 정보 조회
    let requester: any = null;
    
    // 패턴 1: User + academyId
    try {
      requester = await env.DB.prepare(`
        SELECT id, email, role, academyId
        FROM User
        WHERE email = ?
      `).bind(userEmail).first();
      if (requester) console.log('✅ 요청자 조회 성공 (User + academyId)');
    } catch (e: any) {
      console.log('❌ 패턴 1 실패:', e.message);
    }

    // 패턴 2: users + academyId
    if (!requester) {
      try {
        requester = await env.DB.prepare(`
          SELECT id, email, role, academyId
          FROM users
          WHERE email = ?
        `).bind(userEmail).first();
        if (requester) console.log('✅ 요청자 조회 성공 (users + academyId)');
      } catch (e: any) {
        console.log('❌ 패턴 2 실패:', e.message);
      }
    }

    // 패턴 3: users + academy_id
    if (!requester) {
      try {
        requester = await env.DB.prepare(`
          SELECT id, email, role, academy_id as academyId
          FROM users
          WHERE email = ?
        `).bind(userEmail).first();
        if (requester) console.log('✅ 요청자 조회 성공 (users + academy_id)');
      } catch (e: any) {
        console.log('❌ 패턴 3 실패:', e.message);
      }
    }

    if (!requester) {
      return Response.json({ 
        success: false, 
        error: "사용자를 찾을 수 없습니다" 
      }, { status: 403 });
    }

    // 패턴 시도: 학생 기본 정보 조회
    let student: any = null;

    // 패턴 1: users 테이블 먼저 (가장 일반적)
    try {
      student = await env.DB.prepare(`
        SELECT u.id, u.email, u.name, u.phone, u.role, u.academyId, u.password, u.school, u.grade
        FROM users u
        WHERE u.id = ? AND UPPER(u.role) = 'STUDENT'
      `).bind(studentId).first();
      
      if (student) {
        console.log('✅ 학생 조회 성공 (users)');
        console.log('📊 users 테이블 데이터:', JSON.stringify(student, null, 2));
        
        // academy 테이블에서 학원 정보 조회
        if (student.academyId) {
          try {
            const academy = await env.DB.prepare(`
              SELECT name as academy_name, code as academy_code
              FROM academy
              WHERE id = ?
            `).bind(student.academyId).first();
            
            if (academy) {
              student = { ...student, ...academy };
              console.log('✅ academy 정보 추가');
            }
          } catch (e) {
            console.log('⚠️ academy 테이블 없음 (무시)');
          }
        }
      }
    } catch (e: any) {
      console.log('❌ users 테이블 조회 실패:', e.message);
    }

    // 패턴 2: User 테이블 시도 (PascalCase)
    if (!student) {
      try {
        student = await env.DB.prepare(`
          SELECT u.id, u.email, u.name, u.phone, u.role, u.academyId, u.password, u.school, u.grade
          FROM User u
          WHERE u.id = ? AND UPPER(u.role) = 'STUDENT'
        `).bind(studentId).first();
        
        if (student) {
          console.log('✅ 학생 조회 성공 (User)');
          
          // Academy 테이블 시도
          if (student.academyId) {
            try {
              const academy = await env.DB.prepare(`
                SELECT name as academy_name, code as academy_code
                FROM Academy
                WHERE id = ?
              `).bind(student.academyId).first();
              
              if (academy) {
                student = { ...student, ...academy };
              }
            } catch (e) {
              console.log('⚠️ Academy 테이블 없음');
            }
          }
        }
      } catch (e: any) {
        console.log('❌ User 테이블 조회 실패:', e.message);
      }
    }

    if (!student) {
      return Response.json({ 
        success: false, 
        error: "학생을 찾을 수 없습니다" 
      }, { status: 404 });
    }

    // 권한 확인
    if (requester.role === 'STUDENT') {
      // 학생 본인만 조회 가능
      if (requester.id !== student.id) {
        return Response.json({ 
          success: false, 
          error: "본인 정보만 조회할 수 있습니다" 
        }, { status: 403 });
      }
    } else if (['TEACHER', 'DIRECTOR'].includes(requester.role)) {
      // 선생님/원장은 같은 학원 학생만 조회 가능
      if (requester.academyId !== student.academyId) {
        return Response.json({ 
          success: false, 
          error: "같은 학원 학생만 조회할 수 있습니다" 
        }, { status: 403 });
      }
    }
    // SUPER_ADMIN, ADMIN은 모든 학생 조회 가능

    // 학생이 속한 반 조회 (여러 패턴 시도)
    let classes: any[] = [];
    try {
      const classesResult = await env.DB.prepare(`
        SELECT c.id as classId, c.name as className, c.grade, c.subject
        FROM ClassStudent cs
        JOIN Class c ON cs.classId = c.id
        WHERE cs.studentId = ?
      `).bind(studentId).all();
      classes = classesResult.results || [];
      console.log('✅ 반 조회 성공 (ClassStudent + Class)');
    } catch (e1: any) {
      console.log('❌ 반 조회 패턴 1 실패:', e1.message);
      try {
        const classesResult = await env.DB.prepare(`
          SELECT c.id as classId, c.name as className, c.grade, c.subject
          FROM class_students cs
          JOIN classes c ON cs.class_id = c.id
          WHERE cs.student_id = ?
        `).bind(studentId).all();
        classes = classesResult.results || [];
        console.log('✅ 반 조회 성공 (class_students + classes)');
      } catch (e2: any) {
        console.log('❌ 반 조회 패턴 2 실패:', e2.message);
      }
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
    } catch (e: any) {
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
    } catch (e: any) {
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
    } catch (e: any) {
      console.log('숙제 통계 조회 실패 (무시):', e.message);
    }

    const studentDetail = {
      ...student,
      classes,
      attendanceStats,
      chatCount,
      homeworkStats
      // password는 그대로 포함 (사용자 요청에 따라)
    };

    console.log('✅ 학생 상세 정보 조회 완료:', {
      studentId,
      name: student.name,
      grade: student.grade,
      school: student.school,
      password: student.password ? '설정됨' : '미설정',
      classCount: classes.length,
      attendanceRate: attendanceStats.attendanceRate,
      chatCount
    });

    return Response.json({
      success: true,
      student: studentDetail
    }, { status: 200 });

  } catch (error: any) {
    console.error("학생 상세 정보 조회 오류:", error);
    return Response.json({
      success: false,
      error: error.message || "학생 상세 정보 조회 실패"
    }, { status: 500 });
  }
};
// Force rebuild Sat Feb 21 23:08:58 UTC 2026
