// Simple user info API - Get user by email
// URL: /api/user-info?email=xxx

export async function onRequestGet(context) {
  try {
    const { request, env } = context;
    const db = env.DB;
    const url = new URL(request.url);
    const email = url.searchParams.get('email');

    if (!db) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Database not configured' 
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    if (!email) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Email parameter required' 
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Check both tables
    let user = await db
      .prepare('SELECT id, email, name, role, academyId, academy_id, createdAt FROM users WHERE email = ?')
      .bind(email)
      .first();
    
    if (!user) {
      user = await db
        .prepare('SELECT id, email, name, role, academyId, academy_id, createdAt FROM User WHERE email = ?')
        .bind(email)
        .first();
    }

    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User not found',
        email: email
      }), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Get classes for this user's academy
    const userAcademyId = user.academyId || user.academy_id;
    let classesForAcademy = [];
    
    if (userAcademyId) {
      const result = await db
        .prepare('SELECT id, academy_id, class_name, grade FROM classes WHERE academy_id = ?')
        .bind(userAcademyId)
        .all();
      classesForAcademy = result.results || [];
    }

    // Also try string comparison for academy_id
    const allClassesResult = await db
      .prepare('SELECT id, academy_id, class_name, grade FROM classes LIMIT 50')
      .all();
    
    const allClasses = allClassesResult.results || [];
    const matchingClasses = allClasses.filter(c => 
      String(c.academy_id) === String(userAcademyId) ||
      c.academy_id == userAcademyId
    );

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        academyId: user.academyId,
        academy_id: user.academy_id,
        academyIdType: typeof(user.academyId || user.academy_id),
        academyIdString: String(user.academyId || user.academy_id)
      },
      classesDirectMatch: classesForAcademy.length,
      classesStringMatch: matchingClasses.length,
      classesDirectMatchData: classesForAcademy.slice(0, 5),
      classesStringMatchData: matchingClasses.slice(0, 5),
      totalClassesInDB: allClasses.length
    }, null, 2), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }, null, 2), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
