/**
 * 숙제 채점 API - Python Worker 연동
 * 
 * 프로세스:
 * 1. 학생이 사진 업로드 (Pages)
 * 2. Python Worker로 전송
 * 3. Worker가 DeepSeek OCR 실행
 * 4. RAG 검색 (Vectorize)
 * 5. 과목별 라우팅 (수학: SymPy 계산, 영어: 문법 검증)
 * 6. 최종 LLM으로 결과 생성
 * 7. 결과를 Pages DB에 저장
 */

interface Env {
  DB: D1Database;
  VECTORIZE: VectorizeIndex;
}

interface PythonWorkerRequest {
  images: string[];  // Base64 encoded images
  userId: number;
  userName: string;
  academyId?: number;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  enableRAG?: boolean;
}

interface PythonWorkerResponse {
  success: boolean;
  results: Array<{
    imageIndex: number;
    ocrText: string;
    subject: 'math' | 'english' | 'other';
    calculation?: any;  // 수학 계산 결과
    ragContext?: string[];  // RAG 검색 결과
    grading: {
      totalQuestions: number;
      correctAnswers: number;
      detailedResults: Array<{
        questionNumber: number;
        isCorrect: boolean;
        studentAnswer: string;
        correctAnswer: string;
        explanation: string;
      }>;
      overallFeedback: string;
      strengths: string;
      improvements: string;
    };
  }>;
  error?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB, VECTORIZE } = context.env;
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

    console.log(`📚 숙제 채점 시작: ${imageArray.length}장 이미지`);

    // 1. 사용자 정보 조회
    let user = await DB.prepare(
      "SELECT id, name, email, academyId FROM User WHERE id = ?"
    ).bind(userId).first();

    if (!user) {
      const legacyUser = await DB.prepare(
        "SELECT id, name, email, academy_id as academyId FROM users WHERE id = ?"
      ).bind(userId).first();
      if (legacyUser) {
        user = legacyUser;
      }
    }

    if (!user) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ 사용자 확인: ${user.name} (${user.email})`);

    // 2. 숙제 검사 AI 설정 불러오기
    const config = await DB.prepare(
      `SELECT * FROM homework_grading_config ORDER BY id DESC LIMIT 1`
    ).first();

    const systemPrompt = config?.systemPrompt || `당신은 전문 교사입니다. 제공된 숙제 이미지를 분석하여 다음을 수행하세요:

1. 이미지에서 모든 문제를 식별하세요
2. 각 문제에 대한 학생의 답안을 확인하세요
3. 정답 여부를 판단하세요 (문제에 정답이 표시되어 있거나, 일반적인 학습 지식으로 판단)
4. 각 문제에 대한 피드백을 제공하세요

응답은 반드시 다음 JSON 형식으로 제공하세요:
{
  "totalQuestions": 문제 총 개수,
  "correctAnswers": 맞은 문제 수,
  "detailedResults": [
    {
      "questionNumber": 1,
      "isCorrect": true/false,
      "studentAnswer": "학생이 작성한 답",
      "correctAnswer": "정답",
      "explanation": "채점 근거 및 설명"
    }
  ],
  "overallFeedback": "전체적인 피드백",
  "strengths": "잘한 점",
  "improvements": "개선할 점"
}`;

    const model = config?.model || 'gemini-2.5-flash';
    const temperature = config?.temperature ? Number(config.temperature) : 0.3;
    const enableRAG = config?.enableRAG ? Boolean(Number(config.enableRAG)) : false;

    console.log(`🔧 설정: model=${model}, temperature=${temperature}, RAG=${enableRAG}`);

    // 3. homework_submissions_v2 테이블 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS homework_submissions_v2 (
        id TEXT PRIMARY KEY,
        userId INTEGER NOT NULL,
        code TEXT,
        imageUrl TEXT,
        submittedAt TEXT DEFAULT (datetime('now')),
        status TEXT DEFAULT 'submitted',
        academyId INTEGER,
        gradingResult TEXT,
        gradedAt TEXT
      )
    `).run();

    // 4. 숙제 제출 기록 생성
    const submissionId = `homework-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const kstOffset = 9 * 60;
    const kstDate = new Date(now.getTime() + kstOffset * 60 * 1000);
    const kstTimestamp = kstDate.toISOString().replace('T', ' ').substring(0, 19);
    const imageUrlsJson = JSON.stringify(imageArray);

    await DB.prepare(`
      INSERT INTO homework_submissions_v2 (id, userId, code, imageUrl, submittedAt, status, academyId)
      VALUES (?, ?, ?, ?, ?, 'processing', ?)
    `).bind(submissionId, userId, code || null, imageUrlsJson, kstTimestamp, user.academyId || null).run();

    console.log(`✅ 숙제 제출 기록 생성: ${submissionId}`);

    // 5. Python Worker로 요청 전송
    const workerUrl = 'https://physonsuperplacestudy.kohsunwoo12345.workers.dev/grade';
    
    const workerRequest: PythonWorkerRequest = {
      images: imageArray,
      userId: Number(userId),
      userName: user.name as string,
      academyId: user.academyId ? Number(user.academyId) : undefined,
      systemPrompt,
      model,
      temperature,
      enableRAG,
    };

    console.log(`📤 Python Worker로 전송: ${workerUrl}`);
    console.log(`   - 이미지 수: ${imageArray.length}`);
    console.log(`   - 모델: ${model}`);
    console.log(`   - RAG 활성화: ${enableRAG}`);

    const workerResponse = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'xL-fXyCJpmj-gupSAYr12YDIZ6Xy1lXUOUmihLMb',
      },
      body: JSON.stringify(workerRequest),
    });

    if (!workerResponse.ok) {
      const errorText = await workerResponse.text();
      console.error(`❌ Worker 응답 오류: ${workerResponse.status} - ${errorText}`);
      
      // 상태를 failed로 업데이트
      await DB.prepare(`
        UPDATE homework_submissions_v2 
        SET status = 'failed', gradedAt = ?
        WHERE id = ?
      `).bind(kstTimestamp, submissionId).run();

      return new Response(
        JSON.stringify({
          error: "Python Worker error",
          message: `채점 중 오류가 발생했습니다: ${errorText}`,
          submissionId,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const workerResult: PythonWorkerResponse = await workerResponse.json();
    console.log(`✅ Worker 응답 수신:`, JSON.stringify(workerResult, null, 2));
    console.log(`📊 채점 결과 개수: ${workerResult.results?.length || 0}`);

    if (!workerResult.success) {
      // 상태를 failed로 업데이트
      await DB.prepare(`
        UPDATE homework_submissions_v2 
        SET status = 'failed', gradedAt = ?
        WHERE id = ?
      `).bind(kstTimestamp, submissionId).run();

      return new Response(
        JSON.stringify({
          error: "Grading failed",
          message: workerResult.error || "채점에 실패했습니다",
          submissionId,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 6. homework_gradings_v2 테이블 생성 및 마이그레이션
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS homework_gradings_v2 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        submissionId TEXT NOT NULL,
        userId INTEGER NOT NULL,
        userName TEXT,
        userEmail TEXT,
        academyId INTEGER,
        totalQuestions INTEGER,
        correctAnswers INTEGER,
        score INTEGER,
        subject TEXT,
        detailedResults TEXT,
        overallFeedback TEXT,
        strengths TEXT,
        improvements TEXT,
        weaknessTypes TEXT,
        conceptsNeeded TEXT,
        commonMistakes TEXT,
        studyDirection TEXT,
        problemAnalysis TEXT,
        completionLevel TEXT,
        effortLevel TEXT,
        gradedAt TEXT,
        createdAt TEXT DEFAULT (datetime('now'))
      )
    `).run();

    // 마이그레이션: 기존 테이블에 누락된 컬럼 추가
    try {
      // overallFeedback 컬럼이 없으면 추가
      await DB.prepare(`
        ALTER TABLE homework_gradings_v2 ADD COLUMN overallFeedback TEXT
      `).run();
      console.log('✅ overallFeedback 컬럼 추가 완료');
    } catch (e) {
      // 컬럼이 이미 존재하면 무시
      console.log('ℹ️ overallFeedback 컬럼 이미 존재');
    }

    try {
      // strengths 컬럼이 없으면 추가
      await DB.prepare(`
        ALTER TABLE homework_gradings_v2 ADD COLUMN strengths TEXT
      `).run();
      console.log('✅ strengths 컬럼 추가 완료');
    } catch (e) {
      console.log('ℹ️ strengths 컬럼 이미 존재');
    }

    try {
      // improvements 컬럼이 없으면 추가
      await DB.prepare(`
        ALTER TABLE homework_gradings_v2 ADD COLUMN improvements TEXT
      `).run();
      console.log('✅ improvements 컬럼 추가 완료');
    } catch (e) {
      console.log('ℹ️ improvements 컬럼 이미 존재');
    }

    try {
      // detailedResults 컬럼이 없으면 추가
      await DB.prepare(`
        ALTER TABLE homework_gradings_v2 ADD COLUMN detailedResults TEXT
      `).run();
      console.log('✅ detailedResults 컬럼 추가 완료');
    } catch (e) {
      console.log('ℹ️ detailedResults 컬럼 이미 존재');
    }

    try {
      // studyDirection 컬럼이 없으면 추가
      await DB.prepare(`
        ALTER TABLE homework_gradings_v2 ADD COLUMN studyDirection TEXT
      `).run();
      console.log('✅ studyDirection 컬럼 추가 완료');
    } catch (e) {
      console.log('ℹ️ studyDirection 컬럼 이미 존재');
    }

    // 7. 채점 결과를 homework_gradings_v2에 저장
    for (const result of workerResult.results) {
      const grading = result.grading;
      
      console.log(`📝 채점 결과 저장 중:`, {
        subject: result.subject,
        totalQuestions: grading.totalQuestions,
        correctAnswers: grading.correctAnswers,
        detailedResultsCount: grading.detailedResults?.length || 0
      });
      
      const score = Math.round((grading.correctAnswers / grading.totalQuestions) * 100) || 0;
      console.log(`🎯 계산된 점수: ${grading.correctAnswers}/${grading.totalQuestions} = ${score}점`);

      await DB.prepare(`
        INSERT INTO homework_gradings_v2 (
          submissionId, userId, userName, userEmail, academyId,
          totalQuestions, correctAnswers, score, subject,
          detailedResults, overallFeedback, strengths, improvements,
          problemAnalysis, gradedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        submissionId,
        userId,
        user.name,
        user.email,
        user.academyId || null,
        grading.totalQuestions,
        grading.correctAnswers,
        score,
        result.subject || 'other',
        JSON.stringify(grading.detailedResults || []),
        grading.overallFeedback || '',
        grading.strengths || '',
        grading.improvements || '',
        JSON.stringify(grading.detailedResults || []),
        kstTimestamp
      ).run();

      console.log(`✅ homework_gradings_v2에 저장 완료: ${submissionId}`);
    }

    // 8. homework_submissions_v2도 업데이트 (호환성 유지)
    const gradingResultJson = JSON.stringify(workerResult.results);
    
    await DB.prepare(`
      UPDATE homework_submissions_v2 
      SET status = 'graded', 
          gradingResult = ?,
          gradedAt = ?
      WHERE id = ?
    `).bind(gradingResultJson, kstTimestamp, submissionId).run();

    console.log(`✅ 채점 완료: ${submissionId}`);

    // 9. 결과 반환
    return new Response(
      JSON.stringify({
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
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ 숙제 채점 오류:", error.message);
    
    return new Response(
      JSON.stringify({
        error: "Failed to grade homework",
        message: error.message || "숙제 채점 중 오류가 발생했습니다",
        stack: error.stack,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
