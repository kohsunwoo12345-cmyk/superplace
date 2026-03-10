-- AcademyBotSubscription 테이블에 dailyUsageLimit 컬럼 추가
ALTER TABLE AcademyBotSubscription ADD COLUMN dailyUsageLimit INTEGER DEFAULT 15;

-- 기존 데이터 업데이트
UPDATE AcademyBotSubscription 
SET dailyUsageLimit = 15 
WHERE dailyUsageLimit IS NULL;

-- 확인
SELECT id, academyId, productId, dailyUsageLimit 
FROM AcademyBotSubscription 
LIMIT 5;
