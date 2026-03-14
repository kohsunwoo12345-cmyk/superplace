// 관리자 통합 로그 조회 API
// GET /api/admin/logs?category=all&level=all&search=&limit=500&dateFrom=&dateTo=

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
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '500'), 1000);
    const dateFrom = url.searchParams.get('dateFrom') || '';
    const dateTo = url.searchParams.get('dateTo') || '';

    console.log('📊 로그 조회 요청:', { category, level, search, limit, dateFrom, dateTo });

    // 1. 로그인 로그 조회 (user_login_logs)
    let loginLogs: any[] = [];
    try {
      let loginQuery = `
        SELECT 
          'login' as category,
          'info' as level,
          l.id,
          l.userId,
          u.name as userName,
          u.email as userEmail,
          u.role as userRole,
          u.academyId,
          (SELECT a.name FROM academy a WHERE a.id = u.academyId LIMIT 1) as academyName,
          l.ipAddress as ip,
          l.userAgent,
          l.deviceType,
          l.country,
          l.loginAt as timestamp,
          '로그인' as action,
          COALESCE(u.name, u.email, '알 수 없음') || ' 님이 로그인하였습니다' as details
        FROM user_login_logs l
        LEFT JOIN users u ON l.userId = u.id
        WHERE 1=1
      `;
      const loginParams: any[] = [];

      if (dateFrom) {
        loginQuery += ` AND l.loginAt >= ?`;
        loginParams.push(dateFrom);
      }
      if (dateTo) {
        loginQuery += ` AND l.loginAt <= ?`;
        loginParams.push(dateTo + ' 23:59:59');
      }

      loginQuery += ` ORDER BY l.loginAt DESC LIMIT ?`;
      loginParams.push(limit);

      const loginResult = await DB.prepare(loginQuery).bind(...loginParams).all();
      loginLogs = loginResult.results || [];
      console.log('✅ 로그인 로그:', loginLogs.length, '건');
    } catch (e: any) {
      console.error('⚠️ 로그인 로그 조회 오류:', e.message);
    }

    // 2. 활동 로그 조회 (ActivityLog)
    let activityLogs: any[] = [];
    try {
      let activityQuery = `
        SELECT 
          CASE 
            WHEN a.action LIKE '%가입%' THEN 'signup'
            WHEN a.action LIKE '%할당%' OR a.action LIKE '%봇%' THEN 'bot_assign'
            WHEN a.action LIKE '%포인트%' THEN 'payment'
            WHEN a.action LIKE '%결제%' OR a.action LIKE '%구독%' THEN 'payment'
            WHEN a.action LIKE '%학생%추가%' OR a.action LIKE '%학생 추가%' THEN 'student_add'
            WHEN a.action LIKE '%비밀번호%' THEN 'password'
            WHEN a.action LIKE '%대행%' OR a.action LIKE '%impersonate%' THEN 'impersonate'
            ELSE 'other'
          END as category,
          CASE
            WHEN a.action LIKE '%실패%' OR a.action LIKE '%오류%' OR a.action LIKE '%error%' THEN 'error'
            WHEN a.action LIKE '%경고%' OR a.action LIKE '%warning%' THEN 'warning'
            WHEN a.action LIKE '%성공%' OR a.action LIKE '%완료%' THEN 'success'
            ELSE 'info'
          END as level,
          a.id,
          a.userId,
          u.name as userName,
          u.email as userEmail,
          COALESCE(a.userRole, u.role) as userRole,
          COALESCE(a.academyId, u.academyId) as academyId,
          COALESCE(a.academyName, (SELECT ac.name FROM academy ac WHERE ac.id = COALESCE(a.academyId, u.academyId) LIMIT 1)) as academyName,
          a.ip,
          COALESCE(a.userAgent, '') as userAgent,
          COALESCE(a.deviceType, '') as deviceType,
          COALESCE(a.country, '') as country,
          a.action,
          a.details,
          a.createdAt as timestamp
        FROM ActivityLog a
        LEFT JOIN users u ON a.userId = u.id
        WHERE 1=1
      `;
      const activityParams: any[] = [];

      if (dateFrom) {
        activityQuery += ` AND a.createdAt >= ?`;
        activityParams.push(dateFrom);
      }
      if (dateTo) {
        activityQuery += ` AND a.createdAt <= ?`;
        activityParams.push(dateTo + ' 23:59:59');
      }

      activityQuery += ` ORDER BY a.createdAt DESC LIMIT ?`;
      activityParams.push(limit);

      const activityResult = await DB.prepare(activityQuery).bind(...activityParams).all();
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
        log.ip?.includes(searchLower) ||
        log.academyName?.toLowerCase().includes(searchLower) ||
        log.userRole?.toLowerCase().includes(searchLower) ||
        log.country?.toLowerCase().includes(searchLower) ||
        log.deviceType?.toLowerCase().includes(searchLower)
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
      password: allLogs.filter(log => log.category === 'password').length,
      impersonate: allLogs.filter(log => log.category === 'impersonate').length,
      other: allLogs.filter(log => log.category === 'other').length,
      error: allLogs.filter(log => log.level === 'error').length,
      warning: allLogs.filter(log => log.level === 'warning').length,
      info: allLogs.filter(log => log.level === 'info').length,
      success: allLogs.filter(log => log.level === 'success').length,
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
