/**
 * Debug API to analyze User table academyId distribution
 * GET /api/admin/debug/academies-distribution
 */

export async function onRequestGet(context) {
  try {
    const { env, request } = context;
    
    // Check authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Query all directors
    const directorsQuery = `
      SELECT 
        id,
        name,
        email,
        academyId,
        role
      FROM User
      WHERE role = 'DIRECTOR'
      ORDER BY academyId, id
    `;
    
    const directorsResult = await env.DB.prepare(directorsQuery).all();
    const directors = directorsResult.results || [];
    
    // Analyze academyId distribution
    const academyIdDistribution = {};
    let nullCount = 0;
    
    for (const director of directors) {
      if (director.academyId === null || director.academyId === undefined) {
        nullCount++;
      } else {
        const academyIdStr = director.academyId.toString();
        if (!academyIdDistribution[academyIdStr]) {
          academyIdDistribution[academyIdStr] = [];
        }
        academyIdDistribution[academyIdStr].push({
          id: director.id,
          name: director.name,
          email: director.email
        });
      }
    }
    
    // Count unique academyIds
    const uniqueAcademyIds = Object.keys(academyIdDistribution);
    
    return new Response(JSON.stringify({
      success: true,
      totalDirectors: directors.length,
      directorsWithAcademyId: directors.length - nullCount,
      directorsWithNullAcademyId: nullCount,
      uniqueAcademyIds: uniqueAcademyIds.length,
      distribution: Object.entries(academyIdDistribution).map(([academyId, directors]) => ({
        academyId,
        count: directors.length,
        directors: directors.slice(0, 3) // First 3 directors per academy
      })),
      sampleNullDirectors: directors
        .filter(d => d.academyId === null || d.academyId === undefined)
        .slice(0, 5)
        .map(d => ({ id: d.id, name: d.name, email: d.email }))
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Debug API error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack?.substring(0, 500)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
