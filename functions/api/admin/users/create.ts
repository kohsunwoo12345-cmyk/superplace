interface Env {
  DB: D1Database;
}

// 6자리 숫자 코드 생성
function generateAttendanceCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

// POST: 사용자 추가 시 자동으로 출석 코드 생성
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const body = await context.request.json();
    const { name, email, password, role, phone, academyId } = body;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ error: "Name, email, and password are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 이메일 중복 체크
    const existing = await DB.prepare(
      "SELECT id FROM users WHERE email = ?"
    ).bind(email).first();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "Email already exists" }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    // 🆕 학생 추가 시 구독 한도 체크
    if (role && role.toUpperCase() === 'STUDENT' && academyId) {
      // 해당 학원의 학원장 찾기
      const director = await DB.prepare(`
        SELECT id FROM users 
        WHERE academyId = ? AND role = 'DIRECTOR'
        LIMIT 1
      `).bind(academyId).first();

      if (director) {
        // 학원장의 활성 구독 확인
        const subscription = await DB.prepare(`
          SELECT * FROM user_subscriptions 
          WHERE userId = ? AND status = 'active'
          ORDER BY createdAt DESC
          LIMIT 1
        `).bind(director.id).first();

        if (!subscription) {
          return new Response(
            JSON.stringify({ 
              success: false,
              error: "SUBSCRIPTION_REQUIRED",
              message: "학원의 요금제 구독이 필요합니다. 요금제를 선택해주세요.",
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }

        // 구독 만료 확인
        const now = new Date();
        const endDate = new Date(subscription.endDate as string);
        
        if (now > endDate) {
          return new Response(
            JSON.stringify({ 
              success: false,
              error: "SUBSCRIPTION_EXPIRED",
              message: "학원의 구독이 만료되었습니다. 갱신이 필요합니다.",
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }

        // 학생 수 한도 체크
        const maxStudents = subscription.limit_maxStudents as number;
        const currentStudents = subscription.usage_students as number;

        if (maxStudents !== -1 && currentStudents >= maxStudents) {
          return new Response(
            JSON.stringify({ 
              success: false,
              error: "STUDENT_LIMIT_EXCEEDED",
              message: `학생 수 한도를 초과했습니다. (${currentStudents}/${maxStudents})`,
              currentUsage: currentStudents,
              maxLimit: maxStudents,
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }

    // 비밀번호 해시 생성 (SHA-256)
    const salt = 'superplace-salt-2024';
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray.map((b: number) => b.toString(16).padStart(2, '0')).join('');

    console.log('🔐 Password hashed for user:', { email, originalLength: password.length, hashLength: hashedPassword.length });

    // 사용자 ID 생성 - INTEGER로 자동 생성되도록 NULL 사용
    const now = new Date().toISOString();
    const userRole = role || 'STUDENT';
    
    // academy_id는 INTEGER, academyId는 TEXT
    const academyIdInt = academyId ? parseInt(academyId, 10) : null;
    const academyIdText = academyId ? String(academyId) : null;

    // 사용자 생성 (id는 자동 생성)
    const insertResult = await DB.prepare(
      `INSERT INTO users (name, email, password, role, phone, academy_id, academyId, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(name, email, hashedPassword, userRole, phone || null, academyIdInt, academyIdText, now).run();
    
    // 생성된 ID 가져오기
    const userId = insertResult.meta.last_row_id;

    // 학생인 경우 자동으로 출석 코드 생성
    let attendanceCode = null;
    if (userRole.toUpperCase() === 'STUDENT') {
      try {
        // 출석 코드 테이블 생성
        await DB.prepare(`
          CREATE TABLE IF NOT EXISTS student_attendance_codes (
            id TEXT PRIMARY KEY,
            userId INTEGER NOT NULL,
            code TEXT UNIQUE NOT NULL,
            academyId INTEGER,
            classId TEXT,
            isActive INTEGER DEFAULT 1,
            createdAt TEXT DEFAULT (datetime('now')),
            expiresAt TEXT
          )
        `).run();

        // 6자리 숫자 코드 생성 (중복 체크)
        let code = generateAttendanceCode();
        let attempts = 0;
        while (attempts < 20) {
          const existing = await DB.prepare(
            "SELECT id FROM student_attendance_codes WHERE code = ?"
          ).bind(code).first();
          
          if (!existing) break;
          code = generateAttendanceCode();
          attempts++;
        }

        // 출석 코드 저장
        const codeId = `code-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await DB.prepare(`
          INSERT INTO student_attendance_codes (id, userId, code, academyId, isActive)
          VALUES (?, ?, ?, ?, 1)
        `).bind(codeId, userId, code, academyIdInt).run();

        attendanceCode = code;

        // 🆕 학생 추가 사용량 기록
        if (academyId) {
          const director = await DB.prepare(`
            SELECT id FROM users 
            WHERE academyId = ? AND role = 'DIRECTOR'
            LIMIT 1
          `).bind(academyId).first();

          if (director) {
            // 사용량 증가
            await DB.prepare(`
              UPDATE user_subscriptions 
              SET usage_students = usage_students + 1,
                  updatedAt = datetime('now')
              WHERE userId = ? AND status = 'active'
            `).bind(director.id).run();

            // 사용 로그 기록
            const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            await DB.prepare(`
              INSERT INTO usage_logs (id, userId, subscriptionId, featureType, action, metadata)
              SELECT ?, ?, id, 'student_add', 'create', ?
              FROM user_subscriptions
              WHERE userId = ? AND status = 'active'
              LIMIT 1
            `).bind(
              logId,
              director.id,
              JSON.stringify({ studentId: userId, studentName: name }),
              director.id
            ).run();
          }
        }
      } catch (codeError) {
        console.error('Failed to generate attendance code:', codeError);
      }
    }

    // ActivityLog 기록
    try {
      const ipAddress = context.request.headers.get('CF-Connecting-IP') ||
                        context.request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
                        'Unknown';
      const userAgentStr = context.request.headers.get('User-Agent') || 'Unknown';
      const cfCountry = context.request.headers.get('CF-IPCountry') || '';
      let deviceTypeStr = 'Unknown';
      if (userAgentStr.includes('Mobile')) deviceTypeStr = 'Mobile';
      else if (userAgentStr.includes('Windows') || userAgentStr.includes('Mac') || userAgentStr.includes('Linux')) deviceTypeStr = 'Desktop';

      const actLogId = `activity-useradd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const actionLabel = userRole.toUpperCase() === 'STUDENT' ? '학생 추가' : '사용자 추가';
      await DB.prepare(`
        INSERT OR IGNORE INTO activity_logs (id, userId, action, details, ip, userAgent, deviceType, country, userRole, academyId, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        actLogId,
        userId,
        actionLabel,
        `${name}(${email}) 님이 추가되었습니다 (역할: ${userRole}${attendanceCode ? ', 출석코드: ' + attendanceCode : ''})`,
        ipAddress,
        userAgentStr,
        deviceTypeStr,
        cfCountry,
        userRole,
        academyId || ''
      ).run();
    } catch (logErr: any) {
      console.warn('⚠️ ActivityLog 사용자 추가 기록 실패:', logErr.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: userRole.toUpperCase() === 'STUDENT' ? 
          `학생이 추가되었습니다. 출석 코드: ${attendanceCode}` : 
          '사용자가 추가되었습니다',
        user: {
          id: userId,
          name,
          email,
          role: userRole,
          phone,
          academyId,
          password: password // 생성 응답에만 원본 비밀번호 포함 (한 번만 표시)
        },
        attendanceCode,
        passwordInfo: `⚠️ 비밀번호를 안전하게 보관하세요: ${password}`
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("User creation error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to create user",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
