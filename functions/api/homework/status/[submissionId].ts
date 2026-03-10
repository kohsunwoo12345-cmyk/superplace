interface Env {
  DB: D1Database;
}

/**
 * 숙제 채점 상태 조회 API
 * GET /api/homework/status/:submissionId
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const { submissionId } = context.params;

    if (!DB) {
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!submissionId) {
      return new Response(
        JSON.stringify({ error: "submissionId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 제출 기록 조회
    const submission = await DB.prepare(`
      SELECT id, userId, code, imageUrl, submittedAt, status, academyId
      FROM homework_submissions_v2
      WHERE id = ?
    `).bind(submissionId).first();

    if (!submission) {
      return new Response(
        JSON.stringify({ error: "Submission not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 이미지 개수 조회 (homework_images 테이블에서)
    const imageCountResult = await DB.prepare(`
      SELECT COUNT(*) as count
      FROM homework_images
      WHERE submissionId = ?
    `).bind(submissionId).first();

    const imageCount = imageCountResult?.count || 0;

    // 채점 결과 조회
    const grading = await DB.prepare(`
      SELECT id, submissionId, score, feedback, strengths, suggestions, 
             subject, completion, effort, pageCount, gradedAt, gradedBy,
             totalQuestions, correctAnswers, problemAnalysis, weaknessTypes,
             detailedAnalysis, studyDirection
      FROM homework_gradings_v2
      WHERE submissionId = ?
    `).bind(submissionId).first();

    // 상태별 응답
    if (submission.status === 'processing') {
      return new Response(
        JSON.stringify({
          success: true,
          status: 'processing',
          message: '채점이 진행 중입니다',
          submission: {
            id: submission.id,
            userId: submission.userId,
            submittedAt: submission.submittedAt,
            imageCount: imageCount,
            status: submission.status
          },
          estimatedTimeRemaining: '약 10-30초'
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (submission.status === 'failed') {
      return new Response(
        JSON.stringify({
          success: false,
          status: 'failed',
          message: '채점에 실패했습니다',
          submission: {
            id: submission.id,
            userId: submission.userId,
            submittedAt: submission.submittedAt,
            imageCount: imageCount,
            status: submission.status
          }
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (submission.status === 'graded' && grading) {
      // 채점 완료 - JSON 파싱을 안전하게 처리
      let weaknessTypesArray: any[] = [];
      let problemAnalysisArray: any[] = [];
      
      try {
        if (grading.weaknessTypes) {
          const wt = grading.weaknessTypes as string;
          if (wt.startsWith('[') || wt.startsWith('{')) {
            weaknessTypesArray = JSON.parse(wt);
          }
        }
      } catch (e: any) {
        console.error('weaknessTypes JSON parse error:', e.message);
        weaknessTypesArray = [];
      }
      
      try {
        if (grading.problemAnalysis) {
          const pa = grading.problemAnalysis as string;
          if (pa.startsWith('[') || pa.startsWith('{')) {
            problemAnalysisArray = JSON.parse(pa);
          }
        }
      } catch (e: any) {
        console.error('problemAnalysis JSON parse error:', e.message);
        problemAnalysisArray = [];
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          status: 'graded',
          message: '채점이 완료되었습니다',
          submission: {
            id: submission.id,
            userId: submission.userId,
            submittedAt: submission.submittedAt,
            imageCount: imageCount,
            status: submission.status
          },
          grading: {
            id: grading.id,
            score: grading.score,
            subject: grading.subject,
            totalQuestions: grading.totalQuestions,
            correctAnswers: grading.correctAnswers,
            feedback: grading.feedback,
            strengths: grading.strengths,
            suggestions: grading.suggestions,
            completion: grading.completion,
            weaknessTypes: weaknessTypesArray,
            problemAnalysis: problemAnalysisArray,
            detailedAnalysis: grading.detailedAnalysis,
            studyDirection: grading.studyDirection,
            gradedAt: grading.gradedAt,
            gradedBy: grading.gradedBy
          }
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 기타 상태 (pending 등)
    return new Response(
      JSON.stringify({
        success: true,
        status: submission.status || 'pending',
        message: '처리 중입니다',
        submission: {
          id: submission.id,
          userId: submission.userId,
          submittedAt: submission.submittedAt,
          imageCount: imageCount,
          status: submission.status || 'pending'
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ 상태 조회 오류:", error);
    console.error("Error stack:", error.stack);
    
    return new Response(
      JSON.stringify({
        error: "Failed to check status",
        message: error.message || "상태 조회 중 오류가 발생했습니다",
        details: error.stack || ''
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
