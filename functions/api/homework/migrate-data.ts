/**
 * 데이터 마이그레이션 API
 * homework_gradings_v2 → homework_submissions_v2
 */

interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    
    if (!DB) {
      return Response.json({ error: "Database not configured" }, { status: 500 });
    }

    console.log('🔄 데이터 마이그레이션 시작...');

    // 1. homework_gradings_v2에서 데이터 조회
    const gradings = await DB.prepare(`
      SELECT 
        submissionId,
        userId,
        userName,
        userEmail,
        academyId,
        totalQuestions,
        correctAnswers,
        score,
        subject,
        detailedResults,
        overallFeedback,
        strengths,
        improvements,
        gradedAt
      FROM homework_gradings_v2
      WHERE submissionId NOT IN (SELECT id FROM homework_submissions_v2)
      ORDER BY gradedAt DESC
    `).all();

    const gradingData = gradings.results || [];
    console.log(`📊 마이그레이션 대상: ${gradingData.length}건`);

    if (gradingData.length === 0) {
      return Response.json({
        success: true,
        message: '마이그레이션할 데이터가 없습니다',
        migrated: 0
      });
    }

    let migratedCount = 0;
    let errors: string[] = [];

    // 2. 각 grading 데이터를 submissions_v2로 변환
    for (const grading of gradingData) {
      try {
        // gradingResult JSON 생성
        const gradingResult = {
          results: [{
            subject: grading.subject || 'other',
            grading: {
              totalQuestions: grading.totalQuestions || 0,
              correctAnswers: grading.correctAnswers || 0,
              score: grading.score || 0,
              overallFeedback: grading.overallFeedback || '',
              strengths: grading.strengths || '',
              improvements: grading.improvements || '',
              detailedResults: grading.detailedResults 
                ? (typeof grading.detailedResults === 'string' 
                    ? JSON.parse(grading.detailedResults) 
                    : grading.detailedResults)
                : [],
              weaknessTypes: [],
              studyDirection: ''
            }
          }]
        };

        // submissions_v2에 INSERT
        await DB.prepare(`
          INSERT OR IGNORE INTO homework_submissions_v2 
          (id, userId, code, submittedAt, status, academyId, gradingResult, gradedAt)
          VALUES (?, ?, NULL, ?, 'graded', ?, ?, ?)
        `).bind(
          grading.submissionId,
          grading.userId,
          grading.gradedAt,
          grading.academyId,
          JSON.stringify(gradingResult),
          grading.gradedAt
        ).run();

        migratedCount++;
        
        if (migratedCount % 10 === 0) {
          console.log(`✅ ${migratedCount}건 마이그레이션 완료...`);
        }
      } catch (err: any) {
        console.error(`❌ 마이그레이션 실패 (${grading.submissionId}):`, err.message);
        errors.push(`${grading.submissionId}: ${err.message}`);
      }
    }

    console.log(`🎉 마이그레이션 완료: ${migratedCount}건`);

    // 3. 결과 확인
    const result = await DB.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status='graded' THEN 1 END) as graded,
        COUNT(CASE WHEN gradingResult IS NOT NULL THEN 1 END) as hasResult
      FROM homework_submissions_v2
    `).first();

    return Response.json({
      success: true,
      message: `데이터 마이그레이션 완료`,
      migrated: migratedCount,
      errors: errors.length > 0 ? errors : undefined,
      statistics: {
        total: result?.total || 0,
        graded: result?.graded || 0,
        hasResult: result?.hasResult || 0
      }
    });

  } catch (error: any) {
    console.error('❌ 마이그레이션 오류:', error);
    return Response.json({
      success: false,
      error: '마이그레이션 실패',
      message: error.message
    }, { status: 500 });
  }
};
