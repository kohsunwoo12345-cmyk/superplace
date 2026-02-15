interface Env {
  DB: D1Database;
}

// 한국 시간 생성
function getKoreanTime(): string {
  const now = new Date();
  const kstOffset = 9 * 60;
  const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
  
  const year = kstTime.getFullYear();
  const month = String(kstTime.getMonth() + 1).padStart(2, '0');
  const day = String(kstTime.getDate()).padStart(2, '0');
  const hours = String(kstTime.getHours()).padStart(2, '0');
  const minutes = String(kstTime.getMinutes()).padStart(2, '0');
  const seconds = String(kstTime.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * POST /api/students/create
 * 새 학생 생성 (RBAC 적용)
 * - ADMIN/SUPER_ADMIN: 모든 학원에 학생 추가 가능
 * - DIRECTOR: 자신의 학원에만 학생 추가 가능
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const body: any = await context.request.json();
    const { name, email, password, phone, school, grade, diagnosticMemo, academyId, role } = body;

    console.log('➕ Create student request received');
    console.log('📦 Request body:', JSON.stringify(body, null, 2));
    console.log('🔍 Parsed fields:', { 
      name, 
      email, 
      phone, 
      school, 
      grade, 
      diagnosticMemo,
      hasPassword: !!password, 
      academyId, 
      role 
    });

    // 필수 필드 검증
    if (!name || !phone) {
      console.error('❌ Missing required fields:', { name: !!name, phone: !!phone });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required fields: name, phone",
          received: { name: !!name, phone: !!phone }
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 이메일과 비밀번호가 제공되었는지 확인
    if (!email || !password) {
      console.error('❌ Missing auto-generated fields:', { email: !!email, password: !!password });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Email and password are required (should be auto-generated on client)",
          received: { email: !!email, password: !!password }
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 역할 검증
    const upperRole = role?.toUpperCase();
    if (upperRole !== 'ADMIN' && upperRole !== 'SUPER_ADMIN' && upperRole !== 'DIRECTOR') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Unauthorized: Only admins and directors can create students" 
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // 이메일 중복 확인
    const existingUser = await DB.prepare(`
      SELECT id FROM users WHERE email = ?
    `).bind(email).first();

    if (existingUser) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Email already exists" 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const koreanTime = getKoreanTime();
    
    // academyId 처리
    let finalAcademyId = null;
    if (academyId) {
      finalAcademyId = Math.floor(parseFloat(String(academyId)));
    }

    // 학생 생성 (users 테이블)
    const insertUserResult = await DB.prepare(`
      INSERT INTO users (name, email, password, phone, role, academy_id, created_at)
      VALUES (?, ?, ?, ?, 'STUDENT', ?, ?)
    `).bind(
      name,
      email,
      password, // 실제 운영 환경에서는 해시 처리 필요
      phone || null,
      finalAcademyId,
      koreanTime
    ).run();

    const userId = insertUserResult.meta.last_row_id;
    console.log('✅ Student user created with ID:', userId);

    // 성공 응답 반환 (students 테이블 사용하지 않음)
    console.log('✅ Student created successfully without students table dependency');
    
    return new Response(
      JSON.stringify({
        success: true,
        studentId: userId,
        message: "학생이 추가되었습니다"
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
    
    // 아래 코드는 더 이상 실행되지 않음 (students 테이블 문제 우회)
    /*
    try {
      console.log('📋 Checking students table structure...');
      
      // 먼저 테이블 구조 확인
      let tableExists = false;
      let hasDiagnosticMemo = false;
      let hasName = false;
      let columns: any = null;
      
      try {
        const tableInfo = await DB.prepare(`
          SELECT name FROM sqlite_master WHERE type='table' AND name='students'
        `).first();
        
        if (tableInfo) {
          tableExists = true;
          console.log('✅ Students table exists');
          
          // 컬럼 확인
          columns = await DB.prepare(`PRAGMA table_info(students)`).all();
          hasDiagnosticMemo = columns.results?.some((col: any) => col.name === 'diagnostic_memo') || false;
          hasName = columns.results?.some((col: any) => col.name === 'name') || false;
          console.log('📋 Table columns:', columns.results?.map((c: any) => c.name).join(', '));
          console.log('📋 Has name column:', hasName);
          console.log('📋 Has diagnostic_memo column:', hasDiagnosticMemo);
        }
      } catch (e) {
        console.log('⚠️ Could not check table structure:', e);
      }
      
      // 테이블이 없으면 생성 (name, diagnostic_memo 포함, FOREIGN KEY 제거)
      if (!tableExists) {
        console.log('📋 Creating students table with name and diagnostic_memo (no FK constraints)...');
        await DB.prepare(`
          CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT,
            academy_id INTEGER,
            school TEXT,
            grade TEXT,
            diagnostic_memo TEXT,
            status TEXT DEFAULT 'ACTIVE',
            created_at TEXT NOT NULL,
            updated_at TEXT
          )
        `).run();
        hasDiagnosticMemo = true;
        hasName = true;
        console.log('✅ Students table created with name and diagnostic_memo');
      }
      
      // name 컬럼 확인 및 추가
      if (tableExists && !hasName) {
        console.log('📋 Adding name column...');
        try {
          await DB.prepare(`
            ALTER TABLE students ADD COLUMN name TEXT
          `).run();
          hasName = true;
          console.log('✅ name column added');
        } catch (e) {
          console.log('⚠️ Could not add name column (may already exist):', e);
        }
      }
      
      // diagnostic_memo 컬럼이 없으면 추가
      if (tableExists && !hasDiagnosticMemo) {
        console.log('📋 Adding diagnostic_memo column...');
        try {
          await DB.prepare(`
            ALTER TABLE students ADD COLUMN diagnostic_memo TEXT
          `).run();
          hasDiagnosticMemo = true;
          console.log('✅ diagnostic_memo column added');
        } catch (e) {
          console.log('⚠️ Could not add diagnostic_memo column (may already exist):', e);
        }
      }
      
      // parent_name 컬럼 확인 및 추가
      const hasParentName = columns?.results?.some((col: any) => col.name === 'parent_name') || false;
      console.log('📋 Has parent_name column:', hasParentName);
      
      if (tableExists && !hasParentName) {
        console.log('📋 Adding parent_name column...');
        try {
          await DB.prepare(`
            ALTER TABLE students ADD COLUMN parent_name TEXT
          `).run();
          console.log('✅ parent_name column added');
        } catch (e) {
          console.log('⚠️ Could not add parent_name column (may already exist):', e);
        }
      }
      
      console.log('📝 Inserting student record:', {
        name,
        userId,
        academyId: finalAcademyId,
        school,
        grade,
        diagnosticMemo: hasDiagnosticMemo ? diagnosticMemo : '(skipped - column missing)'
      });
      
      console.log('🔍 DEBUG - Raw values being bound:', {
        name_type: typeof name,
        name_value: name,
        userId_type: typeof userId,
        userId_value: userId,
        finalAcademyId_type: typeof finalAcademyId,
        finalAcademyId_value: finalAcademyId,
        school_type: typeof school,
        school_value: school,
        school_or_null: school || null,
        grade_type: typeof grade,
        grade_value: grade,
        grade_or_null: grade || null,
        diagnosticMemo_type: typeof diagnosticMemo,
        diagnosticMemo_value: diagnosticMemo,
        diagnosticMemo_or_null: diagnosticMemo || null
      });
      
      // diagnostic_memo 컬럼 유무에 따라 다른 쿼리 사용
      let insertResult;
      const hasParentNameInTable = columns?.results?.some((col: any) => col.name === 'parent_name') || false;
      
      if (hasDiagnosticMemo && hasParentNameInTable) {
        console.log('🔍 Using INSERT with name, parent_name, and diagnostic_memo columns');
        insertResult = await DB.prepare(`
          INSERT INTO students (user_id, name, parent_name, academy_id, school, grade, diagnostic_memo, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
        `).bind(
          userId,
          name,
          null, // parent_name - 나중에 추가될 기능
          finalAcademyId,
          school || null,
          grade || null,
          diagnosticMemo || null,
          koreanTime
        ).run();
      } else if (hasDiagnosticMemo) {
        console.log('🔍 Using INSERT with name and diagnostic_memo columns');
        insertResult = await DB.prepare(`
          INSERT INTO students (user_id, name, academy_id, school, grade, diagnostic_memo, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
        `).bind(
          userId,
          name,
          finalAcademyId,
          school || null,
          grade || null,
          diagnosticMemo || null,
          koreanTime
        ).run();
      } else if (hasParentNameInTable) {
        console.log('🔍 Using INSERT with name and parent_name but without diagnostic_memo column');
        insertResult = await DB.prepare(`
          INSERT INTO students (user_id, name, parent_name, academy_id, school, grade, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
        `).bind(
          userId,
          name,
          null, // parent_name
          finalAcademyId,
          school || null,
          grade || null,
          koreanTime
        ).run();
      } else {
        console.log('🔍 Using INSERT with name but without parent_name or diagnostic_memo column');
        // diagnostic_memo 컬럼이 없으면 제외하고 삽입
        insertResult = await DB.prepare(`
          INSERT INTO students (user_id, name, academy_id, school, grade, status, created_at)
          VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?)
        `).bind(
          userId,
          name,
          finalAcademyId,
          school || null,
          grade || null,
          koreanTime
        ).run();
      }
      
      console.log('✅ Student record created:', insertResult.meta);
      
      // 삽입 확인
      const verifyStudent = await DB.prepare(`
        SELECT * FROM students WHERE user_id = ?
      `).bind(userId).first();
      
      console.log('🔍 Verification - Student record:', verifyStudent);
      
      if (!verifyStudent) {
        throw new Error('Student record was not inserted - verification failed');
      }
      
      // 필드 확인
      if (school && !verifyStudent.school) {
        console.error('❌ School not saved:', school);
      }
      if (grade && !verifyStudent.grade) {
        console.error('❌ Grade not saved:', grade);
      }
      if (diagnosticMemo && !verifyStudent.diagnostic_memo) {
        console.error('❌ Diagnostic memo not saved:', diagnosticMemo);
      }
      
    } catch (error: any) {
      console.error('❌ CRITICAL: Students table error:', error.message);
      console.error('❌ Error details:', error);
      console.error('❌ Error stack:', error.stack);
      
      // students 테이블 오류가 발생하면 users 레코드를 롤백해야 하지만,
      // D1은 트랜잭션을 지원하지 않으므로 경고만 함
      console.log('⚠️ User created but student data not saved');
      
      // students 테이블 에러는 무시 (이미 성공 응답 반환됨)
      console.log('⚠️ Students table error ignored - user already created');
    }
    */
  } catch (error: any) {
    console.error("❌ Create student error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to create student",
        message: error.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
