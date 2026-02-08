interface Env {
  DB: D1Database;
}

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

// POST: 새 교사 추가
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
    const {
      name,
      email,
      phone,
      password,
      academyId,
    } = body;

    if (!name || !email || !password || !academyId) {
      return new Response(
        JSON.stringify({ success: false, error: "Name, email, password, and academy ID are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 이메일 중복 확인
    const existingUser = await DB.prepare(`
      SELECT id FROM users WHERE email = ?
    `).bind(email).first();

    if (existingUser) {
      return new Response(
        JSON.stringify({ success: false, error: "이미 존재하는 이메일입니다" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const koreanTime = getKoreanTime();

    // 새 교사 추가 (비밀번호는 평문 저장 - 실제로는 해싱 필요)
    const result = await DB.prepare(`
      INSERT INTO users 
      (email, password, name, phone, role, academy_id, created_at, status)
      VALUES (?, ?, ?, ?, 'TEACHER', ?, ?, 'active')
    `).bind(
      email,
      password, // 실제로는 bcrypt 등으로 해싱 필요
      name,
      phone || null,
      academyId,
      koreanTime
    ).run();

    // 새로 생성된 교사 정보 조회
    const newTeacher = await DB.prepare(`
      SELECT id, email, name, phone, role, academy_id as academyId, created_at as createdAt
      FROM users
      WHERE email = ?
    `).bind(email).first();

    return new Response(
      JSON.stringify({
        success: true,
        message: "교사가 추가되었습니다",
        teacher: newTeacher,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Add teacher error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to add teacher",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
