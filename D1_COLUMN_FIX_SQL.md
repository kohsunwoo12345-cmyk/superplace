# D1 데이터베이스 컬럼 추가 SQL

## ⚠️ 중요: Cloudflare Dashboard → D1 Database → Console에서 실행

---

## 1️⃣ 현재 테이블 구조 확인

### user_subscriptions 테이블 확인
```sql
PRAGMA table_info(user_subscriptions);
```

### usage_logs 테이블 확인
```sql
PRAGMA table_info(usage_logs);
```

### homework_submissions 테이블 확인
```sql
PRAGMA table_info(homework_submissions);
```

### landing_pages 테이블 확인
```sql
PRAGMA table_info(landing_pages);
```

---

## 2️⃣ user_subscriptions 테이블 - 컬럼명 통일

### A. userId 컬럼이 없는 경우 (user_id만 있는 경우)
```sql
-- userId 컬럼 추가
ALTER TABLE user_subscriptions ADD COLUMN userId INTEGER;

-- user_id 데이터를 userId로 복사
UPDATE user_subscriptions SET userId = user_id;
```

### B. 또는 테이블 재생성 (권장)
```sql
-- 1. 백업 테이블 생성
CREATE TABLE user_subscriptions_backup AS 
SELECT * FROM user_subscriptions;

-- 2. 기존 테이블 삭제
DROP TABLE user_subscriptions;

-- 3. 새 테이블 생성 (올바른 컬럼명)
CREATE TABLE user_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  planName TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  startDate TEXT,
  endDate TEXT NOT NULL,
  max_students INTEGER DEFAULT 0,
  max_homework_checks INTEGER DEFAULT 0,
  max_ai_analysis INTEGER DEFAULT 0,
  max_similar_problems INTEGER DEFAULT 0,
  max_landing_pages INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

-- 4. 백업에서 데이터 복원 (user_id → userId로 변환)
INSERT INTO user_subscriptions (
  id, userId, planName, status, startDate, endDate,
  max_students, max_homework_checks, max_ai_analysis, 
  max_similar_problems, max_landing_pages, createdAt, updatedAt
)
SELECT 
  id, 
  COALESCE(userId, user_id) as userId,  -- userId 또는 user_id 사용
  planName, status, startDate, endDate,
  max_students, max_homework_checks, max_ai_analysis,
  max_similar_problems, max_landing_pages, createdAt, updatedAt
FROM user_subscriptions_backup;

-- 5. 백업 테이블 삭제 (선택사항)
DROP TABLE user_subscriptions_backup;
```

---

## 3️⃣ usage_logs 테이블 - subscriptionId, action 컬럼 추가

```sql
-- subscriptionId 컬럼 추가 (이미 있으면 에러 무시)
ALTER TABLE usage_logs ADD COLUMN subscriptionId INTEGER;

-- action 컬럼 추가 (이미 있으면 에러 무시)
ALTER TABLE usage_logs ADD COLUMN action TEXT;

-- 확인
PRAGMA table_info(usage_logs);
```

---

## 4️⃣ homework_submissions 테이블 확인

이미 올바른 스키마가 있어야 합니다:
```sql
-- 테이블 구조 확인
PRAGMA table_info(homework_submissions);

-- userId 컬럼이 있는지 확인 (있어야 함)
SELECT name FROM pragma_table_info('homework_submissions') WHERE name = 'userId';
```

userId 컬럼이 없다면:
```sql
ALTER TABLE homework_submissions ADD COLUMN userId INTEGER NOT NULL DEFAULT 0;
```

---

## 5️⃣ landing_pages 테이블 확인

이미 올바른 스키마가 있어야 합니다:
```sql
-- 테이블 구조 확인
PRAGMA table_info(landing_pages);

-- academyId 컬럼이 있는지 확인 (있어야 함)
SELECT name FROM pragma_table_info('landing_pages') WHERE name = 'academyId';
```

academyId 컬럼이 없다면:
```sql
ALTER TABLE landing_pages ADD COLUMN academyId TEXT NOT NULL DEFAULT '0';
```

---

## 6️⃣ User 테이블 - academyId 컬럼 확인

```sql
-- User 테이블 구조 확인
PRAGMA table_info(User);

-- academyId 컬럼 확인
SELECT name FROM pragma_table_info('User') WHERE name = 'academyId';
```

academyId 컬럼이 없다면:
```sql
ALTER TABLE User ADD COLUMN academyId TEXT;
```

---

## 7️⃣ 최종 확인 쿼리

### 모든 테이블의 컬럼명 확인
```sql
-- user_subscriptions
SELECT 'user_subscriptions' as table_name, name as column_name, type 
FROM pragma_table_info('user_subscriptions');

-- usage_logs
SELECT 'usage_logs' as table_name, name as column_name, type 
FROM pragma_table_info('usage_logs');

-- homework_submissions
SELECT 'homework_submissions' as table_name, name as column_name, type 
FROM pragma_table_info('homework_submissions');

-- landing_pages
SELECT 'landing_pages' as table_name, name as column_name, type 
FROM pragma_table_info('landing_pages');

-- User
SELECT 'User' as table_name, name as column_name, type 
FROM pragma_table_info('User');
```

---

## 8️⃣ 데이터 확인

### user_subscriptions 샘플 조회
```sql
SELECT id, userId, planName, status, startDate, endDate 
FROM user_subscriptions 
LIMIT 3;
```

### usage_logs 샘플 조회
```sql
SELECT id, userId, subscriptionId, type, action, createdAt 
FROM usage_logs 
LIMIT 3;
```

### homework_submissions 샘플 조회
```sql
SELECT id, userId, submittedAt, score 
FROM homework_submissions 
LIMIT 3;
```

### landing_pages 샘플 조회
```sql
SELECT id, academyId, title, status, createdAt 
FROM landing_pages 
LIMIT 3;
```

---

## 🎯 권장 실행 순서

1. **먼저 현재 구조 확인** (1️⃣ 실행)
2. **user_subscriptions 수정** (2️⃣ 실행 - 방법 B 권장)
3. **usage_logs 컬럼 추가** (3️⃣ 실행)
4. **최종 확인** (7️⃣ 실행)
5. **데이터 확인** (8️⃣ 실행)

---

## ✅ 완료 후 API 테스트

```bash
# 사용량 조회 테스트
curl "https://superplace-academy.pages.dev/api/subscription/check?academyId=1"

# 디버그 정보 확인
curl "https://superplace-academy.pages.dev/api/subscription/debug-count?academyId=1"
```

---

## 📝 참고: 올바른 컬럼명

| 테이블 | 올바른 컬럼명 | 잘못된 컬럼명 |
|--------|---------------|---------------|
| user_subscriptions | **userId** | ~~user_id~~ |
| usage_logs | **userId** | ~~user_id~~ |
| homework_submissions | **userId** | ~~user_id~~ |
| landing_pages | **academyId** | ~~academy_id~~ |
| User | **academyId** | ~~academy_id~~ |

**⚠️ 중요:** D1은 camelCase 컬럼명을 사용합니다!
