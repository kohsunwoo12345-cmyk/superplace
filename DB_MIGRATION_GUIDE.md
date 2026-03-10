# 일일 사용 한도 기능 - DB 마이그레이션 가이드

## ❌ 에러 발생 시 해결 방법

"no such column: dailyUsageLimit" 에러가 발생하는 이유는 컬럼이 아직 추가되지 않았기 때문입니다.

---

## ✅ 올바른 실행 순서

### 방법 1: Cloudflare D1 Console (권장)

Cloudflare 대시보드 → Storage & Databases → D1 → `webapp-production` → Console에서 **하나씩** 실행하세요.

#### Step 1: 컬럼 추가
```sql
ALTER TABLE ai_bot_assignments ADD COLUMN dailyUsageLimit INTEGER DEFAULT 15;
```

**예상 결과:**
- ✅ 성공: "Query executed successfully"
- ⚠️ 에러: "duplicate column name: dailyUsageLimit" → 이미 추가됨, Step 2로 이동

---

#### Step 2: 기존 데이터 업데이트
```sql
UPDATE ai_bot_assignments 
SET dailyUsageLimit = 15 
WHERE dailyUsageLimit IS NULL;
```

**확인:**
```sql
SELECT COUNT(*) as total, 
       COUNT(dailyUsageLimit) as with_limit
FROM ai_bot_assignments;
```

---

#### Step 3: 사용 기록 테이블 생성
```sql
CREATE TABLE IF NOT EXISTS bot_usage_logs (
  id TEXT PRIMARY KEY,
  assignmentId TEXT NOT NULL,
  botId TEXT NOT NULL,
  userId TEXT NOT NULL,
  userType TEXT NOT NULL,
  messageCount INTEGER DEFAULT 1,
  usageDate TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now'))
);
```

**인덱스 생성:**
```sql
CREATE INDEX IF NOT EXISTS idx_bot_usage_logs_assignment ON bot_usage_logs(assignmentId);
CREATE INDEX IF NOT EXISTS idx_bot_usage_logs_user ON bot_usage_logs(userId, usageDate);
CREATE INDEX IF NOT EXISTS idx_bot_usage_logs_composite ON bot_usage_logs(assignmentId, userId, usageDate);
```

---

#### Step 4: VIEW 생성
```sql
DROP VIEW IF EXISTS v_daily_bot_usage;

CREATE VIEW v_daily_bot_usage AS
SELECT 
  ba.id AS assignmentId,
  ba.botId,
  ba.userId AS studentId,
  ba.dailyUsageLimit,
  DATE('now') AS usageDate,
  COALESCE(SUM(bul.messageCount), 0) AS dailyUsageCount,
  ba.dailyUsageLimit - COALESCE(SUM(bul.messageCount), 0) AS remainingUsage,
  CASE 
    WHEN COALESCE(SUM(bul.messageCount), 0) >= ba.dailyUsageLimit THEN 1
    ELSE 0
  END AS isLimitExceeded
FROM ai_bot_assignments ba
LEFT JOIN bot_usage_logs bul 
  ON ba.id = bul.assignmentId 
  AND DATE(bul.createdAt) = DATE('now')
WHERE ba.status = 'active'
GROUP BY ba.id, ba.botId, ba.userId, ba.dailyUsageLimit;
```

---

### 방법 2: Wrangler CLI

로컬에서 순서대로 실행:

```bash
# Step 1
wrangler d1 execute webapp-production --file=STEP1_ADD_COLUMN.sql

# Step 2
wrangler d1 execute webapp-production --file=STEP2_UPDATE_DEFAULTS.sql

# Step 3
wrangler d1 execute webapp-production --file=STEP3_CREATE_LOGS_TABLE.sql

# Step 4
wrangler d1 execute webapp-production --file=STEP4_CREATE_VIEW.sql
```

---

## 🔍 최종 검증

모든 Step 완료 후 실행:

```sql
-- 1. 테이블 구조 확인
PRAGMA table_info(ai_bot_assignments);
-- dailyUsageLimit 컬럼이 보여야 함

-- 2. 데이터 확인
SELECT id, userId, botId, dailyUsageLimit, status 
FROM ai_bot_assignments 
LIMIT 3;

-- 3. bot_usage_logs 테이블 확인
SELECT COUNT(*) FROM bot_usage_logs;
-- 0이어야 함 (아직 사용 기록 없음)

-- 4. VIEW 확인
SELECT * FROM v_daily_bot_usage LIMIT 3;
```

---

## 📊 예상 결과

### PRAGMA table_info(ai_bot_assignments):
```
cid  name              type     notnull  dflt_value  pk
---  ----------------  -------  -------  ----------  --
...
12   dailyUsageLimit   INTEGER  0        15          0  ← 이 줄이 보여야 함
...
```

### SELECT 결과:
```
id                  userId     botId      dailyUsageLimit  status
------------------  ---------  ---------  ---------------  ------
assignment-xxx-1    user-123   bot-456    15               active
assignment-xxx-2    user-789   bot-456    15               active
```

---

## ⚠️ 문제 해결

### 문제 1: "duplicate column name" 에러
**원인:** 컬럼이 이미 존재함  
**해결:** Step 2로 건너뛰기

### 문제 2: "no such table: ai_bot_assignments"
**원인:** 테이블이 없음  
**해결:** 전체 스키마 재생성 필요 (COMPLETE_DATABASE_SCHEMA_AND_TEST_DATA.sql 실행)

### 문제 3: VIEW 생성 실패
**원인:** bot_usage_logs 테이블이 없음  
**해결:** Step 3 먼저 실행

---

## 📁 제공 파일

- `STEP1_ADD_COLUMN.sql` - 컬럼 추가
- `STEP2_UPDATE_DEFAULTS.sql` - 기본값 설정
- `STEP3_CREATE_LOGS_TABLE.sql` - 로그 테이블 생성
- `STEP4_CREATE_VIEW.sql` - VIEW 생성
- `ADD_DAILY_USAGE_LIMIT.sql` - 전체 스크립트 (한 번에 실행)

---

## ✅ 완료 확인

마이그레이션이 성공하면:

1. ✅ `ai_bot_assignments.dailyUsageLimit` 컬럼 존재
2. ✅ 기존 할당에 기본값 15 설정됨
3. ✅ `bot_usage_logs` 테이블 생성됨
4. ✅ `v_daily_bot_usage` VIEW 생성됨

이제 API가 정상 작동합니다!

---

**작성일**: 2026-03-09  
**작성자**: AI Assistant
