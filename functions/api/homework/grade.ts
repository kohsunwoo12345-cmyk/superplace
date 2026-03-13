/**
 * 숙제 채점 API - Python Worker 연동
 * 간소화 버전: homework_submissions_v2.gradingResult JSON만 사용
 */

interface Env {
  DB: D1Database;
}

interface PythonWorkerResponse {
  success: boolean;
  results: Array<{
    imageIndex: number;
    ocrText: string;
    subject: 'math' | 'english' | 'other';
    grading?: {
      totalQuestions?: number;
      correctAnswers?: number;
      detailedResults?: any[];
      overallFeedback?: string;
      strengths?: string;
      improvements?: string;
    };
  }>;
  error?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const body = await context.request.json();
    const { userId, code, images, image, submissionId: existingSubmissionId } = body;

    if (!DB) {
      return Response.json({ error: "Database not configured" }, { status: 500 });
    }

    const imageArray = images || (image ? [image] : []);

    if (!userId || imageArray.length === 0) {
      return Response.json({ error: "userId and images are required" }, { status: 400 });
    }

    console.log(`📚 숙제 채점 시작: ${imageArray.length}장 이미지, userId: ${userId}`);

    // 1. 사용자 정보 조회
    let user = await DB.prepare("SELECT id, name, email, academyId FROM User WHERE id = ?")
      .bind(userId).first();

    if (!user) {
      const legacyUser = await DB.prepare(
        "SELECT id, name, email, academy_id as academyId FROM users WHERE id = ?"
      ).bind(userId).first();
      if (legacyUser) user = legacyUser;
    }

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    console.log(`✅ 사용자 확인: ${user.name}`);

    // 2. 설정 불러오기
    const config = await DB.prepare(
      `SELECT * FROM homework_grading_config ORDER BY id DESC LIMIT 1`
    ).first();

    const systemPrompt = config?.systemPrompt || `당신은 전문 교사입니다. 숙제를 채점하고 JSON 형식으로 결과를 반환하세요.`;
    const model = config?.model || 'gemini-2.5-flash';
    const temperature = config?.temperature ? Number(config.temperature) : 0.3;
    const enableRAG = config?.enableRAG ? Boolean(Number(config.enableRAG)) : false;

    // 3. 테이블 생성 (기존 homework_gradings_v2 무시)
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS homework_submissions_v2 (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        code TEXT,
        imageUrl TEXT,
        submittedAt TEXT DEFAULT (datetime('now')),
        status TEXT DEFAULT 'submitted',
        academyId INTEGER,
        gradingResult TEXT,
        gradedAt TEXT
      )
    `).run();
    
    // gradingResult, gradedAt 컬럼 추가 (없을 경우)
    try {
      await DB.prepare(`ALTER TABLE homework_submissions_v2 ADD COLUMN gradingResult TEXT`).run();
    } catch (e) {
      // 이미 존재
    }
    
    try {
      await DB.prepare(`ALTER TABLE homework_submissions_v2 ADD COLUMN gradedAt TEXT`).run();
    } catch (e) {
      // 이미 존재
    }

    // 4. 제출 기록 조회 또는 생성
    const now = new Date();
    const kstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const kstTimestamp = kstDate.toISOString().replace('T', ' ').substring(0, 19);
    
    let submissionId: string;
    
    if (existingSubmissionId) {
      // 이미 생성된 제출 기록 사용 (중복 방지)
      submissionId = existingSubmissionId;
      console.log(`✅ 기존 제출 기록 사용: ${submissionId}`);
      
      // 상태를 'processing'으로 업데이트
      await DB.prepare(`
        UPDATE homework_submissions_v2 
        SET status = 'processing'
        WHERE id = ?
      `).bind(submissionId).run();
    } else {
      // 새 제출 기록 생성 (하위 호환성)
      submissionId = `homework-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const imageUrlsJson = JSON.stringify(imageArray);
      
      await DB.prepare(`
        INSERT INTO homework_submissions_v2 (id, userId, code, imageUrl, submittedAt, status, academyId)
        VALUES (?, ?, ?, ?, ?, 'processing', ?)
      `).bind(submissionId, userId, code || null, imageUrlsJson, kstTimestamp, user.academyId || null).run();
      
      console.log(`✅ 새 제출 기록 생성: ${submissionId}`);
    }

    // 5. Python Worker 호출
    const workerUrl = 'https://physonsuperplacestudy.kohsunwoo12345.workers.dev/grade';
    const workerRequest = {
      images: imageArray,
      userId: Number(userId),
      userName: user.name,
      academyId: user.academyId ? Number(user.academyId) : undefined,
      systemPrompt,
      model,
      temperature,
      enableRAG,
    };

    console.log(`📤 Python Worker 호출: ${workerUrl}`);

    const workerResponse = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u',
      },
      body: JSON.stringify(workerRequest),
    });

    if (!workerResponse.ok) {
      const errorText = await workerResponse.text();
      console.error(`❌ Worker 오류: ${workerResponse.status} - ${errorText}`);
      
      await DB.prepare(`UPDATE homework_submissions_v2 SET status = 'failed', gradedAt = ? WHERE id = ?`)
        .bind(kstTimestamp, submissionId).run();

      return Response.json({
        error: "Python Worker error",
        message: `채점 오류: ${errorText}`,
        submissionId,
      }, { status: 500 });
    }

    const workerResult: PythonWorkerResponse = await workerResponse.json();
    console.log(`✅ Worker 응답 수신: ${workerResult.results?.length || 0}개 결과`);

    if (!workerResult.success) {
      await DB.prepare(`UPDATE homework_submissions_v2 SET status = 'failed', gradedAt = ? WHERE id = ?`)
        .bind(kstTimestamp, submissionId).run();

      return Response.json({
        error: "Grading failed",
        message: workerResult.error || "채점 실패",
        submissionId,
      }, { status: 500 });
    }

    // 6. 이미지는 submit API에서 이미 저장했으므로 여기서는 스킵
    console.log(`ℹ️ 이미지는 이미 저장됨 (${imageArray.length}장), 중복 저장 방지`);

    // 7. 결과 저장 (gradingResult JSON에 저장)
    // Python Worker 응답에 피드백이 없으면 기본 피드백 생성
    const enrichedResults = workerResult.results.map((result: any) => {
      const grading = result.grading || {};
      
      // 피드백이 모두 없으면 기본 피드백 생성
      if (!grading.overallFeedback && !grading.strengths && !grading.improvements) {
        const totalQuestions = grading.totalQuestions || 0;
        const correctAnswers = grading.correctAnswers || 0;
        const percentage = totalQuestions > 0 
          ? Math.round((correctAnswers / totalQuestions) * 100) 
          : 0;
        
        if (totalQuestions > 0) {
          // 점수대별 기본 피드백
          if (percentage >= 90) {
            grading.overallFeedback = "훌륭한 성적입니다! 모든 문제를 정확하게 풀었습니다.";
            grading.strengths = "문제 이해력과 풀이 능력이 우수합니다.";
            grading.improvements = "현재 수준을 유지하면서 더 어려운 문제에 도전해보세요.";
          } else if (percentage >= 70) {
            grading.overallFeedback = "잘 풀었습니다. 조금 더 신중하게 풀면 더 좋은 결과를 얻을 수 있습니다.";
            grading.strengths = "대부분의 문제를 정확하게 이해하고 풀었습니다.";
            grading.improvements = "틀린 문제를 다시 확인하고 복습하세요.";
          } else if (percentage >= 50) {
            grading.overallFeedback = "기본은 이해하고 있습니다. 조금 더 연습이 필요합니다.";
            grading.strengths = "문제 풀이에 대한 의지가 있습니다.";
            grading.improvements = "기본 개념을 다시 복습하고 유사 문제를 더 풀어보세요.";
          } else {
            grading.overallFeedback = "기본 개념부터 다시 학습이 필요합니다.";
            grading.strengths = "숙제를 성실하게 제출했습니다.";
            grading.improvements = "선생님과 함께 기본 개념을 차근차근 다시 학습하세요.";
          }
        } else {
          // 문제 수가 0인 경우 (텍스트 없음 등)
          grading.overallFeedback = "이미지에서 문제를 인식하지 못했습니다. 더 선명한 사진을 제출해주세요.";
          grading.strengths = "숙제를 성실하게 제출했습니다.";
          grading.improvements = "사진을 더 밝고 선명하게 찍어서 다시 제출해주세요.";
        }
        
        console.log(`🔄 기본 피드백 생성: ${percentage}점`);
      }
      
      return {
        ...result,
        grading
      };
    });
    
    const gradingResultJson = JSON.stringify(enrichedResults);
    
    await DB.prepare(`
      UPDATE homework_submissions_v2 
      SET status = 'graded', gradingResult = ?, gradedAt = ?
      WHERE id = ?
    `).bind(gradingResultJson, kstTimestamp, submissionId).run();

    console.log(`✅ 채점 완료: ${submissionId}`);

    // 8. 응답 반환
    return Response.json({
      success: true,
      message: "숙제 채점이 완료되었습니다",
      submission: {
        id: submissionId,
        userId,
        studentName: user.name,
        submittedAt: kstTimestamp,
        gradedAt: kstTimestamp,
        status: 'graded',
        imageCount: imageArray.length,
      },
      results: enrichedResults,  // 기본 피드백이 추가된 결과 반환
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ 채점 오류:", error.message);
    
    return Response.json({
      error: "Failed to grade homework",
      message: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
};
