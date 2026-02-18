-- D1 데이터베이스 사용자 확인 쿼리

-- 1. User 테이블 구조 확인
PRAGMA table_info(User);

-- 2. 전체 사용자 목록 조회
SELECT id, email, name, role, academyId, approved, createdAt FROM User LIMIT 20;

-- 3. 역할별 사용자 수
SELECT role, COUNT(*) as count FROM User GROUP BY role;

-- 4. 승인 대기 중인 사용자
SELECT email, name, role, approved FROM User WHERE approved = 0;

-- 5. 학원 정보 확인
SELECT id, name, code, createdAt FROM Academy LIMIT 10;
