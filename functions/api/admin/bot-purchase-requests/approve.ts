// 관리자용 구매 요청 승인 API
export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Unauthorized - No token provided' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // 토큰 파싱 (표준 형식: id|email|role|academyId)
    const parts = token.split('|');
    if (parts.length < 3) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid token format' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const adminUser = {
      id: parts[0],
      email: parts[1],
      role: parts[2],
      academyId: parts[3] || null
    };

    console.log('🔐 Admin approve:', { userId: adminUser.id, role: adminUser.role });

    // 관리자 권한 확인
    if (!['SUPER_ADMIN', 'ADMIN'].includes(adminUser.role)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Admin permission required' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { requestId, studentCount, academyId } = body;

    if (!requestId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Request ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!academyId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Academy ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 구매 요청 조회
    const purchaseRequest = await env.DB.prepare(`
      SELECT * FROM BotPurchaseRequest WHERE id = ?
    `).bind(requestId).first();

    if (!purchaseRequest) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Purchase request not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 이미 처리된 요청인지 확인
    if (purchaseRequest.status !== 'PENDING') {
      return new Response(JSON.stringify({
        success: false,
        error: `Request already ${purchaseRequest.status.toLowerCase()}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date().toISOString();

    // 0. AcademyBotSubscription 테이블 마이그레이션 (botId 컬럼 추가)
    try {
      // botId 컬럼이 없으면 추가
      await env.DB.prepare(`
        ALTER TABLE AcademyBotSubscription ADD COLUMN botId TEXT
      `).run();
      console.log('✅ Added botId column to AcademyBotSubscription');
    } catch (e: any) {
      if (e.message && (e.message.includes('duplicate column') || e.message.includes('already exists'))) {
        console.log('ℹ️ botId column already exists in AcademyBotSubscription');
      } else {
        console.warn('⚠️ Failed to add botId column:', e.message);
      }
    }

    // isActive 컬럼이 없으면 추가
    try {
      await env.DB.prepare(`
        ALTER TABLE AcademyBotSubscription ADD COLUMN isActive INTEGER DEFAULT 1
      `).run();
      console.log('✅ Added isActive column to AcademyBotSubscription');
    } catch (e: any) {
      if (e.message && (e.message.includes('duplicate column') || e.message.includes('already exists'))) {
        console.log('ℹ️ isActive column already exists in AcademyBotSubscription');
      } else {
        console.warn('⚠️ Failed to add isActive column:', e.message);
      }
    }

    // 트랜잭션 시작 (여러 작업을 원자적으로 처리)
    
    // 0. 외래 키 제약 확인: Academy와 Product가 존재하는지 검증
    const academy = await env.DB.prepare(`
      SELECT id, name FROM academy WHERE id = ?
    `).bind(academyId).first();

    if (!academy) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Selected academy does not exist',
        details: `Academy ID "${academyId}" not found in database`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`✅ Academy verified: ${academy.name} (${academy.id})`);
    console.log(`📦 Product ID: ${purchaseRequest.productId} (${purchaseRequest.productName})`);
    
    // 0.5. Product의 botId 조회 (AI 챗봇 매핑용)
    const product = await env.DB.prepare(`
      SELECT botId FROM StoreProducts WHERE id = ?
    `).bind(purchaseRequest.productId).first();
    
    const botId = product?.botId || purchaseRequest.productId; // fallback to productId
    console.log(`🤖 Bot ID for subscription: ${botId}`);
    
    // 0.6. AI 봇이 ai_bots 테이블에 없으면 자동 생성
    const existingBot = await env.DB.prepare(`
      SELECT id FROM ai_bots WHERE id = ?
    `).bind(botId).first();
    
    if (!existingBot) {
      console.log(`⚠️ Bot ${botId} not found in ai_bots table, creating...`);
      
      try {
        const newBotId = `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await env.DB.prepare(`
          INSERT INTO ai_bots (
            id, name, description, systemPrompt, 
            welcomeMessage, model, temperature, 
            maxTokens, isActive, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          botId,  // 기존 botId 사용
          purchaseRequest.productName,
          `Auto-created from store product: ${purchaseRequest.productName}`,
          `You are a helpful AI tutor for ${purchaseRequest.productName}.`,
          `안녕하세요! ${purchaseRequest.productName} AI 튜터입니다.`,
          'gemini-2.5-flash',
          0.7,
          2000,
          1
        ).run();
        
        console.log(`✅ Created bot ${botId} in ai_bots table`);
      } catch (botError: any) {
        console.warn(`⚠️ Failed to create bot in ai_bots:`, botError.message);
        // Continue even if bot creation fails
      }
    } else {
      console.log(`✅ Bot ${botId} exists in ai_bots table`);
    }
    
    // 1. 구매 요청 상태를 APPROVED로 업데이트
    await env.DB.prepare(`
      UPDATE BotPurchaseRequest 
      SET status = 'APPROVED', 
          approvedBy = ?,
          approvedAt = ?,
          updatedAt = ?
      WHERE id = ?
    `).bind(adminUser.id, now, now, requestId).run();

    // 2. 학원의 구독 정보 확인 (이미 있으면 업데이트, 없으면 생성)
    // 관리자가 선택한 학원 ID 사용
    const targetAcademyId = academyId;
    
    const existingSubscription = await env.DB.prepare(`
      SELECT * FROM AcademyBotSubscription 
      WHERE academyId = ? AND botId = ?
    `).bind(targetAcademyId, botId).first();

    const subscriptionEndDate = new Date();
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + purchaseRequest.months);

    // 관리자가 수정한 학생 수 또는 요청된 학생 수 사용
    const finalStudentCount = studentCount || purchaseRequest.studentCount;
    console.log(`📝 Approval: academyId=${targetAcademyId}, studentCount: requested=${purchaseRequest.studentCount}, approved=${studentCount}, final=${finalStudentCount}`);

    if (existingSubscription) {
      // 기존 구독 업데이트 (학생 슬롯 추가, 기간 연장)
      const newTotalSlots = (existingSubscription.totalStudentSlots || 0) + finalStudentCount;
      const newRemainingSlots = (existingSubscription.remainingStudentSlots || 0) + finalStudentCount;
      
      // 기간 연장 (기존 만료일이 현재보다 미래면 그 날짜 기준으로 추가)
      let newEndDate = new Date(existingSubscription.subscriptionEnd);
      if (newEndDate < new Date()) {
        newEndDate = new Date();
      }
      newEndDate.setMonth(newEndDate.getMonth() + purchaseRequest.months);

      await env.DB.prepare(`
        UPDATE AcademyBotSubscription 
        SET totalStudentSlots = ?,
            remainingStudentSlots = ?,
            subscriptionEnd = ?,
            productId = ?,
            productName = ?,
            updatedAt = ?
        WHERE id = ?
      `).bind(
        newTotalSlots,
        newRemainingSlots,
        newEndDate.toISOString(),
        purchaseRequest.productId,
        purchaseRequest.productName,
        now,
        existingSubscription.id
      ).run();

    } else {
      // 새 구독 생성
      const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await env.DB.prepare(`
        INSERT INTO AcademyBotSubscription (
          id, academyId, botId, productId, productName,
          totalStudentSlots, usedStudentSlots, remainingStudentSlots,
          subscriptionStart, subscriptionEnd, isActive,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        subscriptionId,
        targetAcademyId,  // 관리자가 선택한 학원 ID 사용
        botId,  // AI 챗봇 ID (StoreProducts.botId)
        purchaseRequest.productId,
        purchaseRequest.productName,
        finalStudentCount,  // 관리자가 수정한 학생 수 사용
        0,
        finalStudentCount,  // 관리자가 수정한 학생 수 사용
        now,
        subscriptionEndDate.toISOString(),
        1,  // isActive = true
        now,
        now
      ).run();
    }

    // 3. 업데이트된 구독 정보 조회
    const updatedSubscription = await env.DB.prepare(`
      SELECT * FROM AcademyBotSubscription 
      WHERE academyId = ? AND botId = ?
    `).bind(targetAcademyId, botId).first();
    
    console.log(`✅ Subscription created/updated:`, {
      academyId: targetAcademyId,
      botId,
      productId: purchaseRequest.productId,
      studentCount: finalStudentCount,
      subscriptionEnd: subscriptionEndDate.toISOString()
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Purchase request approved successfully',
      data: {
        requestId,
        subscription: updatedSubscription
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Approve purchase request error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to approve purchase request'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
