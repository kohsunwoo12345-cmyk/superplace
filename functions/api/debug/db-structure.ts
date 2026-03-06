// Check actual DB structure API
export async function onRequest(context: any) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== 'GET') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const db = env.DB;
    const results: any = {};

    // 1. Check users table structure
    try {
      const usersInfo = await db.prepare('PRAGMA table_info(users)').all();
      results.users = {
        exists: true,
        columns: usersInfo.results.map((col: any) => ({
          name: col.name,
          type: col.type,
          notnull: col.notnull,
          pk: col.pk
        }))
      };
    } catch (err: any) {
      results.users = { exists: false, error: err.message };
    }

    // 2. Check students table structure
    try {
      const studentsInfo = await db.prepare('PRAGMA table_info(students)').all();
      results.students = {
        exists: true,
        columns: studentsInfo.results.map((col: any) => ({
          name: col.name,
          type: col.type,
          notnull: col.notnull,
          pk: col.pk
        }))
      };
    } catch (err: any) {
      results.students = { exists: false, error: err.message };
    }

    // 3. Check landing_pages table structure
    try {
      const landingPagesInfo = await db.prepare('PRAGMA table_info(landing_pages)').all();
      results.landing_pages = {
        exists: true,
        columns: landingPagesInfo.results.map((col: any) => ({
          name: col.name,
          type: col.type,
          notnull: col.notnull,
          pk: col.pk
        }))
      };
    } catch (err: any) {
      results.landing_pages = { exists: false, error: err.message };
    }

    // 4. Sample data from users
    try {
      const sampleUsers = await db.prepare('SELECT * FROM users LIMIT 2').all();
      results.users.sample = sampleUsers.results;
    } catch (err: any) {
      results.users.sampleError = err.message;
    }

    // 5. Sample data from students
    try {
      const sampleStudents = await db.prepare('SELECT * FROM students LIMIT 2').all();
      results.students.sample = sampleStudents.results;
    } catch (err: any) {
      results.students.sampleError = err.message;
    }

    // 6. Sample data from landing_pages
    try {
      const sampleLandingPages = await db.prepare('SELECT * FROM landing_pages LIMIT 2').all();
      results.landing_pages.sample = sampleLandingPages.results;
    } catch (err: any) {
      results.landing_pages.sampleError = err.message;
    }

    // 7. List all tables
    try {
      const tables = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
      results.allTables = tables.results.map((t: any) => t.name);
    } catch (err: any) {
      results.allTablesError = err.message;
    }

    return new Response(
      JSON.stringify({
        success: true,
        results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('DB structure check error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to check DB structure'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
