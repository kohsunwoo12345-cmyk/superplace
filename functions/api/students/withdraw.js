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
    const { studentId, reason } = body;

    if (!studentId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Student ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('🔍 Withdrawing student:', { studentId, reason });

    // Get student info
    const student = await db
      .prepare('SELECT id, name, academyId FROM User WHERE id = ? AND role = ?')
      .bind(studentId, 'STUDENT')
      .first();

    if (!student) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Student not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user has permission to withdraw this student
    if (role === 'DIRECTOR' && student.academyId !== user.academyId) {
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
    
    await db
      .prepare(`
        UPDATE User 
        SET status = ?, withdrawalReason = ?, withdrawalDate = ?
        WHERE id = ?
      `)
      .bind('WITHDRAWN', reason || '사유 없음', now, studentId)
      .run();

    console.log('✅ Student withdrawn:', { studentId, name: student.name });

    return new Response(JSON.stringify({
      success: true,
      message: '학생이 퇴원 처리되었습니다',
      studentId: studentId
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
