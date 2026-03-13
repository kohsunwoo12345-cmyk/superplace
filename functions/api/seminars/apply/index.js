// Seminar Applications API

// Helper: Korean time
function getKoreanTime() {
  const now = new Date();
  const kstOffset = 9 * 60;
  const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
  return kstTime.toISOString().replace('T', ' ').substring(0, 19);
}

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

// POST: 세미나 신청
export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const db = env.DB;

    console.log('📝 Seminar Application POST called');

    if (!db) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Database not configured' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse body
    const body = await request.json();
    const { 
      seminarId,
      applicantName, 
      applicantEmail, 
      applicantPhone,
      academyName,
      position,
      additionalInfo
    } = body;

    if (!seminarId || !applicantName || !applicantEmail) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Required fields missing'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if seminar exists and is active
    const seminar = await db.prepare(`
      SELECT * FROM seminars WHERE id = ? AND status = 'active'
    `).bind(seminarId).first();

    if (!seminar) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Seminar not found or inactive'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check participant limit
    const applicationsCount = await db.prepare(`
      SELECT COUNT(*) as count FROM seminar_applications WHERE seminarId = ?
    `).bind(seminarId).first();

    if (applicationsCount.count >= seminar.maxParticipants) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Seminar is full',
        message: '세미나 정원이 마감되었습니다'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if already applied
    const existingApplication = await db.prepare(`
      SELECT id FROM seminar_applications 
      WHERE seminarId = ? AND applicantEmail = ?
    `).bind(seminarId, applicantEmail).first();

    if (existingApplication) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Already applied',
        message: '이미 신청하신 세미나입니다'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate unique ID
    const applicationId = `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = getKoreanTime();

    console.log('Creating application:', {
      applicationId,
      seminarId,
      applicantName,
      applicantEmail
    });

    // Insert application
    await db.prepare(`
      INSERT INTO seminar_applications (
        id, seminarId, applicantName, applicantEmail, applicantPhone,
        academyName, position, additionalInfo, status, appliedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).bind(
      applicationId,
      seminarId,
      applicantName,
      applicantEmail,
      applicantPhone || null,
      academyName || null,
      position || null,
      additionalInfo || null,
      now
    ).run();

    console.log('✅ Application created:', applicationId);

    return new Response(JSON.stringify({
      success: true,
      applicationId: applicationId,
      message: '세미나 신청이 완료되었습니다'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error creating application:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create application',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// GET: 신청자 목록 조회
export async function onRequestGet(context) {
  try {
    const { request, env } = context;
    const db = env.DB;
    const url = new URL(request.url);
    const seminarId = url.searchParams.get('seminarId');

    console.log('📚 Seminar Applications GET called');

    if (!db) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Database not configured' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Auth check for viewing applications (admin only)
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

    // Get applications
    const applications = await db.prepare(`
      SELECT * FROM seminar_applications 
      WHERE seminarId = ?
      ORDER BY appliedAt DESC
    `).bind(seminarId).all();

    console.log(`✅ Returning ${(applications.results || []).length} applications`);

    return new Response(JSON.stringify({
      success: true,
      applications: applications.results || [],
      count: (applications.results || []).length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error loading applications:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
