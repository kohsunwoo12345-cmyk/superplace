// Seminar Applications Excel Export API

// Helper: Parse token
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

// Helper: Get user from DB
async function getUser(db, email) {
  let user = await db
    .prepare('SELECT id, email, role, academyId FROM User WHERE email = ?')
    .bind(email)
    .first();
  
  if (!user) {
    user = await db
      .prepare('SELECT id, email, role, academy_id as academyId FROM users WHERE email = ?')
      .bind(email)
      .first();
  }
  
  return user;
}

// Helper: Convert to CSV
function convertToCSV(applications) {
  const headers = ['신청일시', '신청자명', '이메일', '연락처', '학원명', '직책', '추가정보', '상태'];
  const rows = applications.map(app => [
    app.appliedAt,
    app.applicantName,
    app.applicantEmail,
    app.applicantPhone || '',
    app.academyName || '',
    app.position || '',
    app.additionalInfo || '',
    app.status === 'pending' ? '대기' : app.status === 'approved' ? '승인' : '거부'
  ]);
  
  // Add BOM for Excel UTF-8 support
  const BOM = '\uFEFF';
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  return BOM + csvContent;
}

// GET: Export applications to Excel (CSV)
export async function onRequestGet(context) {
  try {
    const { request, env } = context;
    const db = env.DB;
    const url = new URL(request.url);
    const seminarId = url.searchParams.get('seminarId');

    console.log('📊 Excel Export GET called');

    if (!db) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Database not configured' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Auth check (admin only)
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

    const user = await getUser(db, tokenData.email);

    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User not found'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const role = user.role ? user.role.toUpperCase() : '';

    if (role !== 'SUPER_ADMIN') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Insufficient permissions'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!seminarId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Seminar ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get seminar info
    const seminar = await db.prepare(`
      SELECT title FROM seminars WHERE id = ?
    `).bind(seminarId).first();

    if (!seminar) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Seminar not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get applications
    const applications = await db.prepare(`
      SELECT * FROM seminar_applications 
      WHERE seminarId = ?
      ORDER BY appliedAt DESC
    `).bind(seminarId).all();

    console.log(`✅ Exporting ${(applications.results || []).length} applications`);

    // Convert to CSV
    const csv = convertToCSV(applications.results || []);

    // Generate filename
    const filename = `${seminar.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_신청자명단_${new Date().toISOString().split('T')[0]}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('❌ Error exporting applications:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
