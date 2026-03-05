// 관리자 통합 로그 조회 API
// GET /api/admin/logs?category=all&level=all&search=&limit=100

interface Env {
  DB: D1Database;
}

function parseToken(authHeader: string | null) {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }
  const token = authHeader.substring(7);
  const [id, email, role] = token.split('|');
  return { id, email, role };
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    if (!DB) {
      return new Response(
        JSON.stringify({ error: 'Database not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 토큰 검증
    const authHeader = context.request.headers.get('Authorization');
    const { role } = parseToken(authHeader);
    
    // 관리자 권한 확인
    if (!['SUPER_ADMIN', 'ADMIN'].includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 쿼리 파라미터
    const url = new URL(context.request.url);
    const category = url.searchParams.get('category') || 'all';
    const level = url.searchParams.get('level') || 'all';
    const search = url.searchParams.get('search') || '';
    const limit = parseInt(url.searchParams.get('limit') || '100');

    console.log('📊 로그 조회 요청:', { category, level, search, limit });

    // 1. 로그인 로그 조회
    let loginLogs: any[] = [];
    try {
      const loginQuery = `
        SELECT 
          'login' as category,
          'info' as level,
          l.id,
          l.userId,
          u.name as userName,
          u.email as userEmail,
          l.ipAddress as ip,
          l.userAgent,
          l.deviceType,
          l.country,
          l.loginAt as timestamp,
          '로그인' as action,
          '' as details
        FROM user_login_logs l
        LEFT JOIN User u ON l.userId = u.id
        ORDER BY l.loginAt DESC
        LIMIT ?
      `;
      const loginResult = await DB.prepare(loginQuery).bind(limit).all();
      loginLogs = loginResult.results || [];
      console.log('✅ 로그인 로그:', loginLogs.length, '건');
    } catch (e: any) {
      console.error('⚠️ 로그인 로그 조회 오류:', e.message);
    }

    // 2. 활동 로그 조회 (회원가입, 봇 할당, 포인트 등)
    let activityLogs: any[] = [];
    try {
      const activityQuery = `
        SELECT 
          CASE 
            WHEN action LIKE '%가입%' THEN 'signup'
            WHEN action LIKE '%할당%' THEN 'bot_assign'
            WHEN action LIKE '%포인트%' THEN 'payment'
            WHEN action LIKE '%결제%' THEN 'payment'
            WHEN action LIKE '%학생%추가%' THEN 'student_add'
            ELSE 'other'
          END as category,
          CASE
            WHEN action LIKE '%실패%' OR action LIKE '%오류%' THEN 'error'
            WHEN action LIKE '%경고%' THEN 'warning'
            ELSE 'info'
          END as level,
          a.id,
          a.userId,
          u.name as userName,
          u.email as userEmail,
          a.ip,
          a.action,
          a.details,
          a.createdAt as timestamp,
          '' as userAgent,
          '' as deviceType,
          '' as country
        FROM ActivityLog a
        LEFT JOIN User u ON a.userId = u.id
        ORDER BY a.createdAt DESC
        LIMIT ?
      `;
      const activityResult = await DB.prepare(activityQuery).bind(limit).all();
      activityLogs = activityResult.results || [];
      console.log('✅ 활동 로그:', activityLogs.length, '건');
    } catch (e: any) {
      console.error('⚠️ 활동 로그 조회 오류:', e.message);
    }

    // 3. 로그 병합 및 정렬
    let allLogs = [...loginLogs, ...activityLogs];
    
    // 필터링
    if (category !== 'all') {
      allLogs = allLogs.filter(log => log.category === category);
    }
    if (level !== 'all') {
      allLogs = allLogs.filter(log => log.level === level);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      allLogs = allLogs.filter(log => 
        log.userName?.toLowerCase().includes(searchLower) ||
        log.userEmail?.toLowerCase().includes(searchLower) ||
        log.action?.toLowerCase().includes(searchLower) ||
        log.details?.toLowerCase().includes(searchLower) ||
        log.ip?.includes(searchLower)
      );
    }

    // 시간순 정렬 (최신순)
    allLogs.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });

    // 제한
    allLogs = allLogs.slice(0, limit);

    // 4. 통계 계산
    const stats = {
      total: allLogs.length,
      login: allLogs.filter(log => log.category === 'login').length,
      signup: allLogs.filter(log => log.category === 'signup').length,
      bot_assign: allLogs.filter(log => log.category === 'bot_assign').length,
      student_add: allLogs.filter(log => log.category === 'student_add').length,
      payment: allLogs.filter(log => log.category === 'payment').length,
      error: allLogs.filter(log => log.level === 'error').length,
      warning: allLogs.filter(log => log.level === 'warning').length,
      info: allLogs.filter(log => log.level === 'info').length,
    };

    console.log('📊 통계:', stats);

    return new Response(
      JSON.stringify({
        success: true,
        logs: allLogs,
        stats,
        count: allLogs.length
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('❌ 로그 조회 오류:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch logs',
        details: error.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
