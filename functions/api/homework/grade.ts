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
    grading: {
      totalQuestions: number;
      correctAnswers: number;
      detailedResults: any[];
      overallFeedback: string;
      strengths: string;
      improvements: string;
    };
  }>;
  error?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const body = await context.request.json();
    const { userId, code, images, image } = body;

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

    // 3. 테이블 생성
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

    // 4. 제출 기록 생성
    const submissionId = `homework-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const kstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const kstTimestamp = kstDate.toISOString().replace('T', ' ').substring(0, 19);
    const imageUrlsJson = JSON.stringify(imageArray);

    await DB.prepare(`
      INSERT INTO homework_submissions_v2 (id, userId, code, imageUrl, submittedAt, status, academyId)
      VALUES (?, ?, ?, ?, ?, 'processing', ?)
    `).bind(submissionId, userId, code || null, imageUrlsJson, kstTimestamp, user.academyId || null).run();

    console.log(`✅ 제출 기록 생성: ${submissionId}`);

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

    // 6. 결과 저장 (gradingResult JSON에 저장)
    const gradingResultJson = JSON.stringify(workerResult.results);
    
    await DB.prepare(`
      UPDATE homework_submissions_v2 
      SET status = 'graded', gradingResult = ?, gradedAt = ?
      WHERE id = ?
    `).bind(gradingResultJson, kstTimestamp, submissionId).run();

    console.log(`✅ 채점 완료: ${submissionId}`);

    // 7. 응답 반환
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
      results: workerResult.results,
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
