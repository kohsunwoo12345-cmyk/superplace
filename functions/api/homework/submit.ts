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
  // UTC 시간에 9시간 추가 (KST = UTC+9)
  const kstOffset = 9 * 60; // 분 단위
  const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
  
  // ISO 형식으로 변환 후 'Z'를 제거하고 '+09:00' 추가
  return kstTime.toISOString().replace('Z', '+09:00');
}

// 한국 시간으로 포맷팅
function formatKoreanTime(isoString: string): string {
  const date = new Date(isoString);
  const kstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
  
  const year = kstDate.getFullYear();
  const month = String(kstDate.getMonth() + 1).padStart(2, '0');
  const day = String(kstDate.getDate()).padStart(2, '0');
  const hours = String(kstDate.getHours()).padStart(2, '0');
  const minutes = String(kstDate.getMinutes()).padStart(2, '0');
  const seconds = String(kstDate.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Gemini API를 사용한 숙제 채점
async function gradeHomeworkWithGemini(
  imageBase64: string,
  apiKey: string
): Promise<any> {
  try {
    // base64에서 data URL prefix 제거
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `당신은 학생의 숙제를 채점하는 선생님입니다.
아래 이미지를 분석하여 다음 형식으로 JSON 응답을 제공해주세요:

{
  "score": 점수 (0-100, 숫자만),
  "feedback": "전체적인 피드백 (한글, 2-3문장)",
  "strengths": ["잘한 점 1", "잘한 점 2"],
  "suggestions": ["개선할 점 1", "개선할 점 2"],
  "subject": "과목명 (예: 수학, 영어 등)",
  "completion": "완성도 (상/중/하)",
  "effort": "노력도 (상/중/하)"
}

숙제가 명확하지 않거나 이미지가 불분명한 경우:
{
  "score": null,
  "feedback": "이미지가 불명확하거나 숙제를 확인할 수 없습니다. 다시 촬영해주세요.",
  "strengths": [],
  "suggestions": ["숙제가 잘 보이도록 다시 촬영해주세요"],
  "subject": "확인 불가",
  "completion": "확인 불가",
  "effort": "확인 불가"
}

반드시 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Data,
              },
            },
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
      // JSON 코드 블록 제거 (```json ... ``` 형식)
      const cleanedText = generatedText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      grading = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      // 파싱 실패 시 기본 응답
      grading = {
        score: null,
        feedback: "AI 분석 중 오류가 발생했습니다. 다시 시도해주세요.",
        strengths: [],
        suggestions: ["이미지를 더 선명하게 촬영해주세요"],
        subject: "확인 불가",
        completion: "확인 불가",
        effort: "확인 불가",
      };
    }

    return grading;
  } catch (error: any) {
    console.error("Gemini grading error:", error);
    throw error;
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB, GEMINI_API_KEY } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "Gemini API key not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body: any = await context.request.json();
    const { userId, attendanceRecordId, imageData } = body;

    if (!userId || !imageData) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Gemini API로 숙제 채점
    console.log("Grading homework with Gemini AI...");
    const grading = await gradeHomeworkWithGemini(imageData, GEMINI_API_KEY);

    // 한국 시간으로 현재 시간 생성
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
        "data:image/jpeg;base64,...", // 실제로는 이미지를 저장소에 업로드하고 URL을 저장해야 함
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

    return new Response(
      JSON.stringify({
        success: true,
        submissionId,
        grading: {
          ...grading,
          submittedAt: formatKoreanTime(koreanTime),
          gradedAt: formatKoreanTime(koreanTime),
        },
        message: "숙제가 성공적으로 제출되고 채점되었습니다",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Homework submission error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to submit homework",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
