-- 학생 퇴원 처리 기능을 위한 스키마 수정

-- User 테이블에 퇴원 관련 필드 추가
-- isWithdrawn: 퇴원 여부 (0: 재학중, 1: 퇴원)
-- withdrawnAt: 퇴원 처리 일시
-- withdrawnReason: 퇴원 사유
-- withdrawnBy: 퇴원 처리한 관리자 ID

-- SQLite에서는 ALTER TABLE ADD COLUMN을 사용
-- 기존 User 테이블에 컬럼 추가

-- 1. 퇴원 여부 필드 (기본값: 0 = 재학중)
ALTER TABLE User ADD COLUMN isWithdrawn INTEGER DEFAULT 0;

-- 2. 퇴원 일시
ALTER TABLE User ADD COLUMN withdrawnAt TEXT;

-- 3. 퇴원 사유
ALTER TABLE User ADD COLUMN withdrawnReason TEXT;

-- 4. 퇴원 처리자 ID
ALTER TABLE User ADD COLUMN withdrawnBy INTEGER;

-- 인덱스 추가 (퇴원 여부로 필터링하기 위해)
CREATE INDEX IF NOT EXISTS idx_user_withdrawn ON User(isWithdrawn);

-- 퇴원 이력 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_user_withdrawn_at ON User(withdrawnAt);

-- 통계 조회 최적화를 위한 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_user_academy_withdrawn ON User(academyId, isWithdrawn, createdAt);

-- 샘플 퇴원 데이터 (테스트용, 실제 운영에서는 삭제)
-- UPDATE User SET 
--   isWithdrawn = 1, 
--   withdrawnAt = datetime('now'), 
--   withdrawnReason = '졸업',
--   withdrawnBy = 1
-- WHERE id = 999;

-- 퇴원 통계 쿼리 예시:
-- 1. 재학생 수
-- SELECT COUNT(*) FROM User WHERE role = 'STUDENT' AND isWithdrawn = 0;

-- 2. 퇴원생 수
-- SELECT COUNT(*) FROM User WHERE role = 'STUDENT' AND isWithdrawn = 1;

-- 3. 이번 달 신규 등록 학생
-- SELECT COUNT(*) FROM User 
-- WHERE role = 'STUDENT' 
-- AND isWithdrawn = 0
-- AND createdAt >= date('now', 'start of month');

-- 4. 이번 달 퇴원 학생
-- SELECT COUNT(*) FROM User 
-- WHERE role = 'STUDENT' 
-- AND isWithdrawn = 1
-- AND withdrawnAt >= date('now', 'start of month');

-- 5. 퇴원 사유별 통계
-- SELECT withdrawnReason, COUNT(*) as count
-- FROM User
-- WHERE role = 'STUDENT' AND isWithdrawn = 1
-- GROUP BY withdrawnReason
-- ORDER BY count DESC;
