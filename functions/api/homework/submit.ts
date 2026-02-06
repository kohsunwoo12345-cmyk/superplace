interface Env {
  DB: D1Database;
  GEMINI_API_KEY: string;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

// 한국 시간 (KST) 생성 함수
function getKoreanTime(): string {
  const now = new Date();
  const kstOffset = 9 * 60; // 분 단위
  const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
  
  const year = kstTime.getFullYear();
  const month = String(kstTime.getMonth() + 1).padStart(2, '0');
  const day = String(kstTime.getDate()).padStart(2, '0');
  const hours = String(kstTime.getHours()).padStart(2, '0');
  const minutes = String(kstTime.getMinutes()).padStart(2, '0');
  const seconds = String(kstTime.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Gemini API를 사용한 다중 이미지 숙제 채점
async function gradeMultipleImagesWithGemini(
  images: string[],
  apiKey: string
): Promise<any> {
  try {
    // 이미지 parts 생성
    const imageParts = images.map(imageBase64 => {
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      return {
        inline_data: {
          mime_type: "image/jpeg",
          data: base64Data,
        },
      };
    });

    const prompt = `당신은 학생의 숙제를 채점하는 전문 선생님입니다.
총 ${images.length}장의 숙제 이미지를 분석하여 다음 형식으로 JSON 응답을 제공해주세요:

{
  "score": 점수 (0-100, 숫자만, 모든 페이지 종합 평가),
  "feedback": "전체적인 피드백 (한글, 4-5문장, 모든 페이지를 고려한 종합 평가)",
  "strengths": ["잘한 점 1", "잘한 점 2", "잘한 점 3"],
  "weaknesses": ["부족한 점 1", "부족한 점 2", "부족한 점 3"],
  "suggestions": ["개선 방법 1", "개선 방법 2"],
  "conceptsNeeded": ["필요한 개념 1", "필요한 개념 2", "필요한 개념 3"],
  "studyDirection": "앞으로 학습 방향 (한글, 2-3문장)",
  "mistakes": ["발견된 실수 1", "발견된 실수 2"],
  "subject": "과목명 (예: 수학, 영어, 국어 등)",
  "completion": "완성도 (상/중/하)",
  "effort": "노력도 (상/중/하)",
  "pageCount": ${images.length},
  "detailedAnalysis": "상세 분석 (한글, 5-6문장, 각 문제별 분석 포함)"
}

중요 지침:
1. 잘한 점과 부족한 점을 명확히 구분하세요
2. 부족한 점에 대해서는 반드시 어떤 개념을 더 공부해야 하는지 알려주세요
3. 실수가 있다면 구체적으로 지적하고 올바른 방법을 제시하세요
4. 학습 방향은 구체적이고 실천 가능한 내용으로 제시하세요
5. 여러 페이지를 제출한 경우 모든 페이지를 종합적으로 평가해주세요

반드시 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
            ...imageParts,
          ],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 2048,
      },
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", errorText);
      throw new Error(`Gemini API Error: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    const generatedText = data.candidates[0]?.content?.parts[0]?.text;

    if (!generatedText) {
      throw new Error("No response from Gemini");
    }

    // JSON 파싱
    let grading;
    try {
      const cleanedText = generatedText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      grading = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      grading = {
        score: null,
        feedback: "AI 분석 중 오류가 발생했습니다. 다시 시도해주세요.",
        strengths: [],
        suggestions: ["이미지를 더 선명하게 촬영해주세요"],
        subject: "확인 불가",
        completion: "확인 불가",
        effort: "확인 불가",
        pageCount: images.length,
      };
    }

    return grading;
  } catch (error: any) {
    console.error("Gemini grading error:", error);
    throw error;
  }
}

// 알림 전송 함수
async function sendNotificationToTeachersAndDirector(
  DB: D1Database,
  userId: number,
  userName: string,
  academyId: number,
  score: number
): Promise<void> {
  try {
    // 해당 학원의 선생님과 학원장 조회
    const teachers = await DB.prepare(`
      SELECT id, name, email FROM users
      WHERE academyId = ? AND (UPPER(role) = 'TEACHER' OR UPPER(role) = 'DIRECTOR')
    `).bind(academyId).all();

    if (!teachers.results || teachers.results.length === 0) {
      console.log("No teachers/directors found for notification");
      return;
    }

    const koreanTime = getKoreanTime();
    const notificationId = `notification-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // 알림 생성
    const title = "숙제 제출 완료";
    const message = `${userName} 학생이 숙제를 제출했습니다. (점수: ${score}점)`;
    
    await DB.prepare(`
      INSERT INTO notifications (id, title, message, type, filterType, recipientCount, createdAt, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      notificationId,
      title,
      message,
      "info",
      "custom",
      teachers.results.length,
      koreanTime,
      "sent"
    ).run();

    // 각 선생님/학원장에게 알림 전송
    for (const teacher of teachers.results as any[]) {
      const recipientId = `notif-recipient-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      await DB.prepare(`
        INSERT INTO notification_recipients (id, notificationId, userId, userName, userEmail, academyId, sentAt, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        recipientId,
        notificationId,
        teacher.id,
        teacher.name,
        teacher.email,
        academyId,
        koreanTime,
        "sent"
      ).run();
    }

    console.log(`Notifications sent to ${teachers.results.length} teachers/directors`);
  } catch (error) {
    console.error("Failed to send notifications:", error);
    // 알림 전송 실패해도 숙제 제출은 성공으로 처리
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB, GEMINI_API_KEY } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "Gemini API key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const body: any = await context.request.json();
    const { userId, attendanceRecordId, images } = body;

    // images 배열 검증 (하위 호환성을 위해 imageData도 지원)
    let imageArray = images;
    if (!imageArray && body.imageData) {
      // 단일 이미지를 배열로 변환
      imageArray = [body.imageData];
    }

    if (!userId || !imageArray || !Array.isArray(imageArray) || imageArray.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields or empty images" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 사용자 정보 조회 (학원 ID와 이름 가져오기)
    const user = await DB.prepare(`
      SELECT id, name, email, academyId FROM users WHERE id = ?
    `).bind(userId).first();

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Gemini API로 다중 이미지 숙제 채점
    console.log(`Grading ${imageArray.length} homework images with Gemini AI...`);
    const grading = await gradeMultipleImagesWithGemini(imageArray, GEMINI_API_KEY);

    const koreanTime = getKoreanTime();
    const submissionId = `homework-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 숙제 제출 기록 저장
    await DB.prepare(
      `INSERT INTO homework_submissions 
       (id, userId, attendanceRecordId, imageUrl, score, feedback, subject, completion, effort, submittedAt, gradedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        submissionId,
        userId,
        attendanceRecordId || null,
        `${imageArray.length} images submitted`,
        grading.score,
        grading.feedback,
        grading.subject || "기타",
        grading.completion || "중",
        grading.effort || "중",
        koreanTime,
        koreanTime
      )
      .run();

    // 출석 기록 업데이트 (숙제 제출 완료)
    if (attendanceRecordId) {
      await DB.prepare(
        `UPDATE attendance_records 
         SET homeworkSubmitted = 1, homeworkSubmittedAt = ?
         WHERE id = ?`
      )
        .bind(koreanTime, attendanceRecordId)
        .run();
    }

    // 선생님과 학원장에게 알림 전송
    if (user.academyId && grading.score !== null) {
      await sendNotificationToTeachersAndDirector(
        DB,
        userId,
        user.name as string,
        user.academyId as number,
        grading.score
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        submissionId,
        grading: {
          ...grading,
          submittedAt: koreanTime,
          gradedAt: koreanTime,
          totalImages: imageArray.length,
        },
        message: `숙제 ${imageArray.length}장이 성공적으로 제출되고 채점되었습니다`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Homework submission error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to submit homework",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
