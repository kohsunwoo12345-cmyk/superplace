// 테스트용 학생 상세 정보 조회 API (인증 없음)
// GET /api/student/get-test?id=<student_id>

export async function onRequestGet(context) {
  const { request, env } = context;
  const { DB } = env;

  if (!DB) {
    return Response.json({ 
      success: false, 
      error: "Database not configured" 
    }, { status: 500 });
  }

  try {
    const url = new URL(request.url);
    const studentId = url.searchParams.get('id');
    
    if (!studentId) {
      return Response.json({ 
        success: false, 
        error: "학생 ID가 필요합니다" 
      }, { status: 400 });
    }

    console.log('👨‍🎓 학생 상세 조회 (테스트):', { studentId });

    // 학생 정보 조회 (User 테이블)
    let student = null;
    
    try {
      const userResult = await DB.prepare(`
        SELECT 
          id, email, name, phone, role, academyId, 
          school, grade, createdAt
        FROM User
        WHERE id = ?
      `).bind(studentId).first();
      
      if (userResult && userResult.role === 'STUDENT') {
        student = userResult;
        console.log('✅ User 테이블에서 학생 조회 성공');
      }
    } catch (e) {
      console.log('⚠️ User 테이블 조회 실패:', e.message);
    }

    if (!student) {
      return Response.json({ 
        success: false, 
        error: "학생 정보를 찾을 수 없습니다",
        debug: { studentId, searched: 'User table' }
      }, { status: 404 });
    }

    // Academy 정보 조회
    if (student.academyId) {
      try {
        const academy = await DB.prepare(`
          SELECT name, code, address, phone
          FROM Academy
          WHERE id = ?
        `).bind(student.academyId).first();
        
        if (academy) {
          student.academy_name = academy.name;
          student.academy_code = academy.code;
        }
      } catch (e) {
        console.log('⚠️ Academy 조회 실패:', e.message);
      }
    }

    // 응답 데이터 구성
    const response = {
      success: true,
      student: {
        id: student.id,
        email: student.email,
        name: student.name,
        phone: student.phone,
        school: student.school,
        grade: student.grade,
        academyId: student.academyId,
        academyName: student.academy_name,
        academyCode: student.academy_code,
        createdAt: student.createdAt
      }
    };

    console.log('✅ 학생 상세 정보 조회 완료');
    return Response.json(response, { status: 200 });

  } catch (error) {
    console.error('❌ 학생 상세 조회 에러:', error);
    return Response.json({ 
      success: false, 
      error: "서버 오류가 발생했습니다",
      message: error.message 
    }, { status: 500 });
  }
}
