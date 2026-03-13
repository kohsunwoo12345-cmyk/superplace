-- 테스트학생1771491306의 최근 숙제 제출 확인
SELECT 
  id, userId, submittedAt, status, gradedAt,
  substr(gradingResult, 1, 200) as gradingPreview
FROM homework_submissions_v2 
WHERE userId IN (
  SELECT id FROM User WHERE name LIKE '%테스트학생1771491306%'
)
ORDER BY submittedAt DESC LIMIT 1;
