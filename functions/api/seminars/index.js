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

      // 🆕 currentParticipants가 DB에 있으면 사용, 없으면 실제 신청 수 조회
      if (seminar.currentParticipants === undefined || seminar.currentParticipants === null) {
        // DB에 저장되지 않은 경우 실제 신청자 수 조회
        const applicationsCount = await db.prepare(`
          SELECT COUNT(*) as count FROM seminar_applications WHERE seminarId = ?
        `).bind(seminarId).first();

        seminar.currentParticipants = applicationsCount?.count || 0;
      }
      // DB에 저장된 currentParticipants 값이 있으면 그대로 사용

      // 🆕 날짜/시간 기반 자동 상태 판단
      if (seminar.date && seminar.status !== 'cancelled') {
        try {
          const now = new Date();
          const kstOffset = 9 * 60;
          const kstNow = new Date(now.getTime() + kstOffset * 60 * 1000);
          
          // 시간 필드 정규화
          let normalizedTime = '23:59';
          if (seminar.time) {
            const timeMatch = seminar.time.match(/(\d{1,2}):(\d{2})/);
            if (timeMatch) {
              normalizedTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
            }
          }
          
          const seminarDateTime = new Date(`${seminar.date}T${normalizedTime}:00+09:00`);
          
          if (isNaN(seminarDateTime.getTime())) {
            console.warn(`⚠️ Invalid date for seminar ${seminar.id}: ${seminar.date} ${seminar.time}`);
          } else {
            if (kstNow > seminarDateTime) {
              const previousStatus = seminar.status;
              seminar.status = 'completed';
              
              // DB 업데이트
              if (previousStatus !== 'completed') {
                await db.prepare(`
                  UPDATE seminars SET status = 'completed', updatedAt = ? WHERE id = ? AND status != 'completed'
                `).bind(getKoreanTime(), seminar.id).run();
                
                console.log(`✅ Auto-updated seminar ${seminar.id} to 'completed' (past date)`);
              }
            } else {
              if (!seminar.status || seminar.status === 'active') {
                seminar.status = 'upcoming';
              }
            }
          }
        } catch (dateError) {
          console.error(`⚠️ Date parsing error:`, dateError.message);
        }
      }

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

    // 각 세미나의 신청자 수 조회 및 자동 상태 업데이트
    const now = new Date();
    const kstOffset = 9 * 60; // Korea is UTC+9
    const kstNow = new Date(now.getTime() + kstOffset * 60 * 1000);
    
    for (const seminar of seminarsResult.results || []) {
      // 🆕 currentParticipants가 DB에 있으면 사용, 없으면 실제 신청 수 조회
      if (seminar.currentParticipants === undefined || seminar.currentParticipants === null) {
        // DB에 저장되지 않은 경우 실제 신청자 수 조회
        const applicationsCount = await db.prepare(`
          SELECT COUNT(*) as count FROM seminar_applications WHERE seminarId = ?
        `).bind(seminar.id).first();
        
        seminar.currentParticipants = applicationsCount?.count || 0;
      }
      // DB에 저장된 currentParticipants 값이 있으면 그대로 사용
      
      // 🆕 날짜/시간 기반 자동 상태 판단
      if (seminar.date && seminar.status !== 'cancelled') {
        try {
          // 시간 필드 정규화 (HH:MM 형식이 아닌 경우 기본값 사용)
          let normalizedTime = '23:59'; // 기본값: 해당 날짜 끝
          
          if (seminar.time) {
            // HH:MM 형식 추출 (예: "14:00", "09:30")
            const timeMatch = seminar.time.match(/(\d{1,2}):(\d{2})/);
            if (timeMatch) {
              normalizedTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
            }
          }
          
          // 세미나 날짜 + 시간을 Date 객체로 변환
          const seminarDateTime = new Date(`${seminar.date}T${normalizedTime}:00+09:00`);
          
          // 날짜 유효성 검사
          if (isNaN(seminarDateTime.getTime())) {
            console.warn(`⚠️ Invalid date for seminar ${seminar.id}: ${seminar.date} ${seminar.time}`);
          } else {
            // 현재 시간과 비교
            if (kstNow > seminarDateTime) {
              // 세미나 날짜/시간이 지났으면 자동으로 'completed'로 변경
              const previousStatus = seminar.status;
              seminar.status = 'completed';
              
              // DB에도 업데이트 (status가 아직 'completed'가 아닌 경우만)
              if (previousStatus !== 'completed') {
                await db.prepare(`
                  UPDATE seminars SET status = 'completed', updatedAt = ? WHERE id = ? AND status != 'completed'
                `).bind(getKoreanTime(), seminar.id).run();
                
                console.log(`✅ Auto-updated seminar ${seminar.id} to 'completed' (past date: ${seminar.date} ${normalizedTime})`);
              }
            } else {
              // 아직 시간이 안 됐으면 'upcoming'으로 유지
              if (!seminar.status || seminar.status === 'active') {
                seminar.status = 'upcoming';
              }
            }
          }
        } catch (dateError) {
          console.error(`⚠️ Date parsing error for seminar ${seminar.id}:`, dateError.message);
          // 날짜 파싱 실패 시 기존 status 유지
        }
      }
    }

    // 🆕 statusFilter 적용 후 다시 필터링
    let filteredSeminars = seminarsResult.results || [];
    if (statusFilter) {
      filteredSeminars = filteredSeminars.filter(s => s.status === statusFilter);
    }

    console.log(`✅ Returning ${filteredSeminars.length} seminars (filter: ${statusFilter || 'all'})`);

    return new Response(JSON.stringify({
      success: true,
      seminars: filteredSeminars,
      count: filteredSeminars.length
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
      currentParticipants,
      formHtml,
      useCustomForm,
      ctaButtonText,
      requiredFields,
      customFields
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
          date, time, location, locationType, maxParticipants, currentParticipants,
          status, formHtml, useCustomForm, ctaButtonText, requiredFields, customFields,
          createdBy, createdAt, updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?)
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
        currentParticipants || 0,
        formHtml || null,
        useCustomForm || 0,
        ctaButtonText || '신청하기',
        requiredFields ? JSON.stringify(requiredFields) : null,
        customFields ? JSON.stringify(customFields) : null,
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
      currentParticipants,
      status,
      formHtml,
      useCustomForm,
      ctaButtonText,
      requiredFields,
      customFields
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
    if (currentParticipants !== undefined) {
      updates.push('currentParticipants = ?');
      params.push(currentParticipants);
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
    if (ctaButtonText !== undefined) {
      updates.push('ctaButtonText = ?');
      params.push(ctaButtonText);
    }
    if (requiredFields !== undefined) {
      updates.push('requiredFields = ?');
      params.push(JSON.stringify(requiredFields));
    }
    if (customFields !== undefined) {
      updates.push('customFields = ?');
      params.push(JSON.stringify(customFields));
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
