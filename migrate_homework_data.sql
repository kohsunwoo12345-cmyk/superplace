-- ============================================
-- 숙제 데이터 복구 SQL 스크립트
-- ============================================

-- 1. homework_gradings_v2에서 homework_submissions_v2로 데이터 마이그레이션
-- (이미 submissions_v2에 없는 데이터만 추가)

INSERT OR IGNORE INTO homework_submissions_v2 
(id, userId, code, submittedAt, status, academyId, gradingResult, gradedAt)
SELECT 
  submissionId as id,
  userId,
  NULL as code,
  gradedAt as submittedAt,
  'graded' as status,
  academyId,
  json_object(
    'results', json_array(
      json_object(
        'subject', subject,
        'grading', json_object(
          'totalQuestions', totalQuestions,
          'correctAnswers', correctAnswers,
          'score', score,
          'overallFeedback', overallFeedback,
          'strengths', strengths,
          'improvements', improvements,
          'detailedResults', CASE 
            WHEN detailedResults IS NOT NULL AND detailedResults != '' 
            THEN json(detailedResults) 
            ELSE json_array() 
          END,
          'weaknessTypes', json_array(),
          'studyDirection', ''
        )
      )
    )
  ) as gradingResult,
  gradedAt
FROM homework_gradings_v2
WHERE submissionId NOT IN (SELECT id FROM homework_submissions_v2);

-- 2. 마이그레이션 결과 확인
SELECT 
  '마이그레이션 완료!' as message,
  (SELECT COUNT(*) FROM homework_submissions_v2) as total_submissions,
  (SELECT COUNT(*) FROM homework_submissions_v2 WHERE status = 'graded') as graded_count,
  (SELECT COUNT(*) FROM homework_submissions_v2 WHERE gradingResult IS NOT NULL) as has_result_count;

-- 3. 샘플 데이터 확인 (최근 5건)
SELECT 
  id,
  userId,
  submittedAt,
  status,
  CASE WHEN gradingResult IS NULL THEN 'NULL' ELSE 'EXISTS' END as gradingResult_status
FROM homework_submissions_v2
ORDER BY submittedAt DESC
LIMIT 5;

