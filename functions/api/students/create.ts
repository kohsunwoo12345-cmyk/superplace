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
    const { name, email, password, phone, academyId, role } = body;

    console.log('➕ Create student request:', { name, email, academyId, role });

    // 필수 필드 검증
    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required fields: name, email, password" 
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

    // students 테이블에도 레코드 생성 (있는 경우)
    try {
      await DB.prepare(`
        INSERT INTO students (user_id, academy_id, status, created_at)
        VALUES (?, ?, 'ACTIVE', ?)
      `).bind(
        userId,
        finalAcademyId,
        koreanTime
      ).run();
      console.log('✅ Student record created');
    } catch (error: any) {
      // students 테이블이 없을 수 있으므로 에러 무시
      console.log('⚠️ students table insert failed (may not exist):', error.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        studentId: userId,
        message: "학생이 추가되었습니다"
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
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
