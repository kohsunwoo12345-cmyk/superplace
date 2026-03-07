# 실제 사용 데이터 추가 SQL

## 1단계: academyId 찾기

먼저 현재 학원장 계정의 academyId를 찾습니다:

```sql
-- 학원장 계정 찾기 (이메일이나 이름으로)
SELECT id, email, name, academyId, role 
FROM User 
WHERE role = 'DIRECTOR' 
LIMIT 5;
```

결과에서 본인의 academyId를 확인하세요 (예: '1', '123' 등)

---

## 2단계: 해당 학원의 학생 ID 찾기

```sql
-- 본인 학원의 학생들 찾기 (academyId를 실제 값으로 변경)
SELECT id, name, email, academyId 
FROM User 
WHERE academyId = '1' AND role = 'STUDENT' 
LIMIT 10;
```

---

## 3단계: 실제 숙제 제출 데이터 추가

**중요:** 아래 SQL에서 `'1'`을 본인의 실제 academyId로 변경하세요!

```sql
-- 숙제 제출 데이터 추가 (각 학생마다 5개씩)
INSERT INTO homework_submissions (id, userId, submittedAt, gradedAt, score, feedback, subject, createdAt)
SELECT 
  'hw_' || u.id || '_' || (random() % 10000),
  u.id,
  datetime('now', '-' || (random() % 30) || ' days'),
  datetime('now', '-' || (random() % 30) || ' days'),
  70 + (random() % 30),
  '잘했어요!',
  CASE (random() % 5)
    WHEN 0 THEN '수학'
    WHEN 1 THEN '영어'
    WHEN 2 THEN '과학'
    WHEN 3 THEN '국어'
    ELSE '사회'
  END,
  datetime('now', '-' || (random() % 30) || ' days')
FROM User u
WHERE u.academyId = '1' AND u.role = 'STUDENT'
LIMIT 20;
```

---

## 4단계: 랜딩페이지 데이터 추가

```sql
-- 랜딩페이지 5개 추가 (academyId를 실제 값으로 변경)
INSERT INTO landing_pages (id, academyId, title, content, status, createdAt)
VALUES 
  ('lp_' || hex(randomblob(8)), '1', '2024 봄 특강 모집', '새학기 수학 특강 안내', 'published', datetime('now', '-15 days')),
  ('lp_' || hex(randomblob(8)), '1', '여름방학 캠프', '여름방학 영어 집중 캠프', 'published', datetime('now', '-10 days')),
  ('lp_' || hex(randomblob(8)), '1', '중간고사 대비반', '중간고사 대비 특별반 모집', 'published', datetime('now', '-8 days')),
  ('lp_' || hex(randomblob(8)), '1', '수능 파이널', '2024 수능 파이널 특강', 'published', datetime('now', '-5 days')),
  ('lp_' || hex(randomblob(8)), '1', '신입생 오리엔테이션', '신입생 환영 안내', 'draft', datetime('now', '-2 days'));
```

---

## 5단계: AI 분석 로그 추가

```sql
-- AI 분석 로그 추가 (academyId를 실제 값으로 변경)
INSERT INTO usage_logs (id, userId, subscriptionId, type, action, createdAt)
SELECT 
  'log_ai_' || u.id || '_' || (random() % 10000),
  u.id,
  1,
  'ai_analysis',
  'AI 약점 분석 실행',
  datetime('now', '-' || (random() % 30) || ' days')
FROM User u
WHERE u.academyId = '1' AND u.role = 'STUDENT'
LIMIT 10;
```

---

## 6단계: 유사문제 로그 추가

```sql
-- 유사문제 생성 로그 추가 (academyId를 실제 값으로 변경)
INSERT INTO usage_logs (id, userId, subscriptionId, type, action, createdAt)
SELECT 
  'log_sim_' || u.id || '_' || (random() % 10000),
  u.id,
  1,
  'similar_problem',
  '유사 문제 생성',
  datetime('now', '-' || (random() % 30) || ' days')
FROM User u
WHERE u.academyId = '1' AND u.role = 'STUDENT'
LIMIT 8;
```

---

## 7단계: 확인

```sql
-- 숙제 검사 수 확인
SELECT COUNT(*) as homework_count 
FROM homework_submissions hs
JOIN User u ON hs.userId = u.id
WHERE u.academyId = '1' AND hs.submittedAt IS NOT NULL;

-- 랜딩페이지 수 확인
SELECT COUNT(*) as landing_count 
FROM landing_pages 
WHERE academyId = '1';

-- AI 분석 수 확인
SELECT COUNT(*) as ai_count 
FROM usage_logs ul
JOIN User u ON ul.userId = u.id
WHERE u.academyId = '1' AND ul.type = 'ai_analysis';

-- 유사문제 수 확인
SELECT COUNT(*) as similar_count 
FROM usage_logs ul
JOIN User u ON ul.userId = u.id
WHERE u.academyId = '1' AND ul.type = 'similar_problem';
```

---

## 📋 실행 순서

1. **1단계:** 본인의 academyId 확인
2. **2단계:** 학생 목록 확인 (있어야 함)
3. **3-6단계:** 위의 SQL을 **한 번에 하나씩** 실행 (모든 `'1'`을 실제 academyId로 변경)
4. **7단계:** 데이터 확인
5. **설정 페이지 새로고침** → 숫자 나타남! 🎉

---

## ⚠️ 주의사항

- **모든 SQL에서 `academyId = '1'` 부분을 본인의 실제 academyId로 변경하세요!**
- User 테이블에 학생이 없으면 INSERT 쿼리가 작동하지 않습니다
- 학생이 없다면 먼저 학생을 추가해야 합니다

---

## 🎯 예상 결과

실행 후:
- 숙제 검사: **20개** 
- 랜딩페이지: **5개**
- AI 분석: **10개**
- 유사문제: **8개**

설정 페이지에서 즉시 확인 가능합니다!
