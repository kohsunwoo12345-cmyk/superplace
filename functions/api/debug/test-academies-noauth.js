// Test API - no auth required for debugging
export async function onRequestGet(context) {
  const { env } = context;
  
  try {
    // Get all directors
    const directorsResult = await env.DB.prepare(`
      SELECT id, name, email, phone, academyId, createdAt, role
      FROM User
      WHERE role = 'DIRECTOR'
      ORDER BY createdAt DESC
    `).all();
    
    const directors = directorsResult.results || [];
    
    console.log(`📊 Total directors: ${directors.length}`);
    
    // Simulate the main API logic
    const finalAcademies = [];
    const processedDirectorIds = new Set();
    
    for (const director of directors) {
      const directorId = director.id;
      const uniqueDirectorKey = `dir-${directorId}`;
      
      if (processedDirectorIds.has(uniqueDirectorKey)) {
        continue;
      }
      
      processedDirectorIds.add(uniqueDirectorKey);
      
      finalAcademies.push({
        id: uniqueDirectorKey,
        name: `${director.name}의 학원`,
        directorName: director.name
      });
    }
    
    console.log(`📊 Processed academies: ${finalAcademies.length}`);
    
    return new Response(JSON.stringify({
      success: true,
      totalDirectors: directors.length,
      processedAcademies: finalAcademies.length,
      firstDirector: directors[0],
      lastDirector: directors[directors.length - 1],
      sampleAcademies: finalAcademies.slice(0, 10)
    }, null, 2), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
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
