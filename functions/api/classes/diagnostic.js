// Comprehensive Classes Diagnostic API
// Shows exactly what's in the database and why classes aren't appearing

function parseToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  const parts = token.split('|');
  
  if (parts.length < 3) {
    return null;
  }
  
  return {
    id: parts[0],
    email: parts[1],
    role: parts[2]
  };
}

export async function onRequestGet(context) {
  try {
    const { request, env } = context;
    const db = env.DB;

    if (!db) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Database not configured' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse token
    const authHeader = request.headers.get('Authorization');
    const tokenData = parseToken(authHeader);

    if (!tokenData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const diagnostics = {
      timestamp: new Date().toISOString(),
      user: {},
      classes: {},
      academies: {},
      joins: {}
    };

    // 1. Get user info from both possible tables
    let user = await db
      .prepare('SELECT * FROM User WHERE email = ?')
      .bind(tokenData.email)
      .first();
    
    if (!user) {
      user = await db
        .prepare('SELECT * FROM users WHERE email = ?')
        .bind(tokenData.email)
        .first();
    }

    diagnostics.user = {
      found: !!user,
      table: user ? (await db.prepare('SELECT * FROM User WHERE email = ?').bind(tokenData.email).first() ? 'User' : 'users') : null,
      data: user,
      academyId: user ? (user.academyId || user.academy_id) : null,
      role: user?.role
    };

    // 2. Get all classes
    const allClasses = await db.prepare('SELECT * FROM classes ORDER BY created_at DESC LIMIT 50').all();
    diagnostics.classes.all = allClasses.results || [];
    diagnostics.classes.count = diagnostics.classes.all.length;

    // 3. Get all academies
    const allAcademies = await db.prepare('SELECT * FROM Academy LIMIT 50').all();
    diagnostics.academies.all = allAcademies.results || [];
    diagnostics.academies.count = diagnostics.academies.all.length;

    // 4. If user has academyId, get matching classes
    if (user && (user.academyId || user.academy_id)) {
      const userAcademyId = user.academyId || user.academy_id;
      
      const matchingClasses = await db
        .prepare('SELECT * FROM classes WHERE academy_id = ?')
        .bind(userAcademyId)
        .all();
      
      diagnostics.classes.matchingUserAcademy = matchingClasses.results || [];
      diagnostics.classes.matchingCount = diagnostics.classes.matchingUserAcademy.length;

      // 5. Get the academy info
      const academy = await db
        .prepare('SELECT * FROM Academy WHERE id = ?')
        .bind(userAcademyId)
        .first();
      
      diagnostics.academies.userAcademy = academy;
    }

    // 6. Type comparison diagnostics
    diagnostics.typeChecks = {
      userAcademyIdType: typeof (user?.academyId || user?.academy_id),
      userAcademyIdValue: user?.academyId || user?.academy_id,
      classAcademyIds: diagnostics.classes.all.map(c => ({
        id: c.id,
        academy_id: c.academy_id,
        type: typeof c.academy_id,
        matches: c.academy_id == (user?.academyId || user?.academy_id),
        strictMatches: c.academy_id === (user?.academyId || user?.academy_id)
      }))
    };

    // 7. SQL JOIN test
    if (user && (user.academyId || user.academy_id)) {
      const userAcademyId = user.academyId || user.academy_id;
      
      const joinResult = await db.prepare(`
        SELECT 
          c.*,
          u.name as teacherName,
          a.name as academyName
        FROM classes c
        LEFT JOIN User u ON c.teacher_id = u.id
        LEFT JOIN Academy a ON c.academy_id = a.id
        WHERE c.academy_id = ?
      `).bind(userAcademyId).all();
      
      diagnostics.joins.withUserAcademy = joinResult.results || [];
    }

    return new Response(JSON.stringify(diagnostics, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Diagnostic error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
