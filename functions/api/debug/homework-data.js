// 숙제 데이터 디버그 API
// GET /api/debug/homework-data

export async function onRequestGet(context) {
  const { env, request } = context;

  try {
    const results = {
      timestamp: new Date().toISOString(),
      tables: {}
    };

    // 1. homework_submissions_v2 테이블 확인
    try {
      const submissionsCount = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM homework_submissions_v2'
      ).first();
      
      const recentSubmissions = await env.DB.prepare(
        'SELECT * FROM homework_submissions_v2 ORDER BY submittedAt DESC LIMIT 5'
      ).all();

      results.tables.homework_submissions_v2 = {
        exists: true,
        totalCount: submissionsCount?.count || 0,
        recentRecords: recentSubmissions.results || []
      };
    } catch (e) {
      results.tables.homework_submissions_v2 = {
        exists: false,
        error: e.message
      };
    }

    // 2. homework_gradings_v2 테이블 확인
    try {
      const gradingsCount = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM homework_gradings_v2'
      ).first();
      
      const recentGradings = await env.DB.prepare(
        'SELECT * FROM homework_gradings_v2 ORDER BY gradedAt DESC LIMIT 5'
      ).all();

      results.tables.homework_gradings_v2 = {
        exists: true,
        totalCount: gradingsCount?.count || 0,
        recentRecords: recentGradings.results || []
      };
    } catch (e) {
      results.tables.homework_gradings_v2 = {
        exists: false,
        error: e.message
      };
    }

    // 3. homework_images 테이블 확인
    try {
      const imagesCount = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM homework_images'
      ).first();

      results.tables.homework_images = {
        exists: true,
        totalCount: imagesCount?.count || 0
      };
    } catch (e) {
      results.tables.homework_images = {
        exists: false,
        error: e.message
      };
    }

    // 4. User 테이블에서 학생 수 확인
    try {
      const studentCount = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM User WHERE role = ?'
      ).bind('STUDENT').first();

      results.tables.User = {
        exists: true,
        studentCount: studentCount?.count || 0
      };
    } catch (e) {
      // users 테이블 시도
      try {
        const studentCount = await env.DB.prepare(
          'SELECT COUNT(*) as count FROM users WHERE role = ?'
        ).bind('STUDENT').first();

        results.tables.users = {
          exists: true,
          studentCount: studentCount?.count || 0
        };
      } catch (e2) {
        results.tables.User = {
          exists: false,
          error: e.message
        };
      }
    }

    // 5. 오늘 제출된 숙제 확인
    const now = new Date();
    const kstOffset = 9 * 60;
    const kstDate = new Date(now.getTime() + kstOffset * 60 * 1000);
    const today = kstDate.toISOString().split('T')[0];

    try {
      const todaySubmissions = await env.DB.prepare(
        `SELECT COUNT(*) as count FROM homework_submissions_v2 
         WHERE SUBSTR(submittedAt, 1, 10) = ?`
      ).bind(today).first();

      results.todaySubmissions = {
        date: today,
        count: todaySubmissions?.count || 0
      };
    } catch (e) {
      results.todaySubmissions = {
        error: e.message
      };
    }

    return new Response(JSON.stringify({
      success: true,
      data: results
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ 디버그 API 오류:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
