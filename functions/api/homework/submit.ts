interface Env {
  DB: D1Database;
  // HOMEWORK_QUEUE: Queue; // Disabled - Queue not available in Pages deployment
}

/**
 * 숙제 제출 API (백그라운드 처리)
 * POST /api/homework/submit
 * 
 * 이 엔드포인트는 숙제를 즉시 DB에 저장하고, 
 * 채점 작업을 Queue에 전송하여 백그라운드에서 처리합니다.
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

    // Queue는 Pages 배포에서 지원되지 않음
    console.warn('⚠️ HOMEWORK_QUEUE not available in Pages deployment');
    return new Response(
      JSON.stringify({ 
        error: "Background processing not available",
        message: "Queue not configured in Pages deployment. Use /api/homework/grade for sync processing",
        alternativeEndpoint: "/api/homework/grade"
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );

    // 다중 이미지 또는 단일 이미지 처리
    const imageArray = images || (image ? [image] : []);

    if (!userId || imageArray.length === 0) {
      return new Response(
        JSON.stringify({ error: "userId and images are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`📚 백그라운드 처리: ${imageArray.length}장 이미지`);
    
    // 이미지 크기 검증 (각 이미지 최대 4MB)
    const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB
    for (let i = 0; i < imageArray.length; i++) {
      const imgSize = imageArray[i].length;
      
      if (imgSize > MAX_IMAGE_SIZE) {
        return new Response(
          JSON.stringify({ 
            error: "Image too large",
            message: `이미지 ${i + 1}의 크기가 너무 큽니다 (최대 4MB)`,
            imageSize: `${(imgSize / 1024 / 1024).toFixed(2)}MB`
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // 1. 사용자 정보 조회
    const user = await DB.prepare(
      "SELECT id, name, email, academyId FROM users WHERE id = ?"
    ).bind(userId).first();

    if (!user) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. homework_submissions_v2 테이블 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS homework_submissions_v2 (
        id TEXT PRIMARY KEY,
        userId INTEGER NOT NULL,
        code TEXT,
        imageUrl TEXT,
        submittedAt TEXT DEFAULT (datetime('now')),
        status TEXT DEFAULT 'submitted',
        academyId INTEGER
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
      VALUES (?, ?, ?, ?, ?, 'processing', ?)
    `).bind(submissionId, userId, code || null, imageUrlsJson, kstTimestamp, user.academyId || null).run();

    console.log(`✅ 숙제 제출 기록 생성: ${submissionId} (status: processing)`);

    // 4. Queue에 채점 작업 전송
    try {
      await HOMEWORK_QUEUE.send({
        submissionId,
        userId,
        code,
        images: imageArray,
        academyId: user.academyId,
        userName: user.name,
        submittedAt: kstTimestamp
      });
      
      console.log(`✅ Queue에 채점 작업 전송: ${submissionId}`);
    } catch (queueError: any) {
      console.error('❌ Queue 전송 실패:', queueError.message);
      
      // Queue 전송 실패 시 상태를 'failed'로 변경
      await DB.prepare(`
        UPDATE homework_submissions_v2 
        SET status = 'failed' 
        WHERE id = ?
      `).bind(submissionId).run();
      
      return new Response(
        JSON.stringify({
          error: "Failed to queue homework for grading",
          message: "채점 작업을 큐에 추가하지 못했습니다",
          submissionId
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 5. 즉시 응답 반환 (채점은 백그라운드에서 진행)
    return new Response(
      JSON.stringify({
        success: true,
        message: `숙제가 제출되었습니다. 채점이 백그라운드에서 진행 중입니다 (${imageArray.length}장)`,
        submission: {
          id: submissionId,
          userId: userId,
          studentName: user.name,
          submittedAt: kstTimestamp,
          status: 'processing',
          imageCount: imageArray.length
        },
        estimatedCompletionTime: `${Math.ceil(imageArray.length * 10)}초 예상`,
        checkStatusUrl: `/api/homework/status/${submissionId}`
      }),
      { status: 202, headers: { "Content-Type": "application/json" } }
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
