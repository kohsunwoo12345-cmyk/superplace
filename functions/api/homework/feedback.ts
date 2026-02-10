interface Env {
  DB: D1Database;
}

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const { DB } = env;

  if (!DB) {
    return new Response(JSON.stringify({ success: false, error: "Database not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(request.url);
    const submissionId = url.searchParams.get("submissionId");
    const userId = url.searchParams.get("userId");

    if (!submissionId || !userId) {
      return new Response(
        JSON.stringify({ success: false, error: "submissionId and userId are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 숙제 제출 기록 조회
    const submission = await DB.prepare(`
      SELECT 
        id,
        userId,
        score,
        feedback,
        subject,
        completion,
        effort,
        submittedAt,
        gradedAt
      FROM homework_submissions
      WHERE id = ? AND userId = ?
    `).bind(submissionId, userId).first();

    if (!submission) {
      return new Response(
        JSON.stringify({ success: false, error: "Submission not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 피드백 데이터 구성
    const feedbackData = {
      submissionId: submission.id,
      score: submission.score,
      feedback: submission.feedback,
      subject: submission.subject,
      completion: submission.completion,
      effort: submission.effort,
      submittedAt: submission.submittedAt,
      gradedAt: submission.gradedAt,
      // AI가 제공한 추가 정보 (저장되어 있다면)
      strengths: extractStrengths(submission.feedback as string),
      suggestions: extractSuggestions(submission.feedback as string),
      totalImages: extractImageCount(submission.feedback as string),
    };

    return new Response(
      JSON.stringify({
        success: true,
        feedback: feedbackData,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Feedback fetch error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to fetch feedback",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// 피드백에서 잘한 점 추출 (간단한 파싱)
function extractStrengths(feedback: string): string[] {
  // 실제로는 DB에 별도로 저장하는 것이 좋지만, 임시로 피드백에서 추출
  const strengths: string[] = [];
  
  if (feedback.includes("잘했") || feedback.includes("좋습") || feedback.includes("훌륭")) {
    strengths.push("전체적으로 잘 작성했습니다");
  }
  if (feedback.includes("깔끔") || feedback.includes("정리")) {
    strengths.push("깔끔하게 정리했습니다");
  }
  if (feedback.includes("노력") || feedback.includes("열심히")) {
    strengths.push("열심히 노력한 흔적이 보입니다");
  }
  
  return strengths.length > 0 ? strengths : ["성실하게 제출했습니다"];
}

// 피드백에서 개선점 추출
function extractSuggestions(feedback: string): string[] {
  const suggestions: string[] = [];
  
  if (feedback.includes("개선") || feedback.includes("보완")) {
    suggestions.push("조금 더 세심하게 작성해보세요");
  }
  if (feedback.includes("틀렸") || feedback.includes("오답")) {
    suggestions.push("틀린 문제를 다시 풀어보세요");
  }
  if (feedback.includes("부족") || feedback.includes("미흡")) {
    suggestions.push("복습을 통해 이해도를 높여보세요");
  }
  
  return suggestions;
}

// 이미지 수 추출
function extractImageCount(feedback: string): number {
  const match = feedback.match(/(\d+)\s*장/);
  return match ? parseInt(match[1]) : 1;
}
