// Students Create API - JavaScript version

// Simple token parser
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

// Hash password using SHA-256
async function hashPassword(password) {
  const salt = 'superplace-salt-2024';
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const db = env.DB;

    console.log('📝 Create student API called');

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
      console.error('❌ Invalid or missing token');
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user from database
    console.log('🔍 Looking up user:', tokenData.email);
    const user = await db
      .prepare('SELECT id, email, role, academyId FROM User WHERE email = ?')
      .bind(tokenData.email)
      .first();

    console.log('👤 User query result:', JSON.stringify(user));

    if (!user) {
      console.error('❌ User not found');
      return new Response(JSON.stringify({
        success: false,
        error: 'User not found'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const role = user.role ? user.role.toUpperCase() : '';
    const userAcademyId = user.academyId;
    
    console.log('🔑 User details:', { id: user.id, role, userAcademyId });

    // Check permissions
    if (role !== 'DIRECTOR' && role !== 'TEACHER' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      console.error('❌ Insufficient permissions:', role);
      return new Response(JSON.stringify({
        success: false,
        error: 'Insufficient permissions',
        message: '학생을 추가할 권한이 없습니다'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { name, email, phone, password, school, grade, classIds } = body;

    console.log('📥 Received data:', { name, email, phone, school, grade, classIds: classIds?.length || 0 });

    // Generate email if not provided (required field in DB)
    const finalEmail = email || `student-${Date.now()}@temp.superplace.com`;
    
    // Generate name if not provided (required field in DB)
    const finalName = name || `학생${Date.now()}`;
    
    console.log('📧 Final email:', finalEmail);
    console.log('👤 Final name:', finalName);

    // Validation: phone and password are required
    if (!phone || !password) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields',
        message: '연락처와 비밀번호는 필수입니다'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Password too short',
        message: '비밀번호는 최소 6자 이상이어야 합니다'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if phone already exists
    const existingUser = await db
      .prepare('SELECT id FROM User WHERE phone = ?')
      .bind(phone)
      .first();

    if (existingUser) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Phone already exists',
        message: '이미 등록된 연락처입니다'
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // If email provided, check if it exists
    if (email) {
      const existingEmail = await db
        .prepare('SELECT id FROM User WHERE email = ?')
        .bind(finalEmail)
        .first();

      if (existingEmail) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Email already exists',
          message: '이미 등록된 이메일입니다'
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);
    const studentId = `student-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // For teachers and directors, use their academyId
    const academyId = (role === 'DIRECTOR' || role === 'TEACHER') ? userAcademyId : body.academyId;

    console.log('🔍 Academy assignment:', { 
      userRole: role, 
      userAcademyId, 
      bodyAcademyId: body.academyId,
      finalAcademyId: academyId 
    });

    if (!academyId) {
      console.error('❌ No academy ID available');
      return new Response(JSON.stringify({
        success: false,
        error: 'No academy assigned',
        message: '학원이 배정되지 않았습니다'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('💾 Inserting student into database...');
    console.log('📋 Student data:', {
      studentId,
      email: email || null,
      phone,
      name: name || null,
      school: school || null,
      grade: grade || null,
      academyId,
      role: 'STUDENT'
    });

    try {
      // Step 1: Create user account (minimal fields only)
      console.log('💾 Inserting into users table...');
      console.log('📋 Values to insert:', {
        id: studentId,
        email: finalEmail,
        phone: phone,
        passwordLength: hashedPassword.length,
        name: finalName,
        role: 'STUDENT',
        academyId: academyId
      });
      
      await db
        .prepare(`
          INSERT INTO User (id, email, phone, password, name, role, academyId)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          studentId,
          finalEmail,  // Use generated email if none provided
          phone,
          hashedPassword,
          finalName,   // Use generated name if none provided
          'STUDENT',
          academyId
        )
        .run();

      console.log('✅ User account created:', { studentId, phone, academyId });

      // Verify the student was created correctly
      const verifyStudent = await db
        .prepare('SELECT id, email, name, phone, role, academyId FROM User WHERE id = ?')
        .bind(studentId)
        .first();
      
      console.log('🔍 Verify student in DB:', JSON.stringify(verifyStudent));

      // Step 2: Create student record (if students table exists)
      try {
        console.log('💾 Inserting into students table...');
        await db
          .prepare(`
            INSERT INTO students (id, userId, academyId, grade, status)
            VALUES (?, ?, ?, ?, ?)
          `)
          .bind(
            studentId,  // Same ID as user
            studentId,  // Link to user
            academyId,
            grade || null,
            'ACTIVE'
          )
          .run();

        console.log('✅ Student record created:', { studentId, grade });
      } catch (studentError) {
        console.warn('⚠️ Failed to insert into students table (may not exist):', studentError.message);
        // Continue even if students table doesn't exist
      }
    } catch (dbError) {
      console.error('❌ Database insert failed:', dbError);
      throw new Error(`데이터베이스 저장 실패: ${dbError.message}`);
    }

    // Assign to classes if classIds provided
    if (classIds && Array.isArray(classIds) && classIds.length > 0) {
      // Limit to 4 classes
      const limitedClassIds = classIds.slice(0, 4);
      
      for (const classId of limitedClassIds) {
        try {
          await db
            .prepare(`
              INSERT INTO class_students (id, classId, studentId, joinedAt)
              VALUES (?, ?, ?, datetime('now'))
            `)
            .bind(
              `cs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              classId,
              studentId
            )
            .run();
          
          console.log('✅ Assigned to class:', classId);
        } catch (error) {
          console.error('⚠️ Failed to assign to class:', classId, error.message);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: '학생이 추가되었습니다',
      studentId: studentId,
      student: {
        id: studentId,
        name: finalName,
        email: finalEmail,
        phone: phone,
        password: password, // Original password (shown only once!)
        academyId: academyId,
        role: 'STUDENT'
      },
      passwordInfo: `⚠️ 비밀번호를 안전하게 보관하세요: ${password}`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Create student error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: '학생 추가 중 오류가 발생했습니다'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
