interface Env {
  DB: D1Database;
}

// 선생님 목록 조회
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const academyId = url.searchParams.get('academyId');
    const role = url.searchParams.get('role');

    console.log('👨‍🏫 Teachers API called with:', { role, academyId });

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const isGlobalAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

    let query = `
      SELECT 
        u.id,
        u.email,
        u.name,
        u.phone,
        u.role,
        u.academyId,
        a.name as academyName,
        u.createdAt,
        u.lastLoginAt
      FROM users u
      LEFT JOIN academy a ON CAST(u.academyId AS TEXT) = CAST(a.id AS TEXT)
      WHERE u.role = 'TEACHER'
    `;

    const params: any[] = [];

    // 관리자가 아닌 경우에만 academyId 필터링
    if (!isGlobalAdmin && academyId) {
      query += ` AND (CAST(u.academyId AS TEXT) = ? OR u.academyId = ?)`;
      params.push(String(academyId), parseInt(academyId));
      console.log('🔍 Filtering by academyId:', academyId, 'for DIRECTOR');
    } else if (isGlobalAdmin) {
      console.log('✅ Global admin - showing all teachers');
    }

    query += ` ORDER BY u.createdAt DESC`;

    const result = await DB.prepare(query).bind(...params).all();

    return new Response(
      JSON.stringify({
        success: true,
        teachers: result.results || [],
        count: result.results?.length || 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Fetch teachers error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch teachers",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// 선생님 추가
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const logs: string[] = [];
  
  try {
    const { DB } = context.env;
    logs.push('✅ DB 연결 확인');

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured", logs }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await context.request.json();
    logs.push(`✅ 요청 데이터: ${JSON.stringify(body)}`);

    const { 
      name, 
      email, 
      password, 
      phone, 
      academyId 
    } = body;

    // 필수 필드 검증
    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '이름, 이메일, 비밀번호는 필수입니다',
          logs 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Authorization 헤더에서 사용자 정보 추출
    const authHeader = context.request.headers.get('Authorization');
    let tokenAcademyId = academyId;
    let tokenUserId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const parts = token.split('|');
      if (parts.length >= 4) {
        tokenUserId = parts[0];
        tokenAcademyId = parts[3] || academyId;
        logs.push(`✅ 토큰에서 userId: ${tokenUserId}, academyId: ${tokenAcademyId}`);
      }
    }

    // 🔒 구독 확인 및 사용량 체크
    logs.push('🔒 구독 확인 중...');
    
    // academyId로 구독 확인
    const subscription = await DB.prepare(`
      SELECT us.* FROM user_subscriptions us
      JOIN User u ON us.userId = u.id
      WHERE u.academyId = ? AND u.role = 'DIRECTOR' AND us.status = 'active'
      ORDER BY us.endDate DESC LIMIT 1
    `).bind(parseInt(tokenAcademyId)).first();

    if (!subscription) {
      logs.push('❌ 활성화된 구독이 없습니다');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'NO_SUBSCRIPTION',
          message: '활성화된 구독이 없습니다. 요금제를 선택해주세요.',
          redirectTo: '/pricing',
          logs 
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // 만료 확인
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    if (now > endDate) {
      logs.push('❌ 구독이 만료되었습니다');
      await DB.prepare(`
        UPDATE user_subscriptions SET status = 'expired', updatedAt = datetime('now')
        WHERE id = ?
      `).bind(subscription.id).run();
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'SUBSCRIPTION_EXPIRED',
          message: '구독이 만료되었습니다. 요금제를 갱신해주세요.',
          redirectTo: '/pricing',
          logs 
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // 선생님 수 제한 체크
    const currentTeachers = subscription.current_teachers || 0;
    const maxTeachers = subscription.max_teachers;
    logs.push(`📊 현재 선생님 수: ${currentTeachers}/${maxTeachers}`);
    
    if (maxTeachers !== -1 && currentTeachers >= maxTeachers) {
      logs.push('❌ 선생님 수 제한 초과');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'TEACHER_LIMIT_EXCEEDED',
          message: `선생님 수 제한을 초과했습니다. (${currentTeachers}/${maxTeachers}) 상위 플랜으로 업그레이드해주세요.`,
          currentUsage: currentTeachers,
          maxLimit: maxTeachers,
          redirectTo: '/pricing',
          logs 
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Teacher ID 생성
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const teacherId = `teacher-${timestamp}-${randomStr}`;
    logs.push(`✅ Teacher ID 생성: ${teacherId}`);

    // 비밀번호 해싱
    const salt = 'superplace-salt-2024';
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    logs.push(`✅ 비밀번호 해싱 완료`);

    // User 테이블에 삽입
    try {
      logs.push('🔄 User 테이블에 삽입 시도...');
      
      const query = `
        INSERT INTO User (
          id, email, name, password, phone, role, academyId, createdAt, updatedAt
        )
        VALUES (?, ?, ?, ?, ?, 'TEACHER', ?, datetime('now'), datetime('now'))
      `;
      
      await DB.prepare(query).bind(
        teacherId, 
        email, 
        name, 
        hashedPassword, 
        phone || null, 
        tokenAcademyId
      ).run();
      
      logs.push(`✅ User 테이블 삽입 성공!`);

      // ✅ 사용량 증가
      logs.push('🔄 사용량 증가 중...');
      await DB.prepare(`
        UPDATE user_subscriptions 
        SET current_teachers = current_teachers + 1,
            updatedAt = datetime('now')
        WHERE id = ?
      `).bind(subscription.id).run();
      logs.push(`✅ 사용량 증가 완료: ${currentTeachers + 1}/${maxTeachers}`);

      // 사용량 로그 기록
      const logId = `log-${timestamp}-${randomStr}-usage`;
      await DB.prepare(`
        INSERT INTO usage_logs (id, userId, subscriptionId, type, action, metadata, createdAt)
        VALUES (?, ?, ?, 'teacher', 'create', ?, datetime('now'))
      `).bind(
        logId,
        subscription.userId,
        subscription.id,
        JSON.stringify({ teacherId, name, email })
      ).run();
      logs.push(`✅ 사용량 로그 기록 완료`);
      
    } catch (e: any) {
      logs.push(`❌ User 테이블 삽입 실패: ${e.message}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User 테이블 삽입 실패',
          message: e.message,
          logs 
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    logs.push(`✅ 선생님 생성 완료 - ID: ${teacherId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: '선생님 추가 성공!',
        user: {
          id: teacherId,
          email: email,
          name: name,
          phone: phone,
          role: 'TEACHER',
          academyId: tokenAcademyId
        },
        userId: teacherId,
        logs
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    logs.push(`❌ 전체 에러: ${error.message}`);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        logs
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
