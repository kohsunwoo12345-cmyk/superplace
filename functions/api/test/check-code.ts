/**
 * 출석 코드로 학생 정보 조회 API
 * GET /api/test/check-code?code=595811
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
    const code = url.searchParams.get('code') || '595811';

    console.log('🔍 Checking code:', code);

    // 1. 출석 코드 조회
    const codeRecord = await DB
      .prepare(`SELECT * FROM student_attendance_codes WHERE code = ?`)
      .bind(code)
      .first();

    if (!codeRecord) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Code not found',
          message: `출석 코드 ${code}를 찾을 수 없습니다`
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = (codeRecord as any).userId;
    console.log('✅ Code found, userId:', userId);

    // 2. User 테이블에서 학생 정보 조회
    let student = null;
    try {
      student = await DB
        .prepare(`SELECT * FROM users WHERE id = ?`)
        .bind(userId)
        .first();
      
      if (student) {
        console.log('✅ Found in User table');
      }
    } catch (e: any) {
      console.log('User table error:', e.message);
    }

    // 3. users 테이블에서 학생 정보 조회
    let studentFromUsers = null;
    try {
      studentFromUsers = await DB
        .prepare(`SELECT * FROM users WHERE id = ?`)
        .bind(userId)
        .first();
      
      if (studentFromUsers) {
        console.log('✅ Found in users table');
      }
    } catch (e: any) {
      console.log('users table error:', e.message);
    }

    // 4. 출석 기록 조회
    const attendanceRecords = await DB
      .prepare(`
        SELECT * FROM attendance_records_v2 
        WHERE userId = ? 
        ORDER BY checkInTime DESC 
        LIMIT 5
      `)
      .bind(userId)
      .all();

    return new Response(
      JSON.stringify({
        success: true,
        code: codeRecord,
        userId: userId,
        userIdType: typeof userId,
        userIdLength: userId?.toString().length,
        foundInUser: !!student,
        student: student || null,
        foundInUsers: !!studentFromUsers,
        studentFromUsers: studentFromUsers || null,
        attendanceRecordsCount: attendanceRecords.results?.length || 0,
        recentAttendance: attendanceRecords.results?.[0] || null
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Check code error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
