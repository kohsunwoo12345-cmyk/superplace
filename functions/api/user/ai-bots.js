// API: 사용자별 할당된 AI 봇 조회
// GET /api/user/ai-bots?academyId=xxx

export async function onRequestGet(context) {
  const db = context.env.DB;
  
  try {
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: "DB 연결 실패" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // URL에서 academyId와 userId 가져오기
    const url = new URL(context.request.url);
    const academyId = url.searchParams.get("academyId");
    const userId = url.searchParams.get("userId");

    if (!academyId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "academyId가 필요합니다",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`🔍 사용자 봇 조회 - academyId: ${academyId}, userId: ${userId}`);

    // 봇을 모을 Set (중복 제거)
    const botIds = new Set();
    const botMap = new Map();

    // 🚨 userId가 있으면 개별 할당 봇만 조회 (학원 전체 봇 조회 안 함!)
    if (userId) {
      console.log(`🎓 학생 모드: userId=${userId} - 개별 할당 봇만 조회`);
      
      // 개별 학생에게 할당된 봇만 조회 (ai_bot_assignments)
      try {
        const userBots = await db.prepare(`
          SELECT 
            a.botId,
            a.endDate as expiresAt
          FROM ai_bot_assignments a
          WHERE a.userId = ?
            AND a.status = 'ACTIVE'
            AND date(a.endDate) >= date('now')
        `).bind(userId).all();

        if (userBots.results) {
          console.log(`✅ 개별 학생 할당 봇: ${userBots.results.length}개`);
          userBots.results.forEach(bot => {
            botIds.add(bot.botId);
            botMap.set(bot.botId, { expiresAt: bot.expiresAt });
          });
        }
      } catch (e) {
        console.log('❌ ai_bot_assignments 조회 실패:', e.message);
      }
    } else {
      // 👔 학원장/선생님 모드: 학원 전체 봇 조회
      console.log(`👔 학원장/선생님 모드: 학원 전체 봇 조회`);
      
      // 1️⃣ 학원 전체 할당된 봇 조회 (AcademyBotSubscription)
      try {
        const academyBots = await db.prepare(`
          SELECT 
            productId as botId,
            subscriptionEnd as expiresAt
          FROM AcademyBotSubscription
          WHERE academyId = ?
            AND isActive = 1
            AND date(subscriptionEnd) >= date('now')
        `).bind(academyId).all();

        if (academyBots.results) {
          console.log(`✅ 학원 전체 할당 봇: ${academyBots.results.length}개`);
          academyBots.results.forEach(bot => {
            botIds.add(bot.botId);
            botMap.set(bot.botId, { expiresAt: bot.expiresAt });
          });
        }
      } catch (e) {
        console.log('ℹ️ AcademyBotSubscription 조회 실패:', e.message);
      }
    }

    // 3️⃣ 기존 bot_assignments 테이블도 조회 (호환성, 학원장/선생님만)
    if (!userId) {
      try {
      const oldBots = await db.prepare(`
        SELECT 
          ba.botId,
          ba.expiresAt
        FROM bot_assignments ba
        WHERE ba.academyId = ?
          AND ba.isActive = 1
          AND (ba.expiresAt IS NULL OR datetime(ba.expiresAt) > datetime('now'))
      `).bind(academyId).all();

      if (oldBots.results) {
        console.log(`✅ 기존 bot_assignments 봇: ${oldBots.results.length}개`);
        oldBots.results.forEach(bot => {
          botIds.add(bot.botId);
          if (!botMap.has(bot.botId)) {
            botMap.set(bot.botId, { expiresAt: bot.expiresAt });
          }
        });
      }
    } catch (e) {
      console.log('ℹ️ bot_assignments 조회 실패:', e.message);
    }

    // 4️⃣ 모든 봇 ID로 실제 봇 정보 조회
    if (botIds.size === 0) {
      console.log('⚠️ 할당된 봇이 없습니다');
      return new Response(
        JSON.stringify({
          success: true,
          bots: [],
          count: 0,
          message: '할당된 봇이 없습니다'
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // botIds를 배열로 변환하고 SQL 쿼리 생성
    const botIdArray = Array.from(botIds);
    const placeholders = botIdArray.map(() => '?').join(',');
    
    const { results } = await db.prepare(`
      SELECT 
        b.id, b.name, b.description, b.systemPrompt, b.welcomeMessage,
        b.starterMessage1, b.starterMessage2, b.starterMessage3,
        b.profileIcon, b.profileImage, b.model, b.temperature,
        b.maxTokens, b.topK, b.topP, b.language, b.isActive,
        b.enableProblemGeneration, b.voiceEnabled, b.voiceName, b.knowledgeBase
      FROM ai_bots b
      WHERE b.id IN (${placeholders})
        AND b.isActive = 1
      ORDER BY b.name ASC
    `).bind(...botIdArray).all();

    // enableProblemGeneration을 명시적으로 숫자로 변환
    const bots = (results || []).map((bot) => {
      const botInfo = botMap.get(bot.id);
      return {
        ...bot,
        expiresAt: botInfo?.expiresAt || null,
        enableProblemGeneration: bot.enableProblemGeneration ? Number(bot.enableProblemGeneration) : 0,
        voiceEnabled: bot.voiceEnabled ? Number(bot.voiceEnabled) : 0,
        isActive: bot.isActive ? Number(bot.isActive) : 0,
        temperature: bot.temperature ? Number(bot.temperature) : 0.7,
        maxTokens: bot.maxTokens ? Number(bot.maxTokens) : 2000,
        topK: bot.topK ? Number(bot.topK) : 40,
        topP: bot.topP ? Number(bot.topP) : 0.95
      };
    });
    
    console.log(`✅ 최종 할당된 봇 ${bots.length}개 찾음`);
    console.log(`🔍 봇 목록:`, bots.map(b => ({ id: b.id, name: b.name })));

    return new Response(
      JSON.stringify({
        success: true,
        bots: bots,
        count: bots.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("사용자 봇 조회 오류:", error);
    console.error("오류 스택:", error.stack);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: "봇 조회 실패",
        error: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
