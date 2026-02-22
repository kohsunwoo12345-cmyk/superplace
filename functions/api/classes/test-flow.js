// Test script to verify class creation and retrieval
// This will help us understand the exact data flow

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.DB;

  if (!db) {
    return new Response(JSON.stringify({ error: 'DB not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  try {
    // Test 1: Get all users with DIRECTOR role
    const directors = await db.prepare(`
      SELECT id, email, name, role, academyId, academy_id 
      FROM User 
      WHERE role = 'DIRECTOR' OR role = 'director'
      LIMIT 5
    `).all();
    
    results.tests.push({
      name: 'Directors in User table',
      count: directors.results?.length || 0,
      data: directors.results || []
    });

    // Test 2: Get all classes
    const allClasses = await db.prepare(`
      SELECT id, academy_id, class_name, teacher_id, created_at 
      FROM classes 
      ORDER BY created_at DESC 
      LIMIT 10
    `).all();
    
    results.tests.push({
      name: 'All classes',
      count: allClasses.results?.length || 0,
      data: allClasses.results || []
    });

    // Test 3: Get all academies
    const academies = await db.prepare(`
      SELECT id, name, code 
      FROM Academy 
      LIMIT 10
    `).all();
    
    results.tests.push({
      name: 'All academies',
      count: academies.results?.length || 0,
      data: academies.results || []
    });

    // Test 4: For each director, check matching classes
    if (directors.results && directors.results.length > 0) {
      for (const director of directors.results) {
        const academyId = director.academyId || director.academy_id;
        
        if (academyId) {
          // Test with current query
          const matchingClasses = await db.prepare(`
            SELECT id, academy_id, class_name
            FROM classes
            WHERE CAST(academy_id AS INTEGER) = ?
          `).bind(parseInt(String(academyId).split('.')[0])).all();
          
          results.tests.push({
            name: `Classes for director ${director.email}`,
            directorAcademyId: academyId,
            directorAcademyIdType: typeof academyId,
            count: matchingClasses.results?.length || 0,
            data: matchingClasses.results || []
          });
        }
      }
    }

    // Test 5: Type analysis
    if (allClasses.results && allClasses.results.length > 0) {
      const typeAnalysis = allClasses.results.map(cls => ({
        id: cls.id,
        academy_id: cls.academy_id,
        academy_id_type: typeof cls.academy_id,
        academy_id_string: String(cls.academy_id),
        academy_id_parsed: parseInt(String(cls.academy_id).split('.')[0])
      }));
      
      results.tests.push({
        name: 'Type analysis of academy_id',
        data: typeAnalysis
      });
    }

  } catch (error) {
    results.error = error.message;
    results.stack = error.stack;
  }

  return new Response(JSON.stringify(results, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
