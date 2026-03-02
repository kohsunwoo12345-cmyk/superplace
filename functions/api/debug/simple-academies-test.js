// Simple test - returns raw director count and processing result
export async function onRequestGet(context) {
  const { env } = context;
  
  try {
    // Get all directors
    const directorsResult = await env.DB.prepare(`
      SELECT id, name, academyId
      FROM User
      WHERE role = 'DIRECTOR'
      ORDER BY createdAt DESC
    `).all();
    
    const directors = directorsResult.results || [];
    
    // Process all directors
    const processedDirectorIds = new Set();
    const academies = [];
    
    for (const director of directors) {
      const directorId = director.id;
      const uniqueDirectorKey = `dir-${directorId}`;
      
      if (processedDirectorIds.has(uniqueDirectorKey)) {
        continue;
      }
      
      processedDirectorIds.add(uniqueDirectorKey);
      
      academies.push({
        id: uniqueDirectorKey,
        directorId: directorId,
        academyId: director.academyId,
        name: `${director.name}의 학원`,
        directorName: director.name
      });
    }
    
    return new Response(JSON.stringify({
      success: true,
      totalDirectorsInDB: directors.length,
      processedAcademies: academies.length,
      sampleAcademies: academies.slice(0, 20)
    }, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }, null, 2), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
