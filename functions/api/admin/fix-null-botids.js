export async function onRequestPost(context) {
  const { env } = context;

  try {
    console.log('🔧 Fixing null botIds in AcademyBotSubscription...');

    // Get all subscriptions with null botId
    const subscriptionsWithNullBotId = await env.DB.prepare(`
      SELECT s.id, s.productId, s.productName, p.botId as storeBotId
      FROM AcademyBotSubscription s
      LEFT JOIN StoreProducts p ON s.productId = p.id
      WHERE s.botId IS NULL
    `).all();

    console.log(`Found ${subscriptionsWithNullBotId.results.length} subscriptions with null botId`);

    let fixed = 0;
    let failed = 0;

    for (const sub of subscriptionsWithNullBotId.results) {
      const botId = sub.storeBotId || sub.productId;
      
      if (botId) {
        // Update subscription with botId
        await env.DB.prepare(`
          UPDATE AcademyBotSubscription 
          SET botId = ?
          WHERE id = ?
        `).bind(botId, sub.id).run();
        
        console.log(`✅ Fixed subscription ${sub.id}: botId=${botId}`);
        fixed++;
      } else {
        console.log(`⚠️ Cannot fix subscription ${sub.id}: no botId found`);
        failed++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Fixed null botIds in subscriptions',
      fixed,
      failed,
      total: subscriptionsWithNullBotId.results.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fixing null botIds:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestGet(context) {
  return new Response(JSON.stringify({
    message: 'Use POST to fix null botIds in AcademyBotSubscription table',
    endpoint: '/api/admin/fix-null-botids'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
