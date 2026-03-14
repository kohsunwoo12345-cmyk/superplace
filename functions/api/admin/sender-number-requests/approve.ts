// Admin API: Approve Sender Number Request
// POST /api/admin/sender-number-requests/approve

interface Env {
  DB: D1Database;
}

function parseToken(authHeader: string | null): { id: string; email: string; role: string } | null {
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

export async function onRequest(context: { request: Request; env: Env }) {
  try {
    const authHeader = context.request.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const tokenData = parseToken(authHeader);
    if (!tokenData) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = context.env.DB;

    // 관리자 권한 확인 - 토큰의 role을 먼저 확인
    console.log('🔍 Token data:', tokenData);
    
    // 토큰에 ADMIN 또는 SUPER_ADMIN이 아니면 거부
    if (tokenData.role !== 'ADMIN' && tokenData.role !== 'SUPER_ADMIN') {
      return new Response(JSON.stringify({ error: "관리자 권한이 필요합니다." }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log('✅ Token role verified:', tokenData.role);
    
    // DB에서 사용자 정보 조회 (ID 또는 email로)
    let user = await db
      .prepare('SELECT id, email, role FROM users WHERE id = ?')
      .bind(tokenData.id)
      .first();

    if (!user) {
      // ID로 못 찾으면 email로 시도
      user = await db
        .prepare('SELECT id, email, role FROM users WHERE email = ?')
        .bind(tokenData.email)
        .first();
    }

    // DB에서 못 찾아도 토큰의 role이 ADMIN이면 허용
    if (!user) {
      console.log('⚠️ User not found in DB, but token role is valid');
      user = { id: tokenData.id, email: tokenData.email, role: tokenData.role };
    }
    
    const body = await context.request.json();
    const { requestId } = body;

    if (!requestId) {
      return new Response(
        JSON.stringify({ error: "requestId가 필요합니다." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 신청 정보 조회
    const request = await db
      .prepare('SELECT * FROM sender_number_requests WHERE id = ?')
      .bind(requestId)
      .first();

    if (!request) {
      return new Response(
        JSON.stringify({ error: "신청 정보를 찾을 수 없습니다." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 승인 처리
    const now = new Date().toISOString();
    
    await db.prepare(`
      UPDATE sender_number_requests
      SET status = 'APPROVED', approvedAt = ?, approvedBy = ?, updatedAt = ?
      WHERE id = ?
    `).bind(now, user.id, now, requestId).run();

    // 학원장의 User/users 테이블에 승인된 발신번호 저장
    if (request.userId) {
      try {
        console.log('📝 업데이트 시작 - request:', {
          userId: request.userId,
          userName: request.userName,
          email: request.email,
          senderNumbers: request.senderNumbers
        });
        
        // userId를 문자열로 변환
        const userIdStr = String(request.userId);
        
        // 먼저 User 테이블에서 사용자 존재 확인 (ID로)
        let targetUser = await db.prepare(`
          SELECT id, email FROM User WHERE id = ?
        `).bind(userIdStr).first();
        
        console.log('🔍 User 테이블 조회 (ID):', targetUser);
        
        // ID로 못 찾으면 email로 시도
        if (!targetUser && request.email) {
          targetUser = await db.prepare(`
            SELECT id, email FROM User WHERE email = ?
          `).bind(request.email).first();
          console.log('🔍 User 테이블 조회 (email):', targetUser);
        }
        
        // User 테이블에 없으면 users 테이블 확인
        if (!targetUser) {
          targetUser = await db.prepare(`
            SELECT id, email FROM users WHERE id = ?
          `).bind(userIdStr).first();
          console.log('🔍 users 테이블 조회 (ID):', targetUser);
        }
        
        if (!targetUser && request.email) {
          targetUser = await db.prepare(`
            SELECT id, email FROM users WHERE email = ?
          `).bind(request.email).first();
          console.log('🔍 users 테이블 조회 (email):', targetUser);
        }
        
        if (!targetUser) {
          console.error('❌ 대상 사용자를 찾을 수 없음');
          throw new Error('사용자를 찾을 수 없습니다');
        }
        
        console.log('✅ 대상 사용자 찾음:', targetUser);
        
        // 찾은 사용자 ID로 업데이트
        const finalUserId = String(targetUser.id);
        
        // User 테이블 업데이트 시도
        let updateResult = await db.prepare(`
          UPDATE User
          SET approvedSenderNumbers = ?
          WHERE id = ?
        `).bind(request.senderNumbers, finalUserId).run();
        
        console.log('📊 User 테이블 업데이트 결과:', {
          success: updateResult.success,
          changes: updateResult.meta?.changes
        });
        
        // User 테이블 업데이트 실패하면 users 테이블 시도
        if (!updateResult.success || updateResult.meta.changes === 0) {
          updateResult = await db.prepare(`
            UPDATE users
            SET approved_sender_numbers = ?
            WHERE id = ?
          `).bind(request.senderNumbers, finalUserId).run();
          
          console.log('📊 users 테이블 업데이트 결과:', {
            success: updateResult.success,
            changes: updateResult.meta?.changes
          });
        }
        
        console.log(`✅ 발신번호 저장 완료 - userId: ${finalUserId}, numbers: ${request.senderNumbers}`);
        
        // SMSSender 테이블에도 발신번호 추가
        const senderNumbers = request.senderNumbers.split(',').map((n: string) => n.trim());
        
        console.log('📱 SMSSender 테이블 업데이트 시작:', senderNumbers);
        
        for (const phoneNumber of senderNumbers) {
          if (!phoneNumber) continue;
          
          // 이미 등록된 발신번호인지 확인
          const existing = await db.prepare(`
            SELECT id FROM SMSSender WHERE phoneNumber = ?
          `).bind(phoneNumber).first();
          
          if (!existing) {
            const senderId = `sender_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            await db.prepare(`
              INSERT INTO SMSSender (
                id, userId, phoneNumber, verified, status, createdAt, updatedAt
              ) VALUES (?, ?, ?, 1, 'ACTIVE', ?, ?)
            `).bind(
              senderId,
              finalUserId,
              phoneNumber,
              now,
              now
            ).run();
            
            console.log(`✅ SMSSender 추가: ${phoneNumber}, ID: ${senderId}`);
          } else {
            console.log(`ℹ️ 이미 등록된 발신번호: ${phoneNumber}`);
          }
        }
      } catch (error: any) {
        console.error('⚠️ 발신번호 저장 실패:', error.message, error.stack);
      }
    } else {
      console.warn('⚠️ request.userId가 없음');
    }

    console.log('✅ 발신번호 등록 승인:', requestId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "발신번호 등록이 승인되었습니다.",
        approvedNumbers: request.senderNumbers,
        userId: request.userId,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("발신번호 승인 오류:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "발신번호 승인 중 오류가 발생했습니다.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
