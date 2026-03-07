# D1 테이블 구조 확인 SQL

## 🔍 Step 1: 현재 테이블 목록 확인

```sql
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
```

이 쿼리로 어떤 테이블들이 존재하는지 먼저 확인하세요.

---

## 🔍 Step 2: 각 테이블의 컬럼 구조 확인

### user_subscriptions 테이블 구조
```sql
SELECT sql FROM sqlite_master WHERE type='table' AND name='user_subscriptions';
```

### usage_logs 테이블 구조
```sql
SELECT sql FROM sqlite_master WHERE type='table' AND name='usage_logs';
```

### homework_submissions 테이블 구조
```sql
SELECT sql FROM sqlite_master WHERE type='table' AND name='homework_submissions';
```

### landing_pages 테이블 구조
```sql
SELECT sql FROM sqlite_master WHERE type='table' AND name='landing_pages';
```

### User 테이블 구조
```sql
SELECT sql FROM sqlite_master WHERE type='table' AND name='User';
```

---

## 📋 결과 예시

실행 결과가 다음과 같이 나올 것입니다:

```
CREATE TABLE user_subscriptions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,      ← 이것이 user_id인지 userId인지 확인!
  ...
)
```

---

## 🎯 다음 단계

위의 SQL을 실행한 후 결과를 알려주시면:
1. 어떤 컬럼이 있는지
2. 어떤 컬럼이 없는지
3. 컬럼명이 user_id인지 userId인지

를 확인하고 정확한 ALTER TABLE 문을 만들어드리겠습니다!
