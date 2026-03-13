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
    const { userId, code, images, image, imageUrl, assignmentId } = body;

    if (!DB) {
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 다중 이미지 또는 단일 이미지 처리 (imageUrl도 지원)
    const imageArray = images || (image ? [image] : (imageUrl ? [imageUrl] : []));

    if (!userId || imageArray.length === 0) {
      return new Response(
        JSON.stringify({ error: "userId and images are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`📚 숙제 제출 시작: userId=${userId}, assignmentId=${assignmentId || 'none'}, imageCount=${imageArray.length}`);
    
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
    console.log(`🔍 User 테이블 조회 시작: userId=${userId}`);
    let user = await DB.prepare(
      "SELECT id, name, email, academyId FROM User WHERE id = ?"
    ).bind(userId).first();

    console.log(`📊 User 테이블 결과:`, user);

    // User 테이블에 없으면 users 테이블 확인 (레거시 지원)
    if (!user) {
      console.log(`🔍 users 테이블 확인 중... (userId: ${userId})`);
      const legacyUser = await DB.prepare(
        "SELECT id, name, email, academy_id as academyId FROM users WHERE id = ?"
      ).bind(userId).first();
      
      console.log(`📊 users 테이블 결과:`, legacyUser);
      
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

    // 2. homework_submissions_v2 테이블 생성 및 마이그레이션
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS homework_submissions_v2 (
        id TEXT PRIMARY KEY,
        userId INTEGER NOT NULL,
        code TEXT,
        imageUrl TEXT,
        submittedAt TEXT DEFAULT (datetime('now')),
        status TEXT DEFAULT 'pending',
        academyId INTEGER,
        gradingResult TEXT,
        gradedAt TEXT
      )
    `).run();

    // 마이그레이션: 기존 테이블에 누락된 컬럼 추가
    try {
      await DB.prepare(`
        ALTER TABLE homework_submissions_v2 ADD COLUMN gradingResult TEXT
      `).run();
      console.log('✅ gradingResult 컬럼 추가 완료');
    } catch (e) {
      // 컬럼이 이미 존재하면 무시
      console.log('ℹ️ gradingResult 컬럼 이미 존재');
    }

    try {
      await DB.prepare(`
        ALTER TABLE homework_submissions_v2 ADD COLUMN gradedAt TEXT
      `).run();
      console.log('✅ gradedAt 컬럼 추가 완료');
    } catch (e) {
      console.log('ℹ️ gradedAt 컬럼 이미 존재');
    }

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

    // Assignment와 연결 (assignmentId가 있는 경우)
    if (assignmentId) {
      console.log(`🔗 숙제 과제 연결 시작: assignmentId=${assignmentId}`);
      
      try {
        // homework_assignment_targets 테이블에서 해당 학생의 과제 찾기
        const target = await DB.prepare(`
          SELECT id, status FROM homework_assignment_targets
          WHERE assignmentId = ? AND studentId = ?
        `).bind(assignmentId, userId).first();

        if (target) {
          console.log(`📝 과제 타겟 발견:`, target);
          
          // 제출 상태로 업데이트
          await DB.prepare(`
            UPDATE homework_assignment_targets
            SET status = 'submitted',
                submittedAt = ?,
                submissionId = ?
            WHERE id = ?
          `).bind(kstTimestamp, submissionId, target.id).run();
          
          console.log(`✅ 과제 제출 상태 업데이트 완료: ${target.id}`);
        } else {
          console.log(`⚠️ 과제 타겟을 찾을 수 없음 (전체 학생 대상일 수 있음)`);
          
          // 전체 학생 대상인 경우, target 생성
          const assignment = await DB.prepare(`
            SELECT id, teacherName FROM homework_assignments
            WHERE id = ? AND status = 'active'
          `).bind(assignmentId).first();
          
          if (assignment) {
            console.log(`📚 전체 학생 대상 과제 확인: ${assignment.id}`);
            
            // 새 target 생성
            const targetId = `target-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            await DB.prepare(`
              INSERT INTO homework_assignment_targets
              (id, assignmentId, studentId, studentName, status, submittedAt, submissionId, createdAt)
              VALUES (?, ?, ?, ?, 'submitted', ?, ?, ?)
            `).bind(
              targetId,
              assignmentId,
              userId,
              user.name,
              kstTimestamp,
              submissionId,
              kstTimestamp
            ).run();
            
            console.log(`✅ 새 과제 타겟 생성 및 제출 완료: ${targetId}`);
          }
        }
      } catch (targetError: any) {
        console.error(`❌ 과제 연결 실패 (계속 진행):`, targetError.message);
        // 과제 연결 실패해도 제출 자체는 성공으로 처리
      }
    }

    // 6. 백그라운드에서 자동 채점 실행 (Python Worker 사용)
    console.log(`🤖 자동 채점 시작 (Python Worker): ${submissionId}`);
    
    // /api/homework/grade를 호출하여 Python Worker로 채점
    const gradingPromise = fetch(new URL('/api/homework/grade', context.request.url).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId, 
        code, 
        images: imageArray 
      })
    }).then(async response => {
      console.log(`✅ 자동 채점 트리거 완료: ${submissionId}, status: ${response.status}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ 채점 API 오류: ${response.status}`, errorText);
      }
      return response.json();
    }).catch(error => {
      console.error(`❌ 자동 채점 트리거 실패: ${submissionId}`, error);
    });

    // Cloudflare Pages의 waitUntil을 사용하여 백그라운드 작업 등록
    if (context.waitUntil) {
      context.waitUntil(gradingPromise);
    }

    // 7. 즉시 응답 반환 (채점은 백그라운드에서 진행)
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
