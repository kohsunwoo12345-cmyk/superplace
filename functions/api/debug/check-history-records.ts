// Debug endpoint to check MessageSendHistory records
// GET /api/debug/check-history-records

interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { env } = context;
  
  try {
    // Check table schema
    const schemaResult = await env.DB.prepare(`
      SELECT sql FROM sqlite_master WHERE type='table' AND name='MessageSendHistory'
    `).first();
    
    // Get all records
    const allRecords = await env.DB.prepare(`
      SELECT * FROM MessageSendHistory ORDER BY createdAt DESC LIMIT 10
    `).all();
    
    // Get distinct userIds
    const userIds = await env.DB.prepare(`
      SELECT DISTINCT userId FROM MessageSendHistory
    `).all();
    
    return new Response(JSON.stringify({
      success: true,
      tableExists: !!schemaResult,
      schema: schemaResult?.sql,
      totalRecords: allRecords.results?.length || 0,
      records: allRecords.results,
      distinctUserIds: userIds.results,
    }, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack,
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
