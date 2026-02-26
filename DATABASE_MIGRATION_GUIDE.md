# 데이터베이스 마이그레이션 가이드

## ProductViewLog 테이블 추가하기

**날짜**: 2026-02-26

---

## ⚠️ 중요: 이 마이그레이션을 실행해야 합니다!

상품 조회 로그 기능을 사용하려면 `ProductViewLog` 테이블을 생성해야 합니다.

---

## 🔧 Cloudflare D1 마이그레이션 실행

### 방법 1: Wrangler CLI 사용 (권장)

```bash
# 1. wrangler가 설치되어 있는지 확인
wrangler --version

# 2. 마이그레이션 실행
wrangler d1 execute superplace-db --file=migrations/add_product_view_log.sql --remote

# 또는 로컬 환경에서 테스트
wrangler d1 execute superplace-db --file=migrations/add_product_view_log.sql --local
```

**데이터베이스 이름 확인**:
```bash
# wrangler.toml 파일에서 database_name 확인
grep "database_name" wrangler.toml
```

---

### 방법 2: Cloudflare Dashboard 사용

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) 접속
2. Workers & Pages → D1 메뉴
3. `superplace-db` 데이터베이스 선택
4. Console 탭
5. `/migrations/add_product_view_log.sql` 파일의 내용을 복사하여 붙여넣기
6. "Execute" 버튼 클릭

---

### 방법 3: 관리자 API를 통한 실행 (자동화)

만약 별도의 마이그레이션 API를 구현했다면:

```bash
curl -X POST https://superplacestudy.pages.dev/api/admin/migrate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"migration": "add_product_view_log"}'
```

---

## 📋 마이그레이션 SQL 파일 내용

**파일**: `/migrations/add_product_view_log.sql`

```sql
-- Create ProductViewLog table
-- This table tracks which users view which products in the store

CREATE TABLE IF NOT EXISTS ProductViewLog (
  id TEXT PRIMARY KEY,
  userId TEXT,
  userEmail TEXT,
  userName TEXT,
  productId TEXT NOT NULL,
  productName TEXT NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE SET NULL,
  FOREIGN KEY (productId) REFERENCES StoreProduct(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_product_view_log_user ON ProductViewLog(userId);
CREATE INDEX IF NOT EXISTS idx_product_view_log_product ON ProductViewLog(productId);
CREATE INDEX IF NOT EXISTS idx_product_view_log_created ON ProductViewLog(createdAt);
CREATE INDEX IF NOT EXISTS idx_product_view_log_user_product ON ProductViewLog(userId, productId);
```

---

## ✅ 마이그레이션 확인

마이그레이션이 성공했는지 확인하려면:

```sql
-- 테이블 존재 확인
SELECT name FROM sqlite_master WHERE type='table' AND name='ProductViewLog';

-- 테이블 구조 확인
PRAGMA table_info(ProductViewLog);

-- 인덱스 확인
SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='ProductViewLog';
```

---

## 🧪 테스트 데이터 삽입 (선택)

테스트 데이터를 삽입하여 로그 시스템이 정상 작동하는지 확인:

```sql
INSERT INTO ProductViewLog 
  (id, userId, userEmail, userName, productId, productName, ipAddress, userAgent, createdAt)
VALUES 
  ('test-log-1', 'user-123', 'test@example.com', '테스트 사용자', 'prod-1', '테스트 상품', '127.0.0.1', 'Mozilla/5.0', datetime('now'));
```

---

## 🔍 로그 조회 쿼리 예시

### 1. 특정 사용자의 조회 이력
```sql
SELECT productName, createdAt 
FROM ProductViewLog 
WHERE userId = 'user-123' 
ORDER BY createdAt DESC;
```

### 2. 특정 상품의 조회 횟수
```sql
SELECT COUNT(*) as viewCount 
FROM ProductViewLog 
WHERE productId = 'prod-1';
```

### 3. 인기 상품 TOP 10
```sql
SELECT productName, COUNT(*) as viewCount 
FROM ProductViewLog 
GROUP BY productId, productName 
ORDER BY viewCount DESC 
LIMIT 10;
```

### 4. 고유 사용자 수
```sql
SELECT COUNT(DISTINCT userId) as uniqueUsers 
FROM ProductViewLog 
WHERE userId IS NOT NULL;
```

### 5. 시간대별 조회 수 (최근 24시간)
```sql
SELECT 
  strftime('%Y-%m-%d %H:00', createdAt) as hour,
  COUNT(*) as viewCount
FROM ProductViewLog
WHERE createdAt >= datetime('now', '-1 day')
GROUP BY hour
ORDER BY hour DESC;
```

---

## 📝 롤백 (테이블 삭제)

만약 마이그레이션을 롤백하려면:

```sql
-- 테이블 삭제 (주의: 모든 로그 데이터가 삭제됩니다!)
DROP TABLE IF EXISTS ProductViewLog;
```

---

## 🚀 다음 단계

마이그레이션을 실행한 후:

1. ✅ Cloudflare Pages 재배포 확인
2. ✅ `/store/detail?id=xxx` 페이지 접속 테스트
3. ✅ `/dashboard/admin/logs` 페이지에서 "상품조회" 카테고리 확인
4. ✅ 조회 로그가 기록되는지 확인

---

**문제가 발생하면**:
- Cloudflare Dashboard의 D1 Console에서 에러 메시지 확인
- 브라우저 콘솔에서 API 호출 에러 확인
- 서버 로그 확인 (`wrangler tail`)

---

**마이그레이션 완료!** 🎉
