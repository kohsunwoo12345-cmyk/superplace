// SMS 통계 API
// GET /api/admin/sms/stats

// Token parser
function parseToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  const parts = token.split('|');
  if (parts.length < 3) return null;
  return {
    id: parts[0],
    email: parts[1],
    role: parts[2],
    academyId: parts.length > 3 ? parts[3] : null
  };
}

export async function onRequest(context) {
  const { request, env } = context;

  try {
    // 인증 확인
    const authHeader = request.headers.get('Authorization');
    const tokenData = parseToken(authHeader);

    if (!tokenData) {
      return new Response(JSON.stringify({ 
        error: '인증이 필요합니다',
        success: false
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('📊 SMS Stats request from:', tokenData.email, tokenData.role);

    // 관리자 또는 원장만 조회 가능
    if (!['SUPER_ADMIN', 'ADMIN', 'DIRECTOR'].includes(tokenData.role)) {
      return new Response(JSON.stringify({ 
        error: '권한이 없습니다',
        success: false
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 사용자의 학원 ID 가져오기
    let academyId = tokenData.academyId;
    
    if (!academyId && tokenData.role !== 'SUPER_ADMIN') {
      // academyId가 토큰에 없으면 DB에서 조회
      const user = await env.DB.prepare(`
        SELECT academyId FROM User WHERE id = ?
      `).bind(tokenData.id).first();
      
      academyId = user?.academyId;
    }

    console.log('🏫 Academy ID:', academyId);
    console.log('👤 User role:', tokenData.role);
    console.log('📧 User email:', tokenData.email);

    // 학원의 SMS 포인트 잔액 조회
    let balance = 0;
    if (academyId) {
      console.log('🔍 Querying Academy table for:', academyId);
      const academy = await env.DB.prepare(`
        SELECT id, name, smsPoints FROM Academy WHERE id = ?
      `).bind(academyId).first();
      
      console.log('📦 Academy data:', JSON.stringify(academy));
      
      if (!academy) {
        console.error('❌ Academy not found for ID:', academyId);
      }
      
      balance = academy?.smsPoints || 0;
      console.log('💰 SMS Points balance:', balance);
    } else if (tokenData.role === 'SUPER_ADMIN') {
      // SUPER_ADMIN의 경우 전체 학원의 총 포인트
      const result = await env.DB.prepare(`
        SELECT SUM(smsPoints) as total FROM Academy
      `).first();
      
      balance = result?.total || 0;
      console.log('💰 Total SMS Points (all academies):', balance);
    } else {
      // ✅ academyId가 없을 때 fallback: 전체 학원 포인트 합계 반환
      console.log('⚠️ Academy ID not found, returning total points as fallback');
      const result = await env.DB.prepare(`
        SELECT SUM(smsPoints) as total FROM Academy
      `).first();
      
      balance = result?.total || 0;
      console.log('💰 Fallback - Total SMS Points:', balance);
    }

    // SMS 발송 통계 (학원별 또는 전체)
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    let totalSentQuery = `SELECT COUNT(*) as count FROM SMSLog WHERE status = ?`;
    let thisMonthQuery = `SELECT COUNT(*) as count FROM SMSLog WHERE status = ? AND sentAt >= ?`;
    const queryParams = ['success'];

    if (academyId && tokenData.role !== 'SUPER_ADMIN') {
      totalSentQuery += ` AND academyId = ?`;
      thisMonthQuery += ` AND academyId = ?`;
      queryParams.push(academyId);
    }

    // 총 발송 건수
    let totalSent = 0;
    try {
      const totalResult = await env.DB.prepare(totalSentQuery)
        .bind(...queryParams)
        .first();
      totalSent = totalResult?.count || 0;
    } catch (e) {
      console.warn('⚠️ SMSLog table not found or error:', e.message);
    }

    // 이번 달 발송 건수
    let thisMonth = 0;
    try {
      const monthResult = await env.DB.prepare(thisMonthQuery)
        .bind('success', thisMonthStart, ...(academyId && tokenData.role !== 'SUPER_ADMIN' ? [academyId] : []))
        .first();
      thisMonth = monthResult?.count || 0;
    } catch (e) {
      console.warn('⚠️ SMSLog monthly query error:', e.message);
    }

    // 템플릿 개수 (학원별 또는 전체)
    let templates = 0;
    try {
      let templateQuery = `SELECT COUNT(*) as count FROM SMSTemplate`;
      if (academyId && tokenData.role !== 'SUPER_ADMIN') {
        templateQuery += ` WHERE academyId = ?`;
      }
      
      const templateResult = academyId && tokenData.role !== 'SUPER_ADMIN'
        ? await env.DB.prepare(templateQuery).bind(academyId).first()
        : await env.DB.prepare(templateQuery).first();
      
      templates = templateResult?.count || 0;
    } catch (e) {
      console.warn('⚠️ SMSTemplate table not found or error:', e.message);
    }

    console.log('✅ Stats:', { totalSent, thisMonth, balance, templates });

    return new Response(JSON.stringify({
      success: true,
      stats: {
        totalSent,
        thisMonth,
        balance,
        templates
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ SMS 통계 조회 오류:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: '통계 조회 중 오류가 발생했습니다',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
