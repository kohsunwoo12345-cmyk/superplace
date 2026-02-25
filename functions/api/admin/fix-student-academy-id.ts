/**
 * 🔧 Academy ID 수정 API
 * 
 * 목적: academyId가 null인 학생들의 academyId를 업데이트
 * 
 * 사용법:
 * POST /api/admin/fix-student-academy-id
 * Body: { "studentUserId": "247", "academyId": 1 }
 */

interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const DB = env.DB;

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: 'Database not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json() as any;
    const { studentUserId, academyId } = body;

    console.log('🔧 Fix Academy ID Request:', { studentUserId, academyId });

    if (!studentUserId || !academyId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing studentUserId or academyId',
          message: 'studentUserId와 academyId를 모두 제공해야 합니다'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updates: any = {
      userTable: null,
      usersTable: null,
      attendanceRecords: null,
      attendanceCodes: null
    };

    // 1. User 테이블 업데이트 (PascalCase)
    try {
      console.log('📝 Updating User table (PascalCase)...');
      const userResult = await DB
        .prepare(`UPDATE User SET academyId = ? WHERE id = ?`)
        .bind(academyId, studentUserId)
        .run();
      
      updates.userTable = {
        success: true,
        changes: userResult.meta.changes
      };
      console.log('✅ User table updated:', updates.userTable);
    } catch (e: any) {
      console.error('❌ User table update failed:', e.message);
      updates.userTable = {
        success: false,
        error: e.message
      };
    }

    // 2. users 테이블 업데이트 (snake_case, academyId 컬럼)
    try {
      console.log('📝 Updating users table (snake_case, academyId)...');
      const usersResult = await DB
        .prepare(`UPDATE users SET academyId = ? WHERE id = ?`)
        .bind(academyId, studentUserId)
        .run();
      
      updates.usersTable = {
        success: true,
        changes: usersResult.meta.changes
      };
      console.log('✅ users table updated:', updates.usersTable);
    } catch (e: any) {
      console.error('❌ users table update failed:', e.message);
      
      // 실패하면 academy_id (INTEGER) 컬럼 시도
      try {
        console.log('📝 Retrying with academy_id (INTEGER) column...');
        const usersResult2 = await DB
          .prepare(`UPDATE users SET academy_id = ? WHERE id = ?`)
          .bind(academyId, studentUserId)
          .run();
        
        updates.usersTable = {
          success: true,
          changes: usersResult2.meta.changes,
          column: 'academy_id'
        };
        console.log('✅ users table updated with academy_id:', updates.usersTable);
      } catch (e2: any) {
        console.error('❌ users table (academy_id) update failed:', e2.message);
        updates.usersTable = {
          success: false,
          error: e2.message
        };
      }
    }

    // 3. attendance_records_v2 테이블 업데이트
    try {
      console.log('📝 Updating attendance_records_v2 table...');
      const attendanceResult = await DB
        .prepare(`UPDATE attendance_records_v2 SET academyId = ? WHERE userId = ?`)
        .bind(academyId, studentUserId)
        .run();
      
      updates.attendanceRecords = {
        success: true,
        changes: attendanceResult.meta.changes
      };
      console.log('✅ attendance_records_v2 updated:', updates.attendanceRecords);
    } catch (e: any) {
      console.error('❌ attendance_records_v2 update failed:', e.message);
      updates.attendanceRecords = {
        success: false,
        error: e.message
      };
    }

    // 4. student_attendance_codes 테이블 업데이트
    try {
      console.log('📝 Updating student_attendance_codes table...');
      const codesResult = await DB
        .prepare(`UPDATE student_attendance_codes SET academyId = ? WHERE userId = ?`)
        .bind(academyId, studentUserId)
        .run();
      
      updates.attendanceCodes = {
        success: true,
        changes: codesResult.meta.changes
      };
      console.log('✅ student_attendance_codes updated:', updates.attendanceCodes);
    } catch (e: any) {
      console.error('❌ student_attendance_codes update failed:', e.message);
      updates.attendanceCodes = {
        success: false,
        error: e.message
      };
    }

    // 5. 업데이트 후 학생 정보 조회 (User와 users 모두 시도)
    let studentInfo = null;
    
    // User 테이블 시도
    try {
      studentInfo = await DB
        .prepare(`
          SELECT 
            u.id, u.name, u.email, u.academyId,
            (SELECT COUNT(*) FROM attendance_records_v2 WHERE userId = u.id) as attendanceCount,
            (SELECT code FROM student_attendance_codes WHERE userId = u.id LIMIT 1) as attendanceCode
          FROM User u
          WHERE u.id = ?
        `)
        .bind(studentUserId)
        .first();
      
      if (studentInfo) {
        console.log('✅ Student info from User table:', studentInfo);
      }
    } catch (e: any) {
      console.log('❌ Failed to fetch from User table:', e.message);
    }

    // users 테이블 시도 (User 테이블에서 못 찾은 경우)
    if (!studentInfo) {
      try {
        studentInfo = await DB
          .prepare(`
            SELECT 
              u.id, u.name, u.email, u.academyId,
              (SELECT COUNT(*) FROM attendance_records_v2 WHERE userId = u.id) as attendanceCount,
              (SELECT code FROM student_attendance_codes WHERE userId = u.id LIMIT 1) as attendanceCode
            FROM users u
            WHERE u.id = ?
          `)
          .bind(studentUserId)
          .first();
        
        if (studentInfo) {
          console.log('✅ Student info from users table:', studentInfo);
        }
      } catch (e: any) {
        // academy_id 컬럼으로 재시도
        try {
          studentInfo = await DB
            .prepare(`
              SELECT 
                u.id, u.name, u.email, u.academy_id as academyId,
                (SELECT COUNT(*) FROM attendance_records_v2 WHERE userId = u.id) as attendanceCount,
                (SELECT code FROM student_attendance_codes WHERE userId = u.id LIMIT 1) as attendanceCode
              FROM users u
              WHERE u.id = ?
            `)
            .bind(studentUserId)
            .first();
          
          if (studentInfo) {
            console.log('✅ Student info from users table (academy_id):', studentInfo);
          }
        } catch (e2: any) {
          console.error('❌ Failed to fetch student info from all tables:', e2.message);
        }
      }
    }

    const allSuccess = 
      (updates.userTable?.success || updates.usersTable?.success) && 
      updates.attendanceRecords?.success && 
      updates.attendanceCodes?.success;

    return new Response(
      JSON.stringify({
        success: allSuccess,
        message: allSuccess 
          ? `학생 ${studentUserId}의 academyId가 ${academyId}로 업데이트되었습니다` 
          : '일부 테이블 업데이트가 실패했습니다',
        updates,
        studentInfo
      }),
      { 
        status: allSuccess ? 200 : 207,
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('❌ Fix Academy ID error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
