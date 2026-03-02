// 학원 상세 정보 조회를 위한 쿼리 목록

// 1. Academy 테이블에서 학원 정보
SELECT * FROM Academy WHERE id = ?

// 2. User 테이블에서 학생 목록
SELECT id, name, email, phone, createdAt 
FROM User 
WHERE academyId = ? AND role = 'STUDENT'
ORDER BY createdAt DESC

// 3. User 테이블에서 교사 목록
SELECT id, name, email, phone, createdAt
FROM User  
WHERE academyId = ? AND role = 'TEACHER'
ORDER BY createdAt DESC

// 4. subscription_requests 테이블에서 결제 내역
SELECT id, planName, finalPrice as amount, status, createdAt, processedAt as approvedAt
FROM subscription_requests
WHERE userId = ? 
ORDER BY createdAt DESC
LIMIT 50

// 5. user_subscriptions 테이블에서 활성 구독
SELECT * FROM user_subscriptions 
WHERE userId = ? AND status = 'active'
ORDER BY createdAt DESC
LIMIT 1

// 6. bot_assignments 테이블에서 할당된 봇
SELECT ba.id, ab.name, ab.description, ba.assignedAt, ba.isActive as status
FROM bot_assignments ba
LEFT JOIN ai_bots ab ON ba.botId = ab.id
WHERE ba.academyId = ? AND ba.isActive = 1

// 7. Class 테이블에서 반 수
SELECT COUNT(*) as count FROM Class WHERE academyId = ?

// 8. 로그인 IP 추적 (login_logs 테이블이 있다면)
SELECT ipAddress, lastLogin, loginCount
FROM login_logs
WHERE userId = ?
ORDER BY lastLogin DESC
LIMIT 10
