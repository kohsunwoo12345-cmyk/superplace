interface Env {
  DB: D1Database;
}

/**
 * 숙제 제출 API (즉시 반환)
 * POST /api/homework/submit
 * 
 * 채점은 백그라운드에서 진행되며, 결과 페이지에서 확인 가능
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const body = await context.request.json();
    const { userId, code, images, image } = body;

    if (!DB) {
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 다중 이미지 또는 단일 이미지 처리
    const imageArray = images || (image ? [image] : []);

    if (!userId || imageArray.length === 0) {
      return new Response(
        JSON.stringify({ error: "userId and images are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`📚 처리할 이미지 수: ${imageArray.length}장`);
    
    // 이미지 크기 검증 (각 이미지 최대 2MB - Base64 인코딩 고려)
    const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
    for (let i = 0; i < imageArray.length; i++) {
      const imgSize = imageArray[i].length;
      console.log(`📏 이미지 ${i + 1} 크기: ${(imgSize / 1024 / 1024).toFixed(2)}MB`);
      
      if (imgSize > MAX_IMAGE_SIZE) {
        return new Response(
          JSON.stringify({ 
            error: "Image too large",
            message: `이미지 ${i + 1}의 크기가 너무 큽니다 (최대 2MB). 사진을 다시 촬영해주세요.`,
            imageSize: `${(imgSize / 1024 / 1024).toFixed(2)}MB`
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // 1. 사용자 정보 조회 (User 테이블 먼저, 없으면 users 테이블 확인)
    let user = await DB.prepare(
      "SELECT id, name, email, academyId FROM User WHERE id = ?"
    ).bind(userId).first();

    // User 테이블에 없으면 users 테이블 확인 (레거시 지원)
    if (!user) {
      console.log(`🔍 User 테이블에 없음, users 테이블 확인 중... (userId: ${userId})`);
      const legacyUser = await DB.prepare(
        "SELECT id, name, email, academy_id as academyId FROM users WHERE id = ?"
      ).bind(userId).first();
      
      if (legacyUser) {
        console.log(`✅ users 테이블에서 발견: ${legacyUser.name}`);
        user = legacyUser;
      }
    }

    if (!user) {
      console.error(`❌ 사용자를 찾을 수 없음: userId=${userId}`);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ 사용자 확인: ${user.name} (${user.email})`);

    // 2. homework_submissions_v2 테이블 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS homework_submissions_v2 (
        id TEXT PRIMARY KEY,
        userId INTEGER NOT NULL,
        code TEXT,
        imageUrl TEXT,
        submittedAt TEXT DEFAULT (datetime('now')),
        status TEXT DEFAULT 'pending',
        academyId INTEGER
      )
    `).run();

    // 3. homework_images 테이블 생성 (이미지를 별도 저장)
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS homework_images (
        id TEXT PRIMARY KEY,
        submissionId TEXT NOT NULL,
        imageData TEXT NOT NULL,
        imageIndex INTEGER NOT NULL,
        createdAt TEXT DEFAULT (datetime('now'))
      )
    `).run();

    // 4. 숙제 제출 기록 생성 (한국 시간 사용)
    const submissionId = `homework-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // 한국 시간 계산
    const now = new Date();
    const kstOffset = 9 * 60;
    const kstDate = new Date(now.getTime() + kstOffset * 60 * 1000);
    const kstTimestamp = kstDate.toISOString().replace('T', ' ').substring(0, 19);
    
    // 이미지 개수만 저장 (실제 이미지는 별도 테이블)
    await DB.prepare(`
      INSERT INTO homework_submissions_v2 (id, userId, code, imageUrl, submittedAt, status, academyId)
      VALUES (?, ?, ?, ?, ?, 'pending', ?)
    `).bind(submissionId, userId, code || null, `${imageArray.length} images`, kstTimestamp, user.academyId || null).run();

    // 5. 이미지를 별도 테이블에 저장
    for (let i = 0; i < imageArray.length; i++) {
      const imageId = `img-${submissionId}-${i}`;
      await DB.prepare(`
        INSERT INTO homework_images (id, submissionId, imageData, imageIndex)
        VALUES (?, ?, ?, ?)
      `).bind(imageId, submissionId, imageArray[i], i).run();
    }

    console.log(`✅ 숙제 제출 완료: ${submissionId}, 이미지 ${imageArray.length}장 저장`);

    // 6. 즉시 응답 반환 (채점은 클라이언트에서 자동 호출)
    return new Response(
      JSON.stringify({
        success: true,
        message: "숙제 제출이 완료되었습니다! AI 채점이 자동으로 시작됩니다.",
        submission: {
          id: submissionId,
          userId: userId,
          studentName: user.name,
          submittedAt: kstTimestamp,
          status: 'pending',
          imageCount: imageArray.length
        },
        note: "채점 결과는 10초 후 숙제 결과 페이지에서 확인하실 수 있습니다."
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      }
    );

  } catch (error: any) {
    console.error("❌ 숙제 제출 오류:", {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return new Response(
      JSON.stringify({
        error: "Failed to submit homework",
        message: error.message || "숙제 제출 중 오류가 발생했습니다"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
