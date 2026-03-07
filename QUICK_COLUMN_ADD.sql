# 간단 컬럼 추가 SQL (Cloudflare D1 Console에서 실행)

## 🚀 빠른 실행 (순서대로)

### 1단계: usage_logs 테이블에 컬럼 추가
```sql
ALTER TABLE usage_logs ADD COLUMN subscriptionId INTEGER;
ALTER TABLE usage_logs ADD COLUMN action TEXT;
```

### 2단계: user_subscriptions 테이블에 userId 컬럼 추가 (user_id만 있는 경우)
```sql
-- userId 컬럼 추가
ALTER TABLE user_subscriptions ADD COLUMN userId INTEGER;

-- user_id 데이터를 userId로 복사
UPDATE user_subscriptions SET userId = user_id WHERE userId IS NULL;
```

### 3단계: 확인
```sql
-- usage_logs 컬럼 확인
PRAGMA table_info(usage_logs);

-- user_subscriptions 컬럼 확인
PRAGMA table_info(user_subscriptions);
```

---

## 📋 또는 개별 실행

### usage_logs - subscriptionId 컬럼
```sql
ALTER TABLE usage_logs ADD COLUMN subscriptionId INTEGER;
```

### usage_logs - action 컬럼
```sql
ALTER TABLE usage_logs ADD COLUMN action TEXT;
```

### user_subscriptions - userId 컬럼
```sql
ALTER TABLE user_subscriptions ADD COLUMN userId INTEGER;
UPDATE user_subscriptions SET userId = user_id WHERE userId IS NULL;
```

---

## ⚠️ 이미 컬럼이 있다는 에러가 나오면

에러 메시지: `duplicate column name: subscriptionId`

→ **정상입니다!** 이미 컬럼이 추가되어 있다는 뜻입니다. 다음 단계로 진행하세요.

---

## ✅ 완료 후 테스트

```bash
curl "https://superplace-academy.pages.dev/api/subscription/check?academyId=1"
```

성공 응답이 나와야 합니다! 🎉
