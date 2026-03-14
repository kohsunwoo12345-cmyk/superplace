// Seminars API - Complete CRUD + Applications Management

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

// Helper: Korean time
function getKoreanTime() {
  const now = new Date();
  const kstOffset = 9 * 60;
  const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
  return kstTime.toISOString().replace('T', ' ').substring(0, 19);
}

// GET: 세미나 목록 조회
export async function onRequestGet(context) {
  try {
    const { request, env } = context;
    const db = env.DB;
    const url = new URL(request.url);
    const seminarId = url.searchParams.get('id');

    console.log('📚 Seminars API GET called');

    if (!db) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Database not configured' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 특정 세미나 조회
    if (seminarId) {
      const seminar = await db.prepare(`
        SELECT * FROM seminars WHERE id = ?
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

      // 신청자 수 조회
      const applicationsCount = await db.prepare(`
        SELECT COUNT(*) as count FROM seminar_applications WHERE seminarId = ?
      `).bind(seminarId).first();

      seminar.currentParticipants = applicationsCount?.count || 0;

      return new Response(JSON.stringify({
        success: true,
        seminar: seminar
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Query parameters
    const limit = url.searchParams.get('limit');
    const statusFilter = url.searchParams.get('status');

    // Build query
    let query = 'SELECT * FROM seminars WHERE 1=1';
    const params = [];

    // Status filter
    if (statusFilter) {
      query += ' AND status = ?';
      params.push(statusFilter);
    }

    // Order by date
    query += ' ORDER BY date DESC, createdAt DESC';

    // Limit
    if (limit) {
      query += ' LIMIT ?';
      params.push(parseInt(limit, 10));
    }

    console.log('🔍 Query:', query, 'Params:', params);

    // Execute query
    let seminarsResult;
    if (params.length > 0) {
      seminarsResult = await db.prepare(query).bind(...params).all();
    } else {
      seminarsResult = await db.prepare(query).all();
    }

    // 각 세미나의 신청자 수 조회
    for (const seminar of seminarsResult.results || []) {
      const applicationsCount = await db.prepare(`
        SELECT COUNT(*) as count FROM seminar_applications WHERE seminarId = ?
      `).bind(seminar.id).first();
      
      seminar.currentParticipants = applicationsCount?.count || 0;
    }

    console.log(`✅ Returning ${(seminarsResult.results || []).length} seminars`);

    return new Response(JSON.stringify({
      success: true,
      seminars: seminarsResult.results || [],
      count: (seminarsResult.results || []).length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error loading seminars:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST: 세미나 생성
export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const db = env.DB;

    console.log('📝 Seminars API POST called');

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

    // Only SUPER_ADMIN can create seminars
    if (role !== 'SUPER_ADMIN') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Insufficient permissions',
        message: '세미나를 생성할 권한이 없습니다'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse body
    const body = await request.json();
    const { 
      title, 
      description, 
      detailHtml, 
      mainImage, 
      instructor, 
      date, 
      time, 
      location, 
      locationType,
      maxParticipants,
      formHtml,
      useCustomForm,
      ctaButtonText,
      requiredFields
    } = body;

    if (!title || !date || !time) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Required fields missing'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate unique ID
    const seminarId = `seminar-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = getKoreanTime();

    console.log('Creating seminar:', {
      seminarId,
      title,
      date,
      time
    });

    // Try to insert with new fields, fallback if columns don't exist
    try {
      await db.prepare(`
        INSERT INTO seminars (
          id, title, description, detailHtml, mainImage, instructor, 
          date, time, location, locationType, maxParticipants, 
          status, formHtml, useCustomForm, ctaButtonText, requiredFields, 
          createdBy, createdAt, updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        seminarId,
        title,
        description || null,
        detailHtml || null,
        mainImage || null,
        instructor || null,
        date,
        time,
        location || null,
        locationType || 'online',
        maxParticipants || 100,
        formHtml || null,
        useCustomForm || 0,
        ctaButtonText || '신청하기',
        requiredFields ? JSON.stringify(requiredFields) : null,
        user.id,
        now,
        now
      ).run();
    } catch (insertError) {
      // If new columns don't exist, use old schema
      if (insertError.message.includes('no column named')) {
        console.log('⚠️ Using legacy schema (without custom form fields)');
        await db.prepare(`
          INSERT INTO seminars (
            id, title, description, detailHtml, mainImage, instructor, 
            date, time, location, locationType, maxParticipants, 
            status, formHtml, useCustomForm, createdBy, createdAt, updatedAt
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?)
        `).bind(
          seminarId,
          title,
          description || null,
          detailHtml || null,
          mainImage || null,
          instructor || null,
          date,
          time,
          location || null,
          locationType || 'online',
          maxParticipants || 100,
          formHtml || null,
          useCustomForm || 0,
          user.id,
          now,
          now
        ).run();
      } else {
        throw insertError;
      }
    }

    console.log('✅ Seminar created:', seminarId);

    return new Response(JSON.stringify({
      success: true,
      seminarId: seminarId,
      message: '세미나가 생성되었습니다'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error creating seminar:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create seminar',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// PATCH: 세미나 수정
export async function onRequestPatch(context) {
  try {
    const { request, env } = context;
    const db = env.DB;

    console.log('✏️ Seminars API PATCH called');

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

    // Get seminar ID from URL
    const url = new URL(request.url);
    const seminarId = url.searchParams.get('id');

    if (!seminarId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Seminar ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse body
    const body = await request.json();
    const { 
      title, 
      description, 
      detailHtml, 
      mainImage, 
      instructor, 
      date, 
      time, 
      location, 
      locationType,
      maxParticipants,
      status,
      formHtml,
      useCustomForm
    } = body;

    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (detailHtml !== undefined) {
      updates.push('detailHtml = ?');
      params.push(detailHtml);
    }
    if (mainImage !== undefined) {
      updates.push('mainImage = ?');
      params.push(mainImage);
    }
    if (instructor !== undefined) {
      updates.push('instructor = ?');
      params.push(instructor);
    }
    if (date !== undefined) {
      updates.push('date = ?');
      params.push(date);
    }
    if (time !== undefined) {
      updates.push('time = ?');
      params.push(time);
    }
    if (location !== undefined) {
      updates.push('location = ?');
      params.push(location);
    }
    if (locationType !== undefined) {
      updates.push('locationType = ?');
      params.push(locationType);
    }
    if (maxParticipants !== undefined) {
      updates.push('maxParticipants = ?');
      params.push(maxParticipants);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    if (formHtml !== undefined) {
      updates.push('formHtml = ?');
      params.push(formHtml);
    }
    if (useCustomForm !== undefined) {
      updates.push('useCustomForm = ?');
      params.push(useCustomForm);
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No fields to update'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Add updatedAt
    const now = getKoreanTime();
    updates.push('updatedAt = ?');
    params.push(now);

    // Add seminarId
    params.push(seminarId);

    const query = `UPDATE seminars SET ${updates.join(', ')} WHERE id = ?`;
    
    console.log('Updating seminar:', { seminarId, updates });

    await db.prepare(query).bind(...params).run();

    console.log('✅ Seminar updated:', seminarId);

    return new Response(JSON.stringify({
      success: true,
      message: '세미나가 수정되었습니다'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error updating seminar:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// DELETE: 세미나 삭제 (상태 변경)
export async function onRequestDelete(context) {
  try {
    const { request, env } = context;
    const db = env.DB;

    console.log('🗑️ Seminars API DELETE called');

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

    // Get seminar ID from URL
    const url = new URL(request.url);
    const seminarId = url.searchParams.get('id');

    if (!seminarId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Seminar ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Deleting seminar:', seminarId);

    // 1. 먼저 연관된 신청 데이터 삭제
    const deleteApplicationsResult = await db.prepare(`
      DELETE FROM seminar_applications WHERE seminarId = ?
    `).bind(seminarId).run();
    
    console.log('🗑️ Deleted applications:', deleteApplicationsResult.meta?.changes || 0);

    // 2. 세미나 완전 삭제 (DB에서 실제로 삭제)
    const result = await db.prepare(`
      DELETE FROM seminars WHERE id = ?
    `).bind(seminarId).run();

    console.log('✅ Seminar deleted:', seminarId, 'Changes:', result.meta?.changes || 0);

    if (result.meta?.changes === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Seminar not found or already deleted'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: '세미나가 완전히 삭제되었습니다'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error deleting seminar:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
