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

    console.log('📝 Teacher add request received');

    if (!DB) {
      console.error('❌ DB not configured');
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

    console.log('📝 Teacher add data:', { name, email, phone, academyId: academyId });

    // 전화번호를 필수로 변경
    if (!name || !phone || !password || !academyId) {
      console.error('❌ Missing required fields:', { name: !!name, phone: !!phone, password: !!password, academyId: !!academyId });
      return new Response(
        JSON.stringify({ success: false, error: "이름, 전화번호, 비밀번호, 학원 ID는 필수입니다" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 전화번호 중복 확인
    console.log('🔍 Checking for existing phone:', phone);
    const existingUserByPhone = await DB.prepare(`
      SELECT id FROM users WHERE phone = ?
    `).bind(phone).first();

    if (existingUserByPhone) {
      console.error('❌ Phone already exists:', phone);
      return new Response(
        JSON.stringify({ success: false, error: "이미 존재하는 전화번호입니다" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 이메일이 제공된 경우에만 중복 확인
    if (email && !email.endsWith('@phone.local')) {
      console.log('🔍 Checking for existing email:', email);
      const existingUserByEmail = await DB.prepare(`
        SELECT id FROM users WHERE email = ?
      `).bind(email).first();

      if (existingUserByEmail) {
        console.error('❌ Email already exists:', email);
        return new Response(
          JSON.stringify({ success: false, error: "이미 존재하는 이메일입니다" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    const koreanTime = getKoreanTime();
    console.log('⏰ Korean time:', koreanTime);

    // academyId를 INTEGER로 변환
    const academyIdNum = parseInt(String(academyId), 10);
    console.log('🏫 Academy ID (converted):', academyIdNum);

    // 새 교사 추가 (비밀번호는 평문 저장 - 실제로는 해싱 필요)
    console.log('➕ Inserting new teacher...');
    
    // 이메일이 없으면 전화번호를 이메일로 사용 (DB 제약조건 회피)
    const emailValue = email || `${phone}@phone.local`;
    console.log('📧 Email value:', emailValue);
    
    const result = await DB.prepare(`
      INSERT INTO users 
      (email, password, name, phone, role, academy_id, created_at)
      VALUES (?, ?, ?, ?, 'TEACHER', ?, ?)
    `).bind(
      emailValue,  // 이메일 없으면 전화번호@phone.local 사용
      password, // 실제로는 bcrypt 등으로 해싱 필요
      name,
      phone,  // 전화번호 필수
      academyIdNum,
      koreanTime
    ).run();

    console.log('✅ Teacher inserted, result:', result);

    // 새로 생성된 교사 정보 조회 (전화번호로 조회)
    console.log('🔍 Fetching new teacher info...');
    const newTeacher = await DB.prepare(`
      SELECT id, email, name, phone, role, academy_id as academyId, created_at as createdAt
      FROM users
      WHERE phone = ?
    `).bind(phone).first();

    console.log('✅ New teacher created:', newTeacher);

    return new Response(
      JSON.stringify({
        success: true,
        message: "교사가 추가되었습니다",
        teacher: newTeacher,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Add teacher error:", error);
    console.error("❌ Error stack:", error.stack);
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
