// User Academy Bot Subscriptions API - 학원별 구독 조회 (DIRECTOR/TEACHER용)

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
    role: parts[2],
    academyId: parts[3] || null,
  };
}

export async function onRequestGet(context) {
  try {
    const { DB } = context.env;
    if (!DB) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 인증 체크
    const authHeader = context.request.headers.get('Authorization');
    const user = parseToken(authHeader);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // URL 파라미터에서 academyId 가져오기
    const url = new URL(context.request.url);
    const queryAcademyId = url.searchParams.get('academyId');
    
    // DIRECTOR/TEACHER는 자신의 학원만 조회 가능
    let academyId = queryAcademyId;
    
    if (user.role === 'DIRECTOR' || user.role === 'TEACHER') {
      // 토큰의 academyId 사용
      if (!user.academyId) {
        return new Response(JSON.stringify({ 
          error: 'No academy assigned',
          message: '학원이 배정되지 않았습니다'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      academyId = user.academyId;
    } else if (['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      // 관리자는 특정 academyId 조회 가능
      if (!queryAcademyId) {
        return new Response(JSON.stringify({ 
          error: 'Missing academyId parameter',
          message: 'academyId 파라미터가 필요합니다'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } else {
      return new Response(JSON.stringify({ 
        error: 'Forbidden',
        message: '권한이 없습니다'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`📋 Fetching academy bot subscriptions for: ${academyId} (by ${user.email})`);

    // 학원별 구독 조회 (활성 + 만료된 구독 모두 포함)
    const subscriptions = await DB.prepare(`
      SELECT 
        s.id,
        s.academyId,
        a.name as academyName,
        s.botId,
        b.name as botName,
        s.totalStudentSlots as totalSlots,
        s.usedStudentSlots as usedSlots,
        s.remainingStudentSlots as remainingSlots,
        s.subscriptionStart as startDate,
        s.subscriptionEnd as expiresAt,
        CASE 
          WHEN date(s.subscriptionEnd) >= date('now') AND s.isActive = 1 THEN 1
          ELSE 0
        END as isActive,
        s.pricePerStudent,
        s.createdAt
      FROM AcademyBotSubscription s
      LEFT JOIN academy a ON s.academyId = a.id
      LEFT JOIN ai_bots b ON s.botId = b.id
      WHERE s.academyId = ?
      ORDER BY s.subscriptionEnd DESC, s.createdAt DESC
    `).bind(academyId).all();

    console.log(`✅ Found ${subscriptions.results?.length || 0} subscriptions for academy ${academyId}`);

    return new Response(
      JSON.stringify({
        success: true,
        subscriptions: subscriptions.results || [],
        count: subscriptions.results?.length || 0,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Failed to fetch academy bot subscriptions:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch academy bot subscriptions',
        details: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
