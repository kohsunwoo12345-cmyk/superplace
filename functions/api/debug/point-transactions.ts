// Debug: Check point_transactions table
// GET /api/debug/point-transactions?userId=208

interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || '208';
    
    console.log(`🔍 Checking point_transactions for userId: ${userId}`);
    
    // 1. 테이블 존재 확인
    const tableCheck = await env.DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='point_transactions'
    `).first();
    
    console.log('Table exists:', tableCheck);
    
    // 2. 전체 데이터 조회
    const allData = await env.DB.prepare(`
      SELECT * FROM point_transactions ORDER BY createdAt DESC LIMIT 10
    `).all();
    
    console.log('All transactions:', allData);
    
    // 3. 특정 사용자 데이터 조회
    const userData = await env.DB.prepare(`
      SELECT * FROM point_transactions WHERE userId = ? ORDER BY createdAt DESC
    `).bind(parseInt(userId)).all();
    
    console.log(`User ${userId} transactions:`, userData);
    
    // 4. 포인트 합계
    const pointSum = await env.DB.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM point_transactions WHERE userId = ?
    `).bind(parseInt(userId)).first();
    
    console.log(`User ${userId} total points:`, pointSum);
    
    return new Response(JSON.stringify({
      tableExists: !!tableCheck,
      allTransactions: allData.results,
      userTransactions: userData.results,
      totalPoints: pointSum?.total || 0,
      userId: parseInt(userId),
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('❌ Debug failed:', error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack,
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
