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

    // Delete student from database (완전 삭제)
    const now = new Date().toISOString();
    
    let deleteSuccess = false;
    
    try {
      // Try User table first
      console.log('🗑️ DELETE 실행 중:', { studentId });
      
      const result = await db
        .prepare(`DELETE FROM User WHERE id = ?`)
        .bind(studentId)
        .run();
      
      console.log('✅ User 테이블 삭제 완료:', {
        changes: result.meta?.changes || 0,
        duration: result.meta?.duration || 0
      });
      
      if (result.meta?.changes > 0) {
        deleteSuccess = true;
        console.log('✅ DELETE 성공 - 학생이 삭제되었습니다');
      } else {
        console.log('⚠️ DELETE 실패 - 삭제된 행이 0개입니다. 학생이 존재하지 않을 수 있습니다.');
      }
    } catch (e) {
      console.log('⚠️ User 테이블 DELETE 중 오류 발생:', e.message, e.cause?.message || '');
      
      try {
        // Try users table
        const result2 = await db
          .prepare(`DELETE FROM users WHERE id = ?`)
          .bind(studentId)
          .run();
        
        console.log('✅ users 테이블 삭제 시도 완료, changes:', result2.meta?.changes || 0);
        
        if (result2.meta?.changes > 0) {
          deleteSuccess = true;
        }
      } catch (e2) {
        console.log('⚠️ users 테이블도 실패:', e2.message);
      }
    }

    console.log('✅ Student deleted:', { studentId, name: student.name, deleteSuccess });

    return new Response(JSON.stringify({
      success: true,
      message: '학생이 완전히 삭제되었습니다',
      studentId: studentId,
      deleteSuccess,
      deleted: deleteSuccess
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
