// Emergency Diagnostic API - Check wangholy1 user and classes
// URL: /api/emergency-diagnose

export async function onRequestGet(context) {
  try {
    const { env } = context;
    const db = env.DB;

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

    const diagnostics = {};

    // 1. Check wangholy1@naver.com user info
    try {
      let user = await db
        .prepare('SELECT id, email, name, role, academyId, academy_id FROM users WHERE email = ?')
        .bind('wangholy1@naver.com')
        .first();
      
      if (!user) {
        user = await db
          .prepare('SELECT id, email, name, role, academyId, academy_id FROM User WHERE email = ?')
          .bind('wangholy1@naver.com')
          .first();
      }

      diagnostics.user = user || { error: 'User not found' };
    } catch (error) {
      diagnostics.user = { error: error.message };
    }

    // 2. Get ALL classes in database
    try {
      const allClassesResult = await db
        .prepare('SELECT id, academy_id, class_name, grade, created_at FROM classes ORDER BY created_at DESC LIMIT 50')
        .all();
      
      diagnostics.allClasses = {
        count: allClassesResult.results?.length || 0,
        data: allClassesResult.results || []
      };
    } catch (error) {
      diagnostics.allClasses = { error: error.message };
    }

    // 3. Get classes for user's academy
    if (diagnostics.user && !diagnostics.user.error) {
      const userAcademyId = diagnostics.user.academyId || diagnostics.user.academy_id;
      
      if (userAcademyId) {
        try {
          const academyClassesResult = await db
            .prepare('SELECT id, academy_id, class_name, grade, created_at FROM classes WHERE academy_id = ? ORDER BY created_at DESC')
            .bind(userAcademyId)
            .all();
          
          diagnostics.userAcademyClasses = {
            academyId: userAcademyId,
            count: academyClassesResult.results?.length || 0,
            data: academyClassesResult.results || []
          };
        } catch (error) {
          diagnostics.userAcademyClasses = { error: error.message };
        }
      }
    }

    // 4. Get all academies
    try {
      const academiesResult = await db
        .prepare('SELECT id, name, directorId FROM academies ORDER BY id LIMIT 10')
        .all();
      
      diagnostics.academies = {
        count: academiesResult.results?.length || 0,
        data: academiesResult.results || []
      };
    } catch (error) {
      diagnostics.academies = { error: error.message };
    }

    // 5. Classes by academy count
    try {
      const classByAcademyResult = await db
        .prepare('SELECT academy_id, COUNT(*) as count FROM classes GROUP BY academy_id')
        .all();
      
      diagnostics.classesByAcademy = classByAcademyResult.results || [];
    } catch (error) {
      diagnostics.classesByAcademy = { error: error.message };
    }

    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      diagnostics
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
      error: error.message,
      stack: error.stack
    }, null, 2), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
