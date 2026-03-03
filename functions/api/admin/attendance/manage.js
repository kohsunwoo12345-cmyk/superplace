// Cloudflare Pages Function
// POST /api/admin/attendance/manage
// 출결 관리 (생성/수정/삭제)

import { getUserFromAuth } from '../../../_lib/auth';

export async function onRequestPost(context) {
  try {
    const { DB } = context.env;
    const { request } = context;

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 인증 확인
    const userPayload = getUserFromAuth(request);
    
    if (!userPayload) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Unauthorized",
          message: "인증이 필요합니다"
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const role = userPayload.role?.toUpperCase();
    
    // DIRECTOR, TEACHER만 출결 관리 가능
    if (role !== 'DIRECTOR' && role !== 'TEACHER') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "권한이 없습니다" 
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const { 
      userId,      // 학생 ID
      date,        // 날짜 (YYYY-MM-DD)
      status,      // PRESENT, ABSENT, TARDY
      classId,     // 반 ID (optional)
      note         // 비고 (optional)
    } = body;

    console.log('📋 출결 관리 요청:', { userId, date, status, role });

    // 필수 필드 확인
    if (!userId || !date || !status) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "필수 항목이 누락되었습니다 (userId, date, status)" 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 상태 값 검증
    const validStatuses = ['PRESENT', 'ABSENT', 'TARDY'];
    if (!validStatuses.includes(status)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `유효하지 않은 상태입니다. 가능한 값: ${validStatuses.join(', ')}` 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 학생 정보 확인
    const student = await DB.prepare(`
      SELECT id, name, academyId
      FROM User
      WHERE id = ? AND role = 'STUDENT'
    `).bind(userId).first();

    if (!student) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "학생을 찾을 수 없습니다" 
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 같은 학원 학생인지 확인
    const requesterAcademyId = userPayload.academyId;
    if (role === 'TEACHER' || role === 'DIRECTOR') {
      if (student.academyId !== requesterAcademyId) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "같은 학원 학생만 관리할 수 있습니다" 
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // 기존 출결 기록 확인
    const existing = await DB.prepare(`
      SELECT id
      FROM Attendance
      WHERE userId = ? AND date = ?
    `).bind(userId, date).first();

    let result;
    const now = new Date().toISOString();

    if (existing) {
      // 기존 기록 업데이트
      result = await DB.prepare(`
        UPDATE Attendance
        SET status = ?, classId = ?, note = ?, updatedAt = ?
        WHERE id = ?
      `).bind(
        status,
        classId || null,
        note || null,
        now,
        existing.id
      ).run();

      console.log('✅ 출결 기록 업데이트:', { id: existing.id, status });
    } else {
      // 새 기록 생성
      const attendanceId = `attendance_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      result = await DB.prepare(`
        INSERT INTO Attendance (id, userId, date, status, classId, note, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        attendanceId,
        userId,
        date,
        status,
        classId || null,
        note || null,
        now,
        now
      ).run();

      console.log('✅ 출결 기록 생성:', { id: attendanceId, status });
    }

    if (!result.success) {
      throw new Error('출결 기록 저장 실패');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: existing ? "출결 기록이 수정되었습니다" : "출결 기록이 생성되었습니다",
        attendance: {
          userId,
          date,
          status,
          classId,
          note,
          studentName: student.name
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('❌ 출결 관리 에러:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "서버 오류가 발생했습니다",
        message: error.message 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// DELETE 요청으로 출결 기록 삭제
export async function onRequestDelete(context) {
  try {
    const { DB } = context.env;
    const { request } = context;

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 인증 확인
    const userPayload = getUserFromAuth(request);
    
    if (!userPayload) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Unauthorized"
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const role = userPayload.role?.toUpperCase();
    
    // DIRECTOR만 삭제 가능
    if (role !== 'DIRECTOR') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "원장만 출결 기록을 삭제할 수 있습니다" 
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const date = url.searchParams.get('date');

    if (!userId || !date) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "userId와 date 파라미터가 필요합니다" 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 출결 기록 삭제
    const result = await DB.prepare(`
      DELETE FROM Attendance
      WHERE userId = ? AND date = ?
    `).bind(userId, date).run();

    if (!result.success) {
      throw new Error('출결 기록 삭제 실패');
    }

    console.log('✅ 출결 기록 삭제:', { userId, date });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "출결 기록이 삭제되었습니다"
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('❌ 출결 기록 삭제 에러:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "서버 오류가 발생했습니다",
        message: error.message 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// GET 요청으로 출결 기록 조회
export async function onRequestGet(context) {
  try {
    const { DB } = context.env;
    const { request } = context;

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 인증 확인
    const userPayload = getUserFromAuth(request);
    
    if (!userPayload) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Unauthorized"
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    if (!userId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "userId 파라미터가 필요합니다" 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 기본 쿼리
    let query = `
      SELECT 
        a.id, a.userId, a.date, a.status, a.classId, a.note,
        a.createdAt, a.updatedAt,
        u.name as studentName
      FROM Attendance a
      LEFT JOIN User u ON a.userId = u.id
      WHERE a.userId = ?
    `;
    const params = [userId];

    // 기간 필터
    if (startDate && endDate) {
      query += ` AND a.date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    query += ` ORDER BY a.date DESC`;

    const result = await DB.prepare(query).bind(...params).all();

    console.log('✅ 출결 기록 조회:', { 
      userId, 
      count: result.results?.length || 0 
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        attendances: result.results || [],
        total: result.results?.length || 0
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('❌ 출결 기록 조회 에러:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "서버 오류가 발생했습니다",
        message: error.message 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
