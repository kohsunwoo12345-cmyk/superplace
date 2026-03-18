interface Env {
  DB: D1Database;
}

/**
 * 숙제 제출 API V2 (수정된 버전)
 * POST /api/homework-v2/submit
 * 
 * 숙제를 DB에 저장하고 즉시 채점을 수행합니다.
 * 전화번호로 사용자를 조회하고 user.id를 사용합니다.
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const body = await context.request.json();
    const { phone, images, image } = body;

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 다중 이미지 또는 단일 이미지 처리
    const imageArray = images || (image ? [image] : []);

    // phone이 반드시 필요함
    if (!phone || imageArray.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "phone and images are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`📚 [V2] 숙제 제출: phone=${phone}, ${imageArray.length}장 이미지`);
    
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

    console.log(`🔍 [V2] 사용자 조회 시작: phone=${phone}`);

    // 1. 전화번호로 사용자 조회 (User 테이블 우선, users 테이블 fallback - 출석 API와 동일)
    const normalizedPhone = phone.replace(/\D/g, '');  // 숫자만 추출
    console.log(`🔍 [V2] 정규화된 전화번호: ${normalizedPhone}`);
    
    let user = null;
    
    // User 테이블 조회 (대문자)
    try {
      user = await DB.prepare(
        "SELECT * FROM User WHERE phone = ? AND role = 'STUDENT' LIMIT 1"
      ).bind(normalizedPhone).first();
      console.log(`📊 [V2] User 테이블 조회 (phone=${normalizedPhone}):`, user ? `찾음: ${user.name}, id=${user.id}` : '못 찾음');
      
      // 하이픈 포함 형식도 시도
      if (!user) {
        const phoneWithHyphen = normalizedPhone.replace(/^(\d{3})(\d{4})(\d{4})$/, '$1-$2-$3');
        user = await DB.prepare(
          "SELECT * FROM User WHERE phone = ? AND role = 'STUDENT' LIMIT 1"
        ).bind(phoneWithHyphen).first();
        console.log(`📊 [V2] User 테이블 조회 (phone with hyphen=${phoneWithHyphen}):`, user ? `찾음: ${user.name}, id=${user.id}` : '못 찾음');
      }
    } catch (e) {
      console.log(`⚠️ [V2] User 테이블 조회 실패:`, e.message);
    }

    // users 테이블에서 전화번호로 조회 (소문자 - fallback)
    if (!user) {
      try {
        user = await DB.prepare(
          "SELECT * FROM users WHERE phone = ? AND role = 'STUDENT' LIMIT 1"
        ).bind(normalizedPhone).first();
        console.log(`📊 [V2] users 테이블 조회 (phone=${normalizedPhone}):`, user ? `찾음: ${user.name}, id=${user.id}` : '못 찾음');
        
        // 하이픈 포함 형식도 시도
        if (!user) {
          const phoneWithHyphen = normalizedPhone.replace(/^(\d{3})(\d{4})(\d{4})$/, '$1-$2-$3');
          user = await DB.prepare(
            "SELECT * FROM users WHERE phone = ? AND role = 'STUDENT' LIMIT 1"
          ).bind(phoneWithHyphen).first();
          console.log(`📊 [V2] users 테이블 조회 (phone with hyphen=${phoneWithHyphen}):`, user ? `찾음: ${user.name}, id=${user.id}` : '못 찾음');
        }
      } catch (e) {
        console.error(`❌ [V2] users 테이블 조회 오류:`, e.message);
        return new Response(
          JSON.stringify({ success: false, error: "Database query error", details: e.message }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    if (!user) {
      console.error(`❌ [V2] 사용자를 찾을 수 없음: phone=${normalizedPhone}`);
      return new Response(
        JSON.stringify({ success: false, error: "User not found", details: `phone: ${normalizedPhone}` }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ [V2] 사용자 확인: ${user.name} (${user.email}) - ID: ${user.id} (type: ${typeof user.id})`);

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

    // 3. 숙제 제출 기록 생성 (status: graded)
    const submissionId = `homework-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // 한국 시간 계산
    const now = new Date();
    const kstOffset = 9 * 60;
    const kstDate = new Date(now.getTime() + kstOffset * 60 * 1000);
    const kstTimestamp = kstDate.toISOString().replace('T', ' ').substring(0, 19);
    
    // 이미지 URLs를 JSON으로 저장
    const imageUrlsJson = JSON.stringify(imageArray);
    
    // *** 핵심 수정: user.id 사용 (undefined userId 대신) ***
    // status를 'processing'으로 설정하여 채점 대기 상태로 표시
    await DB.prepare(`
      INSERT INTO homework_submissions_v2 (id, userId, code, imageUrl, submittedAt, status, academyId)
      VALUES (?, ?, ?, ?, ?, 'processing', ?)
    `).bind(submissionId, user.id, phone || null, imageUrlsJson, kstTimestamp, user.academyId || user.academy_id || null).run();

    console.log(`✅ [V2] 숙제 제출 기록 생성: ${submissionId} (userId: ${user.id}, status: processing)`);

    // 4. 이미지를 homework_images 테이블에 저장 (채점 API가 조회할 수 있도록)
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS homework_images (
        id TEXT PRIMARY KEY,
        submissionId TEXT NOT NULL,
        imageIndex INTEGER NOT NULL,
        imageData TEXT NOT NULL,
        createdAt TEXT DEFAULT (datetime('now'))
      )
    `).run();

    // 각 이미지를 개별적으로 저장
    for (let i = 0; i < imageArray.length; i++) {
      const imageId = `img-${submissionId}-${i}`;
      await DB.prepare(`
        INSERT INTO homework_images (id, submissionId, imageIndex, imageData)
        VALUES (?, ?, ?, ?)
      `).bind(imageId, submissionId, i, imageArray[i]).run();
    }
    
    console.log(`✅ [V2] 이미지 ${imageArray.length}장 저장 완료`);

    // 5. 백그라운드에서 채점 시작 (즉시 응답 후 비동기 처리)
    // fetch를 사용하여 자체 process-grading API 호출
    console.log(`🤖 [V2] 채점 API 호출 시작: ${submissionId}`);
    
    // 즉시 응답 반환하고, 채점은 별도로 진행
    const response = new Response(
      JSON.stringify({
        success: true,
        message: `숙제가 제출되었습니다 (${imageArray.length}장)`,
        submission: {
          id: submissionId,
          userId: user.id,
          studentName: user.name,
          submittedAt: kstTimestamp,
          status: 'processing',
          imageCount: imageArray.length
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

    // 채점 API 비동기 호출 (context.waitUntil 사용)
    if (context.waitUntil) {
      context.waitUntil(
        fetch(`${new URL(context.request.url).origin}/api/homework/process-grading`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submissionId })
        })
        .then(res => {
          console.log(`✅ [V2] 채점 API 호출 완료: ${submissionId} (status: ${res.status})`);
          return res.json();
        })
        .then(data => {
          console.log(`✅ [V2] 채점 결과:`, data);
        })
        .catch(err => {
          console.error(`❌ [V2] 채점 API 호출 실패:`, err.message);
        })
      );
    } else {
      // waitUntil이 없는 경우 (로컬 개발 환경) 동기적으로 호출
      try {
        const gradingResponse = await fetch(`${new URL(context.request.url).origin}/api/homework/process-grading`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submissionId })
        });
        console.log(`✅ [V2] 채점 API 호출 완료: ${submissionId} (status: ${gradingResponse.status})`);
      } catch (err: any) {
        console.error(`❌ [V2] 채점 API 호출 실패:`, err.message);
      }
    }

    return response;

  } catch (error: any) {
    console.error("❌ [V2] 숙제 제출 오류:", error.message);
    
    return new Response(
      JSON.stringify({
        error: "Failed to submit homework",
        message: error.message || "숙제 제출 중 오류가 발생했습니다"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
