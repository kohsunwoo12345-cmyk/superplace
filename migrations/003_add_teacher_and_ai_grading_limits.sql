-- 요금제 테이블에 선생님 수 및 AI 채점/분석 제한 추가
-- 2026-02-27: 선생님 수, AI 채점 수, 역량 분석 수, 부족한 개념 분석 수 추가

-- pricing_plans 테이블에 컬럼 추가
ALTER TABLE pricing_plans ADD COLUMN max_teachers INTEGER NOT NULL DEFAULT 5;
ALTER TABLE pricing_plans ADD COLUMN max_ai_grading INTEGER NOT NULL DEFAULT 100;  -- 월별 AI 채점 횟수
ALTER TABLE pricing_plans ADD COLUMN max_capability_analysis INTEGER NOT NULL DEFAULT 50;  -- 월별 역량 분석 횟수  
ALTER TABLE pricing_plans ADD COLUMN max_concept_analysis INTEGER NOT NULL DEFAULT 50;  -- 월별 부족한 개념 분석 횟수

-- user_subscriptions 테이블에 컬럼 추가
ALTER TABLE user_subscriptions ADD COLUMN max_teachers INTEGER NOT NULL DEFAULT 5;
ALTER TABLE user_subscriptions ADD COLUMN max_ai_grading INTEGER NOT NULL DEFAULT 100;
ALTER TABLE user_subscriptions ADD COLUMN max_capability_analysis INTEGER NOT NULL DEFAULT 50;
ALTER TABLE user_subscriptions ADD COLUMN max_concept_analysis INTEGER NOT NULL DEFAULT 50;

-- 사용량 컬럼 추가
ALTER TABLE user_subscriptions ADD COLUMN current_teachers INTEGER DEFAULT 0;
ALTER TABLE user_subscriptions ADD COLUMN current_ai_grading INTEGER DEFAULT 0;
ALTER TABLE user_subscriptions ADD COLUMN current_capability_analysis INTEGER DEFAULT 0;
ALTER TABLE user_subscriptions ADD COLUMN current_concept_analysis INTEGER DEFAULT 0;

-- 기존 플랜 업데이트
UPDATE pricing_plans SET 
  max_teachers = 2, 
  max_ai_grading = 10,
  max_capability_analysis = 5,
  max_concept_analysis = 5
WHERE id = 'plan-free';

UPDATE pricing_plans SET 
  max_teachers = 5, 
  max_ai_grading = 100,
  max_capability_analysis = 50,
  max_concept_analysis = 50
WHERE id = 'plan-starter';

UPDATE pricing_plans SET 
  max_teachers = 15, 
  max_ai_grading = 500,
  max_capability_analysis = 200,
  max_concept_analysis = 200
WHERE id = 'plan-pro';

UPDATE pricing_plans SET 
  max_teachers = -1, 
  max_ai_grading = -1,
  max_capability_analysis = -1,
  max_concept_analysis = -1
WHERE id = 'plan-enterprise';

-- 완료 메시지
SELECT 'Teacher and AI grading limits added successfully' AS message;
