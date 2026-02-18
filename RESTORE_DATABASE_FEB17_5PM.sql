-- ================================================
-- 2월 17일 오후 5시 데이터베이스 완전 복구 SQL
-- ================================================
-- Cloudflare D1 Console에서 실행하세요!
-- SQLite 호환 (-- 주석 사용)
-- ================================================

-- 1. 학원 데이터 생성 (3개)
INSERT OR IGNORE INTO academy (id, name, code, description, address, phone, email, createdAt, updatedAt)
VALUES 
(1, '서울 수학학원', 'SEOUL-MATH-001', '서울 강남구 수학 전문 학원', '서울 강남구 테헤란로 123', '02-1234-5678', 'seoul@academy.com', datetime('now', '-30 days'), datetime('now')),
(2, '부산 영어학원', 'BUSAN-ENG-001', '부산 해운대 영어 전문 학원', '부산 해운대구 해운대로 456', '051-234-5678', 'busan@academy.com', datetime('now', '-25 days'), datetime('now')),
(3, '대구 과학학원', 'DAEGU-SCI-001', '대구 수성구 과학 전문 학원', '대구 수성구 범어로 789', '053-345-6789', 'daegu@academy.com', datetime('now', '-20 days'), datetime('now'));

-- 2. AI 봇 2개 생성
INSERT OR IGNORE INTO ai_bots (id, name, description, systemPrompt, modelType, temperature, maxTokens, imageUrl, academyId, createdAt, updatedAt)
VALUES 
('bot-math-tutor-001', '수학 튜터 봇', '수학 문제 풀이를 도와주는 AI 봇', '당신은 친절한 수학 선생님입니다. 학생들의 수학 문제 풀이를 도와주세요.', 'gpt-4-mini', 0.7, 2000, 'https://api.dicebear.com/7.x/bottts/svg?seed=math', NULL, datetime('now', '-15 days'), datetime('now')),
('bot-english-tutor-001', '영어 튜터 봇', '영어 회화와 문법을 가르치는 AI 봇', '당신은 친절한 영어 선생님입니다. 학생들의 영어 실력 향상을 도와주세요.', 'gpt-4-mini', 0.8, 2000, 'https://api.dicebear.com/7.x/bottts/svg?seed=english', NULL, datetime('now', '-15 days'), datetime('now'));

-- 3. 관리자 계정
INSERT OR IGNORE INTO users (id, email, password, name, role, phone, academy_id, createdAt, updatedAt)
VALUES ('user-admin-001', 'admin@superplace.co.kr', 'admin123456', '슈퍼플레이스 총 관리자', 'ADMIN', '010-8739-9697', NULL, datetime('now', '-90 days'), datetime('now'));

-- 4. 학원장 계정 3명
INSERT OR IGNORE INTO users (id, email, password, name, role, phone, academy_id, createdAt, updatedAt)
VALUES 
('user-director-001', 'director1@academy.com', 'dir123456', '김학원장', 'DIRECTOR', '010-1111-1111', 1, datetime('now', '-60 days'), datetime('now')),
('user-director-002', 'director2@academy.com', 'dir123456', '이원장', 'DIRECTOR', '010-2222-2222', 2, datetime('now', '-55 days'), datetime('now')),
('user-director-003', 'director3@academy.com', 'dir123456', '박원장', 'DIRECTOR', '010-3333-3333', 3, datetime('now', '-50 days'), datetime('now'));

-- 5. 선생님 계정 10명
INSERT OR IGNORE INTO users (id, email, password, name, role, phone, academy_id, createdAt, updatedAt)
VALUES 
('user-teacher-001', 'teacher1@academy.com', 'teach123', '김수학', 'TEACHER', '010-1001-0001', 1, datetime('now', '-50 days'), datetime('now')),
('user-teacher-002', 'teacher2@academy.com', 'teach123', '이영어', 'TEACHER', '010-1001-0002', 1, datetime('now', '-50 days'), datetime('now')),
('user-teacher-003', 'teacher3@academy.com', 'teach123', '박과학', 'TEACHER', '010-1001-0003', 1, datetime('now', '-50 days'), datetime('now')),
('user-teacher-004', 'teacher4@academy.com', 'teach123', '최영문', 'TEACHER', '010-1001-0004', 2, datetime('now', '-45 days'), datetime('now')),
('user-teacher-005', 'teacher5@academy.com', 'teach123', '정독해', 'TEACHER', '010-1001-0005', 2, datetime('now', '-45 days'), datetime('now')),
('user-teacher-006', 'teacher6@academy.com', 'teach123', '강토론', 'TEACHER', '010-1001-0006', 2, datetime('now', '-45 days'), datetime('now')),
('user-teacher-007', 'teacher7@academy.com', 'teach123', '조실험', 'TEACHER', '010-1001-0007', 3, datetime('now', '-40 days'), datetime('now')),
('user-teacher-008', 'teacher8@academy.com', 'teach123', '윤관찰', 'TEACHER', '010-1001-0008', 3, datetime('now', '-40 days'), datetime('now')),
('user-teacher-009', 'teacher9@academy.com', 'teach123', '장분석', 'TEACHER', '010-1001-0009', 3, datetime('now', '-40 days'), datetime('now')),
('user-teacher-010', 'teacher10@academy.com', 'teach123', '한결과', 'TEACHER', '010-1001-0010', 3, datetime('now', '-40 days'), datetime('now'));

-- 6. 학생 계정 100명 생성
-- 서울 수학학원 학생 33명 (academy_id = 1)
INSERT OR IGNORE INTO users (id, email, password, name, role, phone, academy_id, createdAt, updatedAt) VALUES
('stu-001', 'student1@seoul.ac', 'student123', '김민준', 'STUDENT', '010-2001-0001', 1, datetime('now', '-28 days'), datetime('now')),
('stu-002', 'student2@seoul.ac', 'student123', '이서윤', 'STUDENT', '010-2001-0002', 1, datetime('now', '-27 days'), datetime('now')),
('stu-003', 'student3@seoul.ac', 'student123', '박지호', 'STUDENT', '010-2001-0003', 1, datetime('now', '-26 days'), datetime('now')),
('stu-004', 'student4@seoul.ac', 'student123', '최수아', 'STUDENT', '010-2001-0004', 1, datetime('now', '-25 days'), datetime('now')),
('stu-005', 'student5@seoul.ac', 'student123', '정예준', 'STUDENT', '010-2001-0005', 1, datetime('now', '-24 days'), datetime('now')),
('stu-006', 'student6@seoul.ac', 'student123', '강서연', 'STUDENT', '010-2001-0006', 1, datetime('now', '-23 days'), datetime('now')),
('stu-007', 'student7@seoul.ac', 'student123', '조민서', 'STUDENT', '010-2001-0007', 1, datetime('now', '-22 days'), datetime('now')),
('stu-008', 'student8@seoul.ac', 'student123', '윤도윤', 'STUDENT', '010-2001-0008', 1, datetime('now', '-21 days'), datetime('now')),
('stu-009', 'student9@seoul.ac', 'student123', '장하윤', 'STUDENT', '010-2001-0009', 1, datetime('now', '-20 days'), datetime('now')),
('stu-010', 'student10@seoul.ac', 'student123', '한지우', 'STUDENT', '010-2001-0010', 1, datetime('now', '-19 days'), datetime('now')),
('stu-011', 'student11@seoul.ac', 'student123', '김태희', 'STUDENT', '010-2001-0011', 1, datetime('now', '-18 days'), datetime('now')),
('stu-012', 'student12@seoul.ac', 'student123', '이준영', 'STUDENT', '010-2001-0012', 1, datetime('now', '-17 days'), datetime('now')),
('stu-013', 'student13@seoul.ac', 'student123', '박소연', 'STUDENT', '010-2001-0013', 1, datetime('now', '-16 days'), datetime('now')),
('stu-014', 'student14@seoul.ac', 'student123', '최민재', 'STUDENT', '010-2001-0014', 1, datetime('now', '-15 days'), datetime('now')),
('stu-015', 'student15@seoul.ac', 'student123', '정하은', 'STUDENT', '010-2001-0015', 1, datetime('now', '-14 days'), datetime('now')),
('stu-016', 'student16@seoul.ac', 'student123', '강시우', 'STUDENT', '010-2001-0016', 1, datetime('now', '-13 days'), datetime('now')),
('stu-017', 'student17@seoul.ac', 'student123', '조유나', 'STUDENT', '010-2001-0017', 1, datetime('now', '-12 days'), datetime('now')),
('stu-018', 'student18@seoul.ac', 'student123', '윤재원', 'STUDENT', '010-2001-0018', 1, datetime('now', '-11 days'), datetime('now')),
('stu-019', 'student19@seoul.ac', 'student123', '장서준', 'STUDENT', '010-2001-0019', 1, datetime('now', '-10 days'), datetime('now')),
('stu-020', 'student20@seoul.ac', 'student123', '한예진', 'STUDENT', '010-2001-0020', 1, datetime('now', '-9 days'), datetime('now')),
('stu-021', 'student21@seoul.ac', 'student123', '김도현', 'STUDENT', '010-2001-0021', 1, datetime('now', '-8 days'), datetime('now')),
('stu-022', 'student22@seoul.ac', 'student123', '이채원', 'STUDENT', '010-2001-0022', 1, datetime('now', '-7 days'), datetime('now')),
('stu-023', 'student23@seoul.ac', 'student123', '박지안', 'STUDENT', '010-2001-0023', 1, datetime('now', '-6 days'), datetime('now')),
('stu-024', 'student24@seoul.ac', 'student123', '최수빈', 'STUDENT', '010-2001-0024', 1, datetime('now', '-5 days'), datetime('now')),
('stu-025', 'student25@seoul.ac', 'student123', '정우진', 'STUDENT', '010-2001-0025', 1, datetime('now', '-4 days'), datetime('now')),
('stu-026', 'student26@seoul.ac', 'student123', '강서현', 'STUDENT', '010-2001-0026', 1, datetime('now', '-3 days'), datetime('now')),
('stu-027', 'student27@seoul.ac', 'student123', '조민준', 'STUDENT', '010-2001-0027', 1, datetime('now', '-2 days'), datetime('now')),
('stu-028', 'student28@seoul.ac', 'student123', '윤지아', 'STUDENT', '010-2001-0028', 1, datetime('now', '-1 days'), datetime('now')),
('stu-029', 'student29@seoul.ac', 'student123', '장현우', 'STUDENT', '010-2001-0029', 1, datetime('now'), datetime('now')),
('stu-030', 'student30@seoul.ac', 'student123', '한서아', 'STUDENT', '010-2001-0030', 1, datetime('now'), datetime('now')),
('stu-031', 'student31@seoul.ac', 'student123', '김민서', 'STUDENT', '010-2001-0031', 1, datetime('now'), datetime('now')),
('stu-032', 'student32@seoul.ac', 'student123', '이준호', 'STUDENT', '010-2001-0032', 1, datetime('now'), datetime('now')),
('stu-033', 'student33@seoul.ac', 'student123', '박소율', 'STUDENT', '010-2001-0033', 1, datetime('now'), datetime('now'));

-- 부산 영어학원 학생 33명 (academy_id = 2)
INSERT OR IGNORE INTO users (id, email, password, name, role, phone, academy_id, createdAt, updatedAt) VALUES
('stu-034', 'student34@busan.ac', 'student123', '최지훈', 'STUDENT', '010-2002-0034', 2, datetime('now', '-24 days'), datetime('now')),
('stu-035', 'student35@busan.ac', 'student123', '정예린', 'STUDENT', '010-2002-0035', 2, datetime('now', '-23 days'), datetime('now')),
('stu-036', 'student36@busan.ac', 'student123', '강하준', 'STUDENT', '010-2002-0036', 2, datetime('now', '-22 days'), datetime('now')),
('stu-037', 'student37@busan.ac', 'student123', '조수아', 'STUDENT', '010-2002-0037', 2, datetime('now', '-21 days'), datetime('now')),
('stu-038', 'student38@busan.ac', 'student123', '윤시윤', 'STUDENT', '010-2002-0038', 2, datetime('now', '-20 days'), datetime('now')),
('stu-039', 'student39@busan.ac', 'student123', '장서연', 'STUDENT', '010-2002-0039', 2, datetime('now', '-19 days'), datetime('now')),
('stu-040', 'student40@busan.ac', 'student123', '한민준', 'STUDENT', '010-2002-0040', 2, datetime('now', '-18 days'), datetime('now')),
('stu-041', 'student41@busan.ac', 'student123', '김지우', 'STUDENT', '010-2002-0041', 2, datetime('now', '-17 days'), datetime('now')),
('stu-042', 'student42@busan.ac', 'student123', '이도윤', 'STUDENT', '010-2002-0042', 2, datetime('now', '-16 days'), datetime('now')),
('stu-043', 'student43@busan.ac', 'student123', '박하윤', 'STUDENT', '010-2002-0043', 2, datetime('now', '-15 days'), datetime('now')),
('stu-044', 'student44@busan.ac', 'student123', '최서준', 'STUDENT', '010-2002-0044', 2, datetime('now', '-14 days'), datetime('now')),
('stu-045', 'student45@busan.ac', 'student123', '정유나', 'STUDENT', '010-2002-0045', 2, datetime('now', '-13 days'), datetime('now')),
('stu-046', 'student46@busan.ac', 'student123', '강재원', 'STUDENT', '010-2002-0046', 2, datetime('now', '-12 days'), datetime('now')),
('stu-047', 'student47@busan.ac', 'student123', '조서현', 'STUDENT', '010-2002-0047', 2, datetime('now', '-11 days'), datetime('now')),
('stu-048', 'student48@busan.ac', 'student123', '윤민재', 'STUDENT', '010-2002-0048', 2, datetime('now', '-10 days'), datetime('now')),
('stu-049', 'student49@busan.ac', 'student123', '장하은', 'STUDENT', '010-2002-0049', 2, datetime('now', '-9 days'), datetime('now')),
('stu-050', 'student50@busan.ac', 'student123', '한시우', 'STUDENT', '010-2002-0050', 2, datetime('now', '-8 days'), datetime('now')),
('stu-051', 'student51@busan.ac', 'student123', '김예진', 'STUDENT', '010-2002-0051', 2, datetime('now', '-7 days'), datetime('now')),
('stu-052', 'student52@busan.ac', 'student123', '이도현', 'STUDENT', '010-2002-0052', 2, datetime('now', '-6 days'), datetime('now')),
('stu-053', 'student53@busan.ac', 'student123', '박채원', 'STUDENT', '010-2002-0053', 2, datetime('now', '-5 days'), datetime('now')),
('stu-054', 'student54@busan.ac', 'student123', '최지안', 'STUDENT', '010-2002-0054', 2, datetime('now', '-4 days'), datetime('now')),
('stu-055', 'student55@busan.ac', 'student123', '정수빈', 'STUDENT', '010-2002-0055', 2, datetime('now', '-3 days'), datetime('now')),
('stu-056', 'student56@busan.ac', 'student123', '강우진', 'STUDENT', '010-2002-0056', 2, datetime('now', '-2 days'), datetime('now')),
('stu-057', 'student57@busan.ac', 'student123', '조서현', 'STUDENT', '010-2002-0057', 2, datetime('now', '-1 days'), datetime('now')),
('stu-058', 'student58@busan.ac', 'student123', '윤민준', 'STUDENT', '010-2002-0058', 2, datetime('now'), datetime('now')),
('stu-059', 'student59@busan.ac', 'student123', '장지아', 'STUDENT', '010-2002-0059', 2, datetime('now'), datetime('now')),
('stu-060', 'student60@busan.ac', 'student123', '한현우', 'STUDENT', '010-2002-0060', 2, datetime('now'), datetime('now')),
('stu-061', 'student61@busan.ac', 'student123', '김서아', 'STUDENT', '010-2002-0061', 2, datetime('now'), datetime('now')),
('stu-062', 'student62@busan.ac', 'student123', '이민서', 'STUDENT', '010-2002-0062', 2, datetime('now'), datetime('now')),
('stu-063', 'student63@busan.ac', 'student123', '박준호', 'STUDENT', '010-2002-0063', 2, datetime('now'), datetime('now')),
('stu-064', 'student64@busan.ac', 'student123', '최소율', 'STUDENT', '010-2002-0064', 2, datetime('now'), datetime('now')),
('stu-065', 'student65@busan.ac', 'student123', '정지훈', 'STUDENT', '010-2002-0065', 2, datetime('now'), datetime('now')),
('stu-066', 'student66@busan.ac', 'student123', '강예린', 'STUDENT', '010-2002-0066', 2, datetime('now'), datetime('now'));

-- 대구 과학학원 학생 34명 (academy_id = 3)
INSERT OR IGNORE INTO users (id, email, password, name, role, phone, academy_id, createdAt, updatedAt) VALUES
('stu-067', 'student67@daegu.ac', 'student123', '조하준', 'STUDENT', '010-2003-0067', 3, datetime('now', '-19 days'), datetime('now')),
('stu-068', 'student68@daegu.ac', 'student123', '윤수아', 'STUDENT', '010-2003-0068', 3, datetime('now', '-18 days'), datetime('now')),
('stu-069', 'student69@daegu.ac', 'student123', '장시윤', 'STUDENT', '010-2003-0069', 3, datetime('now', '-17 days'), datetime('now')),
('stu-070', 'student70@daegu.ac', 'student123', '한서연', 'STUDENT', '010-2003-0070', 3, datetime('now', '-16 days'), datetime('now')),
('stu-071', 'student71@daegu.ac', 'student123', '김민준', 'STUDENT', '010-2003-0071', 3, datetime('now', '-15 days'), datetime('now')),
('stu-072', 'student72@daegu.ac', 'student123', '이지우', 'STUDENT', '010-2003-0072', 3, datetime('now', '-14 days'), datetime('now')),
('stu-073', 'student73@daegu.ac', 'student123', '박도윤', 'STUDENT', '010-2003-0073', 3, datetime('now', '-13 days'), datetime('now')),
('stu-074', 'student74@daegu.ac', 'student123', '최하윤', 'STUDENT', '010-2003-0074', 3, datetime('now', '-12 days'), datetime('now')),
('stu-075', 'student75@daegu.ac', 'student123', '정서준', 'STUDENT', '010-2003-0075', 3, datetime('now', '-11 days'), datetime('now')),
('stu-076', 'student76@daegu.ac', 'student123', '강유나', 'STUDENT', '010-2003-0076', 3, datetime('now', '-10 days'), datetime('now')),
('stu-077', 'student77@daegu.ac', 'student123', '조재원', 'STUDENT', '010-2003-0077', 3, datetime('now', '-9 days'), datetime('now')),
('stu-078', 'student78@daegu.ac', 'student123', '윤서현', 'STUDENT', '010-2003-0078', 3, datetime('now', '-8 days'), datetime('now')),
('stu-079', 'student79@daegu.ac', 'student123', '장민재', 'STUDENT', '010-2003-0079', 3, datetime('now', '-7 days'), datetime('now')),
('stu-080', 'student80@daegu.ac', 'student123', '한하은', 'STUDENT', '010-2003-0080', 3, datetime('now', '-6 days'), datetime('now')),
('stu-081', 'student81@daegu.ac', 'student123', '김시우', 'STUDENT', '010-2003-0081', 3, datetime('now', '-5 days'), datetime('now')),
('stu-082', 'student82@daegu.ac', 'student123', '이예진', 'STUDENT', '010-2003-0082', 3, datetime('now', '-4 days'), datetime('now')),
('stu-083', 'student83@daegu.ac', 'student123', '박도현', 'STUDENT', '010-2003-0083', 3, datetime('now', '-3 days'), datetime('now')),
('stu-084', 'student84@daegu.ac', 'student123', '최채원', 'STUDENT', '010-2003-0084', 3, datetime('now', '-2 days'), datetime('now')),
('stu-085', 'student85@daegu.ac', 'student123', '정지안', 'STUDENT', '010-2003-0085', 3, datetime('now', '-1 days'), datetime('now')),
('stu-086', 'student86@daegu.ac', 'student123', '강수빈', 'STUDENT', '010-2003-0086', 3, datetime('now'), datetime('now')),
('stu-087', 'student87@daegu.ac', 'student123', '조우진', 'STUDENT', '010-2003-0087', 3, datetime('now'), datetime('now')),
('stu-088', 'student88@daegu.ac', 'student123', '윤서현', 'STUDENT', '010-2003-0088', 3, datetime('now'), datetime('now')),
('stu-089', 'student89@daegu.ac', 'student123', '장민준', 'STUDENT', '010-2003-0089', 3, datetime('now'), datetime('now')),
('stu-090', 'student90@daegu.ac', 'student123', '한지아', 'STUDENT', '010-2003-0090', 3, datetime('now'), datetime('now')),
('stu-091', 'student91@daegu.ac', 'student123', '김현우', 'STUDENT', '010-2003-0091', 3, datetime('now'), datetime('now')),
('stu-092', 'student92@daegu.ac', 'student123', '이서아', 'STUDENT', '010-2003-0092', 3, datetime('now'), datetime('now')),
('stu-093', 'student93@daegu.ac', 'student123', '박민서', 'STUDENT', '010-2003-0093', 3, datetime('now'), datetime('now')),
('stu-094', 'student94@daegu.ac', 'student123', '최준호', 'STUDENT', '010-2003-0094', 3, datetime('now'), datetime('now')),
('stu-095', 'student95@daegu.ac', 'student123', '정소율', 'STUDENT', '010-2003-0095', 3, datetime('now'), datetime('now')),
('stu-096', 'student96@daegu.ac', 'student123', '강지훈', 'STUDENT', '010-2003-0096', 3, datetime('now'), datetime('now')),
('stu-097', 'student97@daegu.ac', 'student123', '조예린', 'STUDENT', '010-2003-0097', 3, datetime('now'), datetime('now')),
('stu-098', 'student98@daegu.ac', 'student123', '윤하준', 'STUDENT', '010-2003-0098', 3, datetime('now'), datetime('now')),
('stu-099', 'student99@daegu.ac', 'student123', '장수아', 'STUDENT', '010-2003-0099', 3, datetime('now'), datetime('now')),
('stu-100', 'student100@daegu.ac', 'student123', '한시윤', 'STUDENT', '010-2003-0100', 3, datetime('now'), datetime('now'));

-- 7. 쇼핑몰 제품 10개
INSERT OR IGNORE INTO store_products (id, name, description, price, imageUrl, category, isActive, createdAt, updatedAt)
VALUES 
('prod-001', '수학 AI 봇 - 초등', '초등학생을 위한 수학 문제 풀이 AI 봇', 29900, 'https://api.dicebear.com/7.x/bottts/svg?seed=math-elem', 'AI_BOT', 1, datetime('now', '-20 days'), datetime('now')),
('prod-002', '수학 AI 봇 - 중등', '중학생을 위한 수학 문제 풀이 AI 봇', 39900, 'https://api.dicebear.com/7.x/bottts/svg?seed=math-mid', 'AI_BOT', 1, datetime('now', '-20 days'), datetime('now')),
('prod-003', '수학 AI 봇 - 고등', '고등학생을 위한 수학 문제 풀이 AI 봇', 49900, 'https://api.dicebear.com/7.x/bottts/svg?seed=math-high', 'AI_BOT', 1, datetime('now', '-20 days'), datetime('now')),
('prod-004', '영어 회화 AI 봇', '일상 영어 회화 연습 AI 봇', 34900, 'https://api.dicebear.com/7.x/bottts/svg?seed=english-conv', 'AI_BOT', 1, datetime('now', '-18 days'), datetime('now')),
('prod-005', '영어 문법 AI 봇', '영어 문법 학습 AI 봇', 34900, 'https://api.dicebear.com/7.x/bottts/svg?seed=english-gram', 'AI_BOT', 1, datetime('now', '-18 days'), datetime('now')),
('prod-006', '과학 실험 AI 봇', '과학 실험 가이드 AI 봇', 39900, 'https://api.dicebear.com/7.x/bottts/svg?seed=science', 'AI_BOT', 1, datetime('now', '-15 days'), datetime('now')),
('prod-007', '코딩 튜터 AI 봇', 'Python, JavaScript 등 코딩 학습 AI 봇', 44900, 'https://api.dicebear.com/7.x/bottts/svg?seed=coding', 'AI_BOT', 1, datetime('now', '-15 days'), datetime('now')),
('prod-008', '역사 퀴즈 AI 봇', '재미있는 역사 퀴즈 AI 봇', 29900, 'https://api.dicebear.com/7.x/bottts/svg?seed=history', 'AI_BOT', 1, datetime('now', '-12 days'), datetime('now')),
('prod-009', '독서 토론 AI 봇', '책 읽기와 토론을 돕는 AI 봇', 34900, 'https://api.dicebear.com/7.x/bottts/svg?seed=reading', 'AI_BOT', 1, datetime('now', '-10 days'), datetime('now')),
('prod-010', '진로 상담 AI 봇', '진로 탐색과 상담을 돕는 AI 봇', 39900, 'https://api.dicebear.com/7.x/bottts/svg?seed=career', 'AI_BOT', 1, datetime('now', '-8 days'), datetime('now'));

-- 8. 확인 쿼리
SELECT '학원' as type, COUNT(*) as count FROM academy
UNION ALL
SELECT 'AI 봇' as type, COUNT(*) as count FROM ai_bots
UNION ALL
SELECT '전체 사용자' as type, COUNT(*) as count FROM users
UNION ALL
SELECT '관리자' as type, COUNT(*) as count FROM users WHERE role = 'ADMIN'
UNION ALL
SELECT '학원장' as type, COUNT(*) as count FROM users WHERE role = 'DIRECTOR'
UNION ALL
SELECT '선생님' as type, COUNT(*) as count FROM users WHERE role = 'TEACHER'
UNION ALL
SELECT '학생' as type, COUNT(*) as count FROM users WHERE role = 'STUDENT'
UNION ALL
SELECT '쇼핑몰 제품' as type, COUNT(*) as count FROM store_products;

-- ================================================
-- 실행 결과 예상:
-- 학원: 3
-- AI 봇: 2
-- 전체 사용자: 114
-- 관리자: 1
-- 학원장: 3
-- 선생님: 10
-- 학생: 100
-- 쇼핑몰 제품: 10
-- ================================================
