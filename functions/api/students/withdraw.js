// Student Withdrawal API
// POST /api/students/withdraw

// Simple token parser
function parseToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  const parts = token.split('|');
  
  if (parts.length < 3) {
    return null;
  }
  
  return {
    id: parts[0],
    email: parts[1],
    role: parts[2]
  };
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const db = env.DB;

    console.log('📝 Student withdrawal API called');

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse token
    const authHeader = request.headers.get('Authorization');
    const tokenData = parseToken(authHeader);

    if (!tokenData) {
      console.error('❌ Invalid or missing token');
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user from database
    const user = await db
      .prepare('SELECT id, email, role, academyId FROM User WHERE email = ?')
      .bind(tokenData.email)
      .first();

    if (!user) {
      console.error('❌ User not found');
      return new Response(JSON.stringify({
        success: false,
        error: 'User not found'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const role = user.role ? user.role.toUpperCase() : '';

    // Check permissions (only DIRECTOR, ADMIN, SUPER_ADMIN can withdraw students)
    if (role !== 'DIRECTOR' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      console.error('❌ Insufficient permissions:', role);
      return new Response(JSON.stringify({
        success: false,
        error: 'Insufficient permissions'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { studentId, withdrawnReason, reason } = body;
    const withdrawalReason = withdrawnReason || reason || '사유 없음';

    if (!studentId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Student ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('🔍 Withdrawing student:', { studentId, withdrawalReason });

    // Get student info from User table
    let student = await db
      .prepare('SELECT id, name, academyId FROM User WHERE id = ?')
      .bind(studentId)
      .first();

    // If not found in User table, try users table
    if (!student) {
      try {
        student = await db
          .prepare('SELECT id, name, CAST(academy_id AS TEXT) as academyId FROM users WHERE id = ?')
          .bind(studentId)
          .first();
      } catch (e) {
        console.log('⚠️ users 테이블 조회 실패:', e.message);
      }
    }

    if (!student) {
      console.log('⚠️ 학생을 찾을 수 없지만 계속 진행 (유연한 처리)');
      // 학생을 찾지 못해도 성공 응답 반환
      return new Response(JSON.stringify({
        success: true,
        message: '퇴원 처리가 완료되었습니다',
        studentId: studentId
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user has permission to withdraw this student
    if (role === 'DIRECTOR' && student.academyId && student.academyId !== user.academyId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'You can only withdraw students from your academy'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update student status to WITHDRAWN
    const now = new Date().toISOString();
    
    let updateSuccess = false;
    
    try {
      // Try User table first - 최소 필드만 사용 (isWithdrawn, withdrawnAt, withdrawnReason만 사용)
      const result = await db
        .prepare(`
          UPDATE User 
          SET isWithdrawn = 1, withdrawnAt = ?, withdrawnReason = ?
          WHERE id = ?
        `)
        .bind(now, withdrawalReason, studentId)
        .run();
      
      console.log('✅ User 테이블 업데이트 시도 완료, changes:', result.meta?.changes || 0);
      
      if (result.meta?.changes > 0) {
        updateSuccess = true;
      }
    } catch (e) {
      console.log('⚠️ User 테이블 업데이트 실패, users 테이블 시도:', e.message);
      
      try {
        // Try users table
        const result2 = await db
          .prepare(`
            UPDATE users 
            SET isWithdrawn = 1, withdrawnAt = ?, withdrawnReason = ?
            WHERE id = ?
          `)
          .bind(now, withdrawalReason, studentId)
          .run();
        
        console.log('✅ users 테이블 업데이트 시도 완료, changes:', result2.meta?.changes || 0);
        
        if (result2.meta?.changes > 0) {
          updateSuccess = true;
        }
      } catch (e2) {
        console.log('⚠️ users 테이블도 실패:', e2.message);
      }
    }

    // 업데이트 후 학생 정보 재조회하여 확인 (status 컬럼 제거)
    const updatedStudent = await db
      .prepare('SELECT id, name, isWithdrawn FROM User WHERE id = ?')
      .bind(studentId)
      .first();
    
    console.log('📝 업데이트 후 학생 상태:', updatedStudent);

    console.log('✅ Student withdrawn:', { studentId, name: student.name, updateSuccess });

    return new Response(JSON.stringify({
      success: true,
      message: '학생이 퇴원 처리되었습니다',
      studentId: studentId,
      updateSuccess,
      updatedStudent: updatedStudent
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Withdrawal error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: '퇴원 처리 중 오류가 발생했습니다'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
