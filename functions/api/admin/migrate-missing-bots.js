// 누락된 봇을 ai_bots 테이블에 자동 생성하는 마이그레이션 API

// GET: 마이그레이션 상태 확인
export async function onRequestGet(context) {
  try {
    const { DB } = context.env;
    
    if (!DB) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // StoreProducts의 botId 개수
    const { results: products } = await DB.prepare(`
      SELECT DISTINCT botId FROM StoreProducts WHERE botId IS NOT NULL AND botId != ''
    `).all();
    
    // ai_bots의 봇 개수
    const { results: bots } = await DB.prepare(`
      SELECT id FROM ai_bots
    `).all();
    
    const productBotIds = new Set(products.map(p => p.botId));
    const botIds = new Set(bots.map(b => b.id));
    
    const missing = Array.from(productBotIds).filter(id => !botIds.has(id));
    
    return new Response(JSON.stringify({
      success: true,
      productsWithBotId: products.length,
      botsInDatabase: bots.length,
      missingBots: missing.length,
      missingBotIds: missing
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to check migration status',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST: 마이그레이션 실행
export async function onRequestPost(context) {
  try {
    const { DB } = context.env;
    
    if (!DB) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('🔧 Starting bot migration...');
    
    // 1. StoreProducts에서 모든 botId 가져오기
    const { results: products } = await DB.prepare(`
      SELECT DISTINCT botId, name FROM StoreProducts WHERE botId IS NOT NULL AND botId != ''
    `).all();
    
    console.log(`📦 Found ${products.length} products with botId`);
    
    let created = 0;
    let skipped = 0;
    
    // 2. 각 botId가 ai_bots에 있는지 확인하고 없으면 생성
    for (const product of products) {
      const { botId, name } = product;
      
      // ai_bots에 있는지 확인
      const existingBot = await DB.prepare(`
        SELECT id FROM ai_bots WHERE id = ?
      `).bind(botId).first();
      
      if (!existingBot) {
        console.log(`🆕 Creating bot: ${botId} (${name})`);
        
        try {
          await DB.prepare(`
            INSERT INTO ai_bots (
              id, name, description, systemPrompt, 
              welcomeMessage, model, temperature, 
              maxTokens, isActive, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          `).bind(
            botId,
            name,
            `Auto-created from store product: ${name}`,
            `You are a helpful AI tutor for ${name}. Provide clear, accurate, and engaging explanations.`,
            `안녕하세요! ${name} AI 튜터입니다. 무엇을 도와드릴까요?`,
            'gemini-2.5-flash',
            0.7,
            2000,
            1
          ).run();
          
          created++;
          console.log(`✅ Created bot ${botId}`);
        } catch (error) {
          console.error(`❌ Failed to create bot ${botId}:`, error.message);
        }
      } else {
        skipped++;
        console.log(`⏭️  Bot ${botId} already exists`);
      }
    }
    
    console.log(`\n✅ Migration complete: ${created} created, ${skipped} skipped`);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Bot migration completed',
      created,
      skipped,
      total: products.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    return new Response(JSON.stringify({
      error: 'Migration failed',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
