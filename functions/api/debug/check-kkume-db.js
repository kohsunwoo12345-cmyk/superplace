export async function onRequestGet(context) {
  const { env } = context;
  const DB = env.DB;
  
  const academyId = 'academy-1771479246368-5viyubmqk';
  
  // Check user_subscriptions table
  const subscriptions = await DB.prepare(`
    SELECT * FROM user_subscriptions 
    WHERE academyId = ?
    ORDER BY createdAt DESC
  `).bind(academyId).all();
  
  // Check Academy table
  const academy = await DB.prepare(`
    SELECT * FROM Academy WHERE id = ?
  `).bind(academyId).first();
  
  // Check User table for director
  const director = await DB.prepare(`
    SELECT * FROM User 
    WHERE academyId = ? AND role = 'DIRECTOR'
  `).bind(academyId).first();
  
  // Count students
  const studentCount = await DB.prepare(`
    SELECT COUNT(*) as count FROM User
    WHERE academyId = ? AND role = 'STUDENT' AND withdrawnAt IS NULL
  `).bind(academyId).first();
  
  return new Response(JSON.stringify({
    subscriptions: subscriptions.results,
    academy,
    director: director ? {
      id: director.id,
      name: director.name,
      email: director.email,
      academyId: director.academyId
    } : null,
    studentCount: studentCount?.count || 0
  }, null, 2), {
    headers: { 'Content-Type': 'application/json' }
  });
}
