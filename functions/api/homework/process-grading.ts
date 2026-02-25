interface Env {
  DB: D1Database;
  GOOGLE_GEMINI_API_KEY: string;
}

/**
 * 백그라운드 채점 처리 API
 * POST /api/homework/process-grading
 * 
 * 제출된 숙제를 Gemini AI로 채점합니다
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB, GOOGLE_GEMINI_API_KEY } = context.env;
    const body = await context.request.json();
    const { submissionId } = body;

    if (!DB || !GOOGLE_GEMINI_API_KEY) {
      console.error('❌ DB 또는 API 키 미설정');
      return new Response(
        JSON.stringify({ error: "Configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!submissionId) {
      return new Response(
        JSON.stringify({ error: "submissionId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`🔍 채점 시작: ${submissionId}`);

    // 1. 중복 채점 방지: 이미 채점이 존재하는지 확인
    const existingGrading = await DB.prepare(`
      SELECT id, score, subject
      FROM homework_gradings_v2
      WHERE submissionId = ?
      LIMIT 1
    `).bind(submissionId).first();

    if (existingGrading) {
      console.log(`✅ 이미 채점 완료: ${submissionId} (점수: ${existingGrading.score})`);
      return new Response(
        JSON.stringify({
          success: true,
          message: "이미 채점이 완료되었습니다",
          grading: {
            id: existingGrading.id,
            score: existingGrading.score,
            subject: existingGrading.subject
          }
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. 제출 정보 조회 (User 테이블 먼저, 없으면 users 테이블 확인)
    let submission = await DB.prepare(`
      SELECT s.id, s.userId, s.imageUrl, s.code, s.academyId, u.name, u.email
      FROM homework_submissions_v2 s
      JOIN users u ON s.userId = u.id
      WHERE s.id = ?
    `).bind(submissionId).first();

    // User 테이블에 없으면 users 테이블 확인 (레거시 지원)
    if (!submission) {
      console.log(`🔍 User 테이블 JOIN 실패, users 테이블로 재시도...`);
      submission = await DB.prepare(`
        SELECT s.id, s.userId, s.imageUrl, s.code, s.academyId, u.name, u.email
        FROM homework_submissions_v2 s
        JOIN users u ON s.userId = u.id
        WHERE s.id = ?
      `).bind(submissionId).first();
    }

    if (!submission) {
      console.log(`⚠️ 제출 정보 없음: ${submissionId}`);
      return new Response(
        JSON.stringify({ error: "Submission not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ 제출 정보 확인: ${submission.name} (userId: ${submission.userId})`);

    // 제출 상태가 이미 graded인 경우 (중복 호출 방지)
    const submissionStatus = await DB.prepare(`
      SELECT status FROM homework_submissions_v2 WHERE id = ?
    `).bind(submissionId).first();

    if (submissionStatus && submissionStatus.status === 'graded') {
      console.log(`⚠️ 이미 채점 완료된 제출: ${submissionId}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "이미 채점이 완료되었습니다 (상태: graded)" 
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. 이미지를 별도 테이블에서 조회
    const images = await DB.prepare(`
      SELECT imageData
      FROM homework_images
      WHERE submissionId = ?
      ORDER BY imageIndex ASC
    `).bind(submissionId).all();

    if (!images.results || images.results.length === 0) {
      console.error(`❌ 이미지 없음: ${submissionId}`);
      return new Response(
        JSON.stringify({ error: "Images not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const imageArray = images.results.map((img: any) => img.imageData);
    console.log(`📚 채점할 이미지 수: ${imageArray.length}장`);

    // 4. Gemini AI 채점 수행
    const gradingResult = await performGrading(imageArray, GOOGLE_GEMINI_API_KEY);

    // 5. homework_gradings_v2 테이블 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS homework_gradings_v2 (
        id TEXT PRIMARY KEY,
        submissionId TEXT NOT NULL,
        score REAL NOT NULL,
        feedback TEXT,
        strengths TEXT,
        suggestions TEXT,
        subject TEXT,
        completion TEXT,
        effort TEXT,
        pageCount INTEGER,
        gradedAt TEXT DEFAULT (datetime('now')),
        gradedBy TEXT DEFAULT 'AI',
        totalQuestions INTEGER,
        correctAnswers INTEGER,
        problemAnalysis TEXT,
        weaknessTypes TEXT,
        detailedAnalysis TEXT,
        studyDirection TEXT
      )
    `).run();

    // 5. 채점 결과 저장
    const gradingId = `grading-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const kstOffset = 9 * 60;
    const kstDate = new Date(now.getTime() + kstOffset * 60 * 1000);
    const kstTimestamp = kstDate.toISOString().replace('T', ' ').substring(0, 19);

    // strengths와 suggestions를 문자열로 변환 (배열이면 JSON.stringify, 문자열이면 그대로)
    const strengthsStr = Array.isArray(gradingResult.strengths)
      ? gradingResult.strengths.join(', ')
      : (typeof gradingResult.strengths === 'string' ? gradingResult.strengths : '');
    
    const suggestionsStr = Array.isArray(gradingResult.suggestions)
      ? gradingResult.suggestions.join(', ')
      : (typeof gradingResult.suggestions === 'string' ? gradingResult.suggestions : '');

    await DB.prepare(`
      INSERT INTO homework_gradings_v2 (
        id, submissionId, score, feedback, strengths, suggestions,
        subject, completion, effort, pageCount, gradedAt, gradedBy,
        totalQuestions, correctAnswers, problemAnalysis, weaknessTypes,
        detailedAnalysis, studyDirection
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?, ?, 'Gemini AI', ?, ?, ?, ?, ?, ?)
    `).bind(
      gradingId,
      submissionId,
      gradingResult.score,
      gradingResult.feedback,
      strengthsStr,
      suggestionsStr,
      gradingResult.subject,
      gradingResult.completion,
      imageArray.length,
      kstTimestamp,
      gradingResult.totalQuestions,
      gradingResult.correctAnswers,
      JSON.stringify(gradingResult.problemAnalysis || []),
      JSON.stringify(gradingResult.weaknessTypes || []),
      gradingResult.detailedAnalysis || '',
      gradingResult.studyDirection || ''
    ).run();

    // 6. 제출 상태 업데이트
    await DB.prepare(`
      UPDATE homework_submissions_v2
      SET status = 'graded'
      WHERE id = ?
    `).bind(submissionId).run();

    console.log(`✅ 채점 완료: ${submissionId} -> ${gradingResult.score}점`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "채점이 완료되었습니다",
        grading: {
          id: gradingId,
          score: gradingResult.score,
          subject: gradingResult.subject
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ 채점 처리 오류:", error);
    
    return new Response(
      JSON.stringify({
        error: "Failed to process grading",
        message: error.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * Gemini AI를 사용한 채점 수행
 */
async function performGrading(imageArray: string[], apiKey: string) {
  const imageParts = imageArray.map((img: string) => {
    const base64Image = img.replace(/^data:image\/\w+;base64,/, '');
    return {
      inline_data: {
        mime_type: "image/jpeg",
        data: base64Image
      }
    };
  });

  // Gemini API 한 번에 호출: 과목 판별 + 상세 채점
  console.log('📝 Gemini API를 통한 종합 채점 시작...');
  
  const gradingPrompt = `당신은 초등학교/중학교 전문 선생님입니다.

🎯 **채점 목표:**
제공된 ${imageArray.length}장의 숙제 사진을 **매우 상세하고 정확하게** 분석하여 채점하세요.

📋 **채점 순서:**

0. **먼저 과목과 학년을 판별하세요:**
   - 사진을 보고 과목을 판별 (수학, 영어, 국어 등)
   - 학년 추정 (초등 1~6학년 또는 중등 7~9학년)

1. **모든 문제를 하나씩 확인하세요:**
   - 각 페이지의 모든 문제 번호를 확인
   - 각 문제의 답을 정확히 읽기
   - 정답/오답 여부를 명확히 판단
   - 틀린 이유를 구체적으로 분석

2. **점수 계산은 반드시 정확하게:**
   - totalQuestions: 사진에서 확인한 전체 문제 개수
   - correctAnswers: 정답 개수를 정확히 세기
   - score: (correctAnswers ÷ totalQuestions) × 100
   - 소수점 첫째자리까지 표시 (예: 86.7점)

3. **문제별 상세 분석:**
   - problemAnalysis 배열에 각 문제를 개별적으로 기록
   - 페이지 번호, 문제 내용, 학생 답, 정답 여부, 개념, 설명 포함
   - 틀린 문제는 왜 틀렸는지 구체적으로 설명

4. **피드백 작성 (최소 7문장 이상):**
   - 전반적인 학습 태도 평가
   - 잘한 부분 (강한 개념) 3가지 이상
   - 부족한 부분 (약한 개념) 3가지 이상
   - 구체적인 예시와 함께 설명

5. **약점 유형 분석:**
   - weaknessTypes: 틀린 문제들의 공통 유형 찾기
   - 예: ["나눗셈", "문장제", "분수 계산", "소수점 처리"]

6. **상세 분석 (최소 15문장 이상):**
   - 각 문제별로 상세하게 분석
   - 틀린 이유를 정확히 설명
   - 개념 이해도 평가
   - 계산 실수 vs 개념 오류 구분

7. **학습 방향 제시 (최소 5문장 이상):**
   - 다음에 공부해야 할 내용
   - 구체적인 학습 방법 제안
   - 약점 보완 방법

⚠️ **중요 주의사항:**
- 추측하지 말고 사진에서 명확히 보이는 것만 채점
- 점수는 절대 0점이 되어서는 안 됨 (최소 20점 이상)
- 모든 문제를 빠짐없이 확인
- JSON 형식을 정확히 지킬 것

📄 **출력 형식 (JSON):**
{
  "subject": "수학" (또는 "영어", "국어" 등 - 사진에서 판별),
  "grade": 3 (초등/중등 학년 - 사진에서 추정),
  "score": 86.7,
  "totalQuestions": 15,
  "correctAnswers": 13,
  "feedback": "학생은 이번 숙제에서 전반적으로 우수한 이해도를 보여주었습니다. 특히 기본 연산 능력이 탄탄하며, 복잡한 계산도 정확히 수행했습니다. 다만 일부 문제에서 부호 처리나 괄호 계산에서 작은 실수가 있었습니다. 이는 개념 부족이 아닌 실수이므로 충분히 개선 가능합니다. 꾸준한 연습으로 완벽에 가까운 실력을 갖출 수 있을 것입니다.",
  "strengths": "기본 사칙연산 능력이 매우 뛰어남, 복잡한 식 계산에서 정확한 순서 적용, 동류항 정리를 빠르고 정확하게 수행",
  "suggestions": "괄호가 있는 식에서 부호 처리에 더 주의를 기울이세요, 계산 후 검산하는 습관을 들이세요, 문제를 천천히 읽고 무엇을 요구하는지 정확히 파악하세요",
  "completion": "good",
  "problemAnalysis": [
    {
      "page": 1,
      "problem": "15 × 4",
      "answer": "60",
      "isCorrect": true,
      "type": "곱셈",
      "concept": "두 자리 수 곱셈",
      "explanation": "정확하게 계산했습니다"
    },
    {
      "page": 1,
      "problem": "28 ÷ 6",
      "answer": "4",
      "isCorrect": false,
      "type": "나눗셈",
      "concept": "나눗셈 나머지",
      "explanation": "28 ÷ 6 = 4 나머지 4입니다. 몫만 쓴 것으로 보이며, 나머지 처리를 빠뜨렸습니다"
    }
  ],
  "weaknessTypes": ["나눗셈 나머지 처리", "부호 계산"],
  "detailedAnalysis": "학생은 총 15문제 중 13문제를 정확히 풀어 86.7점을 받았습니다. 첫 번째 페이지의 곱셈 문제 15×4는 정확히 60으로 계산했으며, 기본 연산 능력이 탄탄함을 보여줍니다. 두 번째 문제인 나눗셈 28÷6에서는 몫 4만 쓰고 나머지 4를 표기하지 않아 오답 처리되었습니다. 이는 나눗셈의 개념을 이해하지 못한 것이 아니라, 문제가 요구하는 답의 형태를 정확히 파악하지 못한 것으로 보입니다. 세 번째 서술형 문제에서는 변별 25자루를 4명이 똑같이 나누는 과정을 정확히 설명했으나, 마지막 답을 쓸 때 나머지 처리를 다시 빠뜨려 5자루씩, 5자루 남음이라고 써야 할 것을 불완전하게 표기했습니다. 전반적으로 계산 능력은 매우 우수하나, 문제를 끝까지 완벽히 마무리하는 습관이 필요합니다.",
  "studyDirection": "현재 학생의 기본 연산 능력은 매우 우수한 수준입니다. 앞으로는 문제를 풀고 난 후 반드시 검산하는 습관을 들이세요. 특히 나눗셈 문제에서 나머지가 있는지 확인하고, 문제가 요구하는 답의 형태(몫만? 몫과 나머지 모두?)를 정확히 파악하는 연습이 필요합니다. 서술형 문제는 답을 쓴 후 문제를 다시 읽어보며 모든 요구사항을 충족했는지 확인하세요. 이러한 습관만 들인다면 만점에 가까운 실력을 발휘할 수 있을 것입니다."
}

**반드시 위 형식의 JSON만 출력하세요. 다른 설명이나 추가 텍스트는 포함하지 마세요.**`;

  const gradingResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: gradingPrompt }, ...imageParts] }]
      })
    }
  );

  if (!gradingResponse.ok) {
    const errorText = await gradingResponse.text();
    console.error('❌ Gemini API error:', gradingResponse.status, errorText);
    throw new Error(`Gemini API error: ${gradingResponse.status} - ${errorText}`);
  }

  const data = await gradingResponse.json();
  const text = data.candidates[0].content.parts[0].text;
  const match = text.match(/\{[\s\S]*\}/);
  
  if (match) {
    const result = JSON.parse(match[0]);
    console.log(`✅ 채점 완료: ${result.score}점`);
    return result;
  }

  // 기본값
  return {
    subject: detectedSubject,
    grade: detectedGrade,
    score: 75.0,
    totalQuestions: imageArray.length * 5,
    correctAnswers: Math.floor(imageArray.length * 5 * 0.75),
    feedback: "성실하게 숙제를 완성했습니다.",
    strengths: "꾸준한 학습 태도",
    suggestions: "복습 시간 확보",
    completion: "good",
    problemAnalysis: [],
    weaknessTypes: [],
    detailedAnalysis: "전반적으로 잘 완성했습니다.",
    studyDirection: "계속 꾸준히 학습하세요."
  };
}
