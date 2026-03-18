// POST /api/students/direct-add
// 직접 학생 추가 - 비밀번호 해싱 포함

export async function onRequestPost(context) {
  const logs = [];
  
  try {
    const { DB } = context.env;
    logs.push('✅ DB 연결 확인');

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured", logs }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 요청 본문 파싱
    const body = await context.request.json();
    logs.push(`✅ 요청 데이터: ${JSON.stringify(body)}`);

    const { name, phone, academyId } = body;

    // 필수 필드 검증
    if (!name || !phone) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '이름과 연락처는 필수입니다',
          logs 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Authorization 헤더에서 사용자 정보 추출
    const authHeader = context.request.headers.get('Authorization');
    let tokenAcademyId = academyId;
    let userId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const parts = token.split('|');
      if (parts.length >= 4) {
        userId = parts[0];
        tokenAcademyId = parts[3] || academyId;
        logs.push(`✅ 토큰에서 사용자 정보 추출: userId=${userId}, academyId=${tokenAcademyId}`);
      }
    }

    // 🔒 구독 확인 (필수)
    if (userId) {
      logs.push('🔒 구독 확인 중...');
      const subscription = await DB.prepare(`
        SELECT * FROM user_subscriptions 
        WHERE userId = ? AND status = 'active'
        ORDER BY endDate DESC LIMIT 1
      `).bind(userId).first();

      if (!subscription) {
        logs.push('❌ 활성화된 구독이 없습니다');
        return new Response(JSON.stringify({
          success: false,
          error: 'NO_SUBSCRIPTION',
          message: '활성화된 구독이 없습니다. 요금제를 선택해주세요.',
          redirectTo: '/pricing',
          logs
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
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
        
        return new Response(JSON.stringify({
          success: false,
          error: 'SUBSCRIPTION_EXPIRED',
          message: '구독이 만료되었습니다. 요금제를 갱신해주세요.',
          redirectTo: '/pricing',
          logs
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      logs.push(`✅ 구독 활성화 확인: ${subscription.id}`);

      // 학생 수 제한 체크 (플랜의 max_students 확인)
      const plan = await DB.prepare(`
        SELECT max_students FROM pricing_plans WHERE id = ?
      `).bind(subscription.planId).first();

      if (plan && plan.max_students > 0) {
        const studentCount = await DB.prepare(`
          SELECT COUNT(*) as count FROM User 
          WHERE academyId = ? AND role = 'STUDENT' AND (isWithdrawn IS NULL OR isWithdrawn = 0)
        `).bind(tokenAcademyId).first();
        
        const currentStudents = studentCount?.count || 0;
        logs.push(`📊 현재 학생 수: ${currentStudents}/${plan.max_students}`);
        
        if (currentStudents >= plan.max_students) {
          logs.push(`❌ 학생 수 제한 초과 (최대 ${plan.max_students}명)`);
          return new Response(JSON.stringify({
            success: false,
            error: 'STUDENT_LIMIT_EXCEEDED',
            message: `학생 수 제한을 초과했습니다. (최대 ${plan.max_students}명)`,
            currentCount: currentStudents,
            maxLimit: plan.max_students,
            logs
          }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } else {
        logs.push('📊 무제한 플랜 - 학생 수 제한 없음');
      }
    }

    // 임시 이메일 생성 (전화번호 기반)
    const tempEmail = `student_${phone}@temp.superplace.local`;
    logs.push(`✅ 임시 이메일 생성: ${tempEmail}`);

    // 임시 비밀번호 생성 및 해싱 (전화번호 뒷자리)
    const tempPasswordPlain = phone.slice(-6);
    logs.push(`✅ 임시 비밀번호 생성: ${tempPasswordPlain}`);
    
    // 비밀번호 해싱
    const salt = 'superplace-salt-2024';
    const encoder = new TextEncoder();
    const data = encoder.encode(tempPasswordPlain + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    logs.push(`✅ 비밀번호 해싱 완료`);

    // Student ID 생성
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const studentId = `student-${timestamp}-${randomStr}`;
    logs.push(`✅ Student ID 생성: ${studentId}`);

    // User 테이블에 삽입
    try {
      logs.push('🔄 User 테이블에 삽입 시도...');
      const insertResult = await DB.prepare(`
        INSERT INTO User (id, email, name, password, phone, role, academyId, isWithdrawn, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, 'STUDENT', ?, 0, datetime('now'), datetime('now'))
      `).bind(studentId, tempEmail, name, hashedPassword, phone, tokenAcademyId).run();
      
      logs.push(`✅ User 테이블 삽입 성공! changes: ${insertResult.meta?.changes || 0}`);
      
      // 즉시 조회해서 확인
      const checkResult = await DB.prepare('SELECT * FROM User WHERE id = ?').bind(studentId).first();
      if (checkResult) {
        logs.push(`✅ 즉시 조회 성공: ${checkResult.name}, role: ${checkResult.role}`);
      } else {
        logs.push(`❌ 즉시 조회 실패: 데이터가 없음!`);
      }
    } catch (e) {
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

    // INSERT한 데이터를 직접 반환 (SELECT 제거 - D1 replica lag 회피)
    logs.push(`✅ 학생 생성 완료 - ID: ${studentId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: '학생 추가 성공!',
        user: {
          id: studentId,
          email: tempEmail,
          name: name,
          phone: phone,
          role: 'STUDENT',
          academyId: tokenAcademyId
        },
        userId: studentId,
        tempPassword: tempPasswordPlain,
        logs
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
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
}
