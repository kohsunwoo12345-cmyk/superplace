// Check database tables and data
export async function onRequestGet(context) {
  const { env } = context;
  const DB = env.DB;
  
  try {
    // Check if tables exist
    const tables = await DB.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `).all();
    
    // Check user_subscriptions for academy-1771479246368-5viyubmqk
    const subscriptions = await DB.prepare(`
      SELECT us.*, u.id as userId, u.name as userName, u.role, u.academyId
      FROM user_subscriptions us
      LEFT JOIN User u ON us.userId = u.id
      WHERE u.academyId = 'academy-1771479246368-5viyubmqk'
      ORDER BY us.createdAt DESC
    `).all();
    
    // Check Academy table
    const academy = await DB.prepare(`
      SELECT * FROM Academy WHERE id = 'academy-1771479246368-5viyubmqk'
    `).first();
    
    // Check User table for this academy
    const users = await DB.prepare(`
      SELECT id, name, email, role FROM User
      WHERE academyId = 'academy-1771479246368-5viyubmqk'
      ORDER BY role, name
    `).all();
    
    return new Response(JSON.stringify({
      tables: tables.results.map(t => t.name),
      subscriptions: subscriptions.results,
      academy,
      users: users.results
    }, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
