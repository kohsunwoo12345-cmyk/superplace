/**
 * 학생 찾기 API (강력한 디버깅)
 * GET /api/test/find-student?userId=247
 */

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { env, request } = context;
    const DB = env.DB;

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: 'Database not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'userId parameter required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 Finding student:', userId);

    const results: any = {
      userId,
      foundIn: []
    };

    // 1. User 테이블 검색 (ID로)
    try {
      const userById = await DB
        .prepare(`SELECT * FROM User WHERE id = ?`)
        .bind(userId)
        .first();
      
      if (userById) {
        results.foundIn.push('User (by id)');
        results.userById = userById;
      }
    } catch (e: any) {
      console.log('User table (by id) error:', e.message);
    }

    // 2. User 테이블 검색 (숫자 ID로)
    try {
      const userByNumId = await DB
        .prepare(`SELECT * FROM User WHERE id = ?`)
        .bind(parseInt(userId))
        .first();
      
      if (userByNumId) {
        results.foundIn.push('User (by numeric id)');
        results.userByNumId = userByNumId;
      }
    } catch (e: any) {
      console.log('User table (by numeric id) error:', e.message);
    }

    // 3. users 테이블 검색 (ID로)
    try {
      const usersById = await DB
        .prepare(`SELECT * FROM users WHERE id = ?`)
        .bind(userId)
        .first();
      
      if (usersById) {
        results.foundIn.push('users (by id)');
        results.usersById = usersById;
      }
    } catch (e: any) {
      console.log('users table (by id) error:', e.message);
    }

    // 4. users 테이블 검색 (숫자 ID로)
    try {
      const usersByNumId = await DB
        .prepare(`SELECT * FROM users WHERE id = ?`)
        .bind(parseInt(userId))
        .first();
      
      if (usersByNumId) {
        results.foundIn.push('users (by numeric id)');
        results.usersByNumId = usersByNumId;
      }
    } catch (e: any) {
      console.log('users table (by numeric id) error:', e.message);
    }

    // 5. student_attendance_codes 테이블에서 userId로 조회
    try {
      const attendanceCode = await DB
        .prepare(`SELECT * FROM student_attendance_codes WHERE userId = ?`)
        .bind(userId)
        .first();
      
      if (attendanceCode) {
        results.foundIn.push('student_attendance_codes (by userId)');
        results.attendanceCode = attendanceCode;
      }
    } catch (e: any) {
      console.log('student_attendance_codes error:', e.message);
    }

    // 6. student_attendance_codes 테이블에서 숫자 userId로 조회
    try {
      const attendanceCodeNum = await DB
        .prepare(`SELECT * FROM student_attendance_codes WHERE userId = ?`)
        .bind(parseInt(userId))
        .first();
      
      if (attendanceCodeNum) {
        results.foundIn.push('student_attendance_codes (by numeric userId)');
        results.attendanceCodeNum = attendanceCodeNum;
      }
    } catch (e: any) {
      console.log('student_attendance_codes (numeric) error:', e.message);
    }

    // 7. attendance_records_v2 테이블에서 userId로 조회
    try {
      const attendanceRecords = await DB
        .prepare(`
          SELECT * FROM attendance_records_v2 
          WHERE userId = ? 
          ORDER BY checkInTime DESC 
          LIMIT 1
        `)
        .bind(userId)
        .first();
      
      if (attendanceRecords) {
        results.foundIn.push('attendance_records_v2 (by userId)');
        results.attendanceRecords = attendanceRecords;
      }
    } catch (e: any) {
      console.log('attendance_records_v2 error:', e.message);
    }

    // 8. Code 595811로 출석 코드 조회
    try {
      const codeRecord = await DB
        .prepare(`SELECT * FROM student_attendance_codes WHERE code = '595811'`)
        .first();
      
      if (codeRecord) {
        results.foundIn.push('student_attendance_codes (by code 595811)');
        results.codeRecord = codeRecord;
      }
    } catch (e: any) {
      console.log('Code 595811 error:', e.message);
    }

    const found = results.foundIn.length > 0;

    return new Response(
      JSON.stringify({
        success: found,
        message: found 
          ? `학생 ${userId}를 ${results.foundIn.join(', ')}에서 찾았습니다` 
          : `학생 ${userId}를 어느 테이블에서도 찾지 못했습니다`,
        ...results
      }),
      { 
        status: found ? 200 : 404, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('❌ Find student error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
