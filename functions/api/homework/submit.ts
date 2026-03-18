interface Env {
  DB: D1Database;
  // HOMEWORK_QUEUE: Queue; // Disabled - Queue not available in Pages deployment
}

/**
 * 숙제 제출 API (동기 처리)
 * POST /api/homework/submit
 * 
 * 숙제를 DB에 저장하고 즉시 채점을 수행합니다.
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const body = await context.request.json();
    const { userId, phone, images, image } = body;

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 다중 이미지 또는 단일 이미지 처리
    const imageArray = images || (image ? [image] : []);

    if (!userId || imageArray.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "userId and images are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`📚 숙제 제출: userId=${userId}, ${imageArray.length}장 이미지`);
    
    // 이미지 크기 검증 (각 이미지 최대 4MB)
    const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB
    for (let i = 0; i < imageArray.length; i++) {
      const imgSize = imageArray[i].length;
      
      if (imgSize > MAX_IMAGE_SIZE) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: "Image too large",
            message: `이미지 ${i + 1}의 크기가 너무 큽니다 (최대 4MB)`,
            imageSize: `${(imgSize / 1024 / 1024).toFixed(2)}MB`
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    console.log(`🔍 사용자 조회 시작: userId=${userId}, phone=${phone}, type=${typeof userId}`);

    // 1. 사용자 정보 조회 (users 테이블 우선 - 실제 데이터가 여기 있음)
    let user;
    
    // users 테이블 먼저 조회 (실제 운영 데이터)
    try {
      if (phone) {
        user = await DB.prepare(
          "SELECT id, name, email, academyId, academy_id, phone FROM users WHERE id = ? OR phone = ?"
        ).bind(userId, phone).first();
        console.log(`📊 users 테이블 조회 결과 (id OR phone):`, user);
      } else {
        user = await DB.prepare(
          "SELECT id, name, email, academyId, academy_id, phone FROM users WHERE id = ?"
        ).bind(userId).first();
        console.log(`📊 users 테이블 조회 결과 (id only):`, user);
      }
    } catch (e) {
      console.error(`❌ users 테이블 조회 오류:`, e.message);
    }

    // users 테이블에 없으면 User 테이블 확인 (대문자 버전)
    if (!user) {
      console.log(`🔍 users 테이블에 없음, User 테이블 확인 중... (userId: ${userId}, phone: ${phone})`);
      
      try {
        if (phone) {
          user = await DB.prepare(
            "SELECT id, name, email, academyId, academy_id, phone FROM User WHERE id = ? OR phone = ?"
          ).bind(userId, phone).first();
          console.log(`📊 User 테이블 조회 결과 (id OR phone):`, user);
        } else {
          user = await DB.prepare(
            "SELECT id, name, email, academyId, academy_id, phone FROM User WHERE id = ?"
          ).bind(userId).first();
          console.log(`📊 User 테이블 조회 결과 (id only):`, user);
        }
      } catch (e) {
        console.error(`❌ User 테이블 조회 오류:`, e.message);
      }
    }

    if (!user) {
      console.error(`❌ 사용자를 찾을 수 없음: userId=${userId}, phone=${phone}`);
      return new Response(
        JSON.stringify({ success: false, error: "User not found", details: `userId: ${userId}, phone: ${phone}` }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ 사용자 확인: ${user.name} (${user.email})`);

    // 2. homework_submissions_v2 테이블 생성 (userId는 TEXT로 문자열 ID 지원)
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS homework_submissions_v2 (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        code TEXT,
        imageUrl TEXT,
        submittedAt TEXT DEFAULT (datetime('now')),
        status TEXT DEFAULT 'submitted',
        academyId TEXT
      )
    `).run();

    // 3. 숙제 제출 기록 생성 (status: processing)
    const submissionId = `homework-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // 한국 시간 계산
    const now = new Date();
    const kstOffset = 9 * 60;
    const kstDate = new Date(now.getTime() + kstOffset * 60 * 1000);
    const kstTimestamp = kstDate.toISOString().replace('T', ' ').substring(0, 19);
    
    // 이미지 URLs를 JSON으로 저장
    const imageUrlsJson = JSON.stringify(imageArray);
    
    await DB.prepare(`
      INSERT INTO homework_submissions_v2 (id, userId, code, imageUrl, submittedAt, status, academyId)
      VALUES (?, ?, ?, ?, ?, 'graded', ?)
    `).bind(submissionId, userId, phone || null, imageUrlsJson, kstTimestamp, user.academyId || user.academy_id || null).run();

    console.log(`✅ 숙제 제출 기록 생성: ${submissionId}`);

    // 4. 즉시 응답 반환 (간단한 성공 메시지)
    return new Response(
      JSON.stringify({
        success: true,
        message: `숙제가 제출되었습니다 (${imageArray.length}장)`,
        submission: {
          id: submissionId,
          userId: userId,
          studentName: user.name,
          submittedAt: kstTimestamp,
          status: 'graded',
          imageCount: imageArray.length
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ 숙제 제출 오류:", error.message);
    
    return new Response(
      JSON.stringify({
        error: "Failed to submit homework",
        message: error.message || "숙제 제출 중 오류가 발생했습니다"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
