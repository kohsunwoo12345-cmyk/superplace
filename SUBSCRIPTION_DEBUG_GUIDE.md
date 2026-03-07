# 구독 사용량 카운트 디버깅 가이드

## 📊 현재 상황
랜딩페이지 개수와 숙제 검사 수가 0으로 표시되는 문제

## 🔍 진단 방법

### 1. 디버그 API 사용
```
https://superplace-academy.pages.dev/api/subscription/debug-count?academyId={academyId}
```

**반환 데이터:**
```json
{
  "academyId": "1",
  "timestamp": "2026-03-07T...",
  "tables": {
    "homework_submissions": {
      "exists": true/false,
      "count": { "total": 10, "submitted": 8 },
      "sample": [...]
    },
    "landing_pages": {
      "exists": true/false,
      "count": { "total": 5 },
      "sample": [...]
    },
    "usage_logs": {
      "exists": true/false,
      "counts": [
        { "type": "ai_analysis", "count": 20 },
        { "type": "similar_problem", "count": 15 }
      ]
    },
    "users": {
      "exists": true/false,
      "counts": [
        { "role": "STUDENT", "count": 50 },
        { "role": "DIRECTOR", "count": 1 }
      ]
    }
  },
  "subscription": {
    "id": 1,
    "userId": 1,
    "planName": "베이직",
    "startDate": "2026-02-01",
    "endDate": "2026-03-01",
    "max_students": 100,
    "max_homework_checks": 500
  }
}
```

### 2. 테이블이 존재하지 않는 경우

**문제:** `homework_submissions` 또는 `landing_pages` 테이블이 존재하지 않음

**해결방법:**  
해당 테이블을 생성해야 합니다.

#### A. `homework_submissions` 테이블 생성
```sql
CREATE TABLE IF NOT EXISTS homework_submissions (
  id TEXT PRIMARY KEY,
  userId INTEGER NOT NULL,
  attendanceRecordId TEXT,
  imageUrl TEXT,
  score INTEGER,
  feedback TEXT,
  subject TEXT,
  completion INTEGER,
  effort INTEGER,
  strengths TEXT,
  suggestions TEXT,
  submittedAt TEXT NOT NULL,
  gradedAt TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (attendanceRecordId) REFERENCES attendance_records(id)
);
```

#### B. `landing_pages` 테이블 생성
```sql
CREATE TABLE IF NOT EXISTS landing_pages (
  id TEXT PRIMARY KEY,
  academyId TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  slug TEXT UNIQUE,
  status TEXT DEFAULT 'draft',
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT,
  publishedAt TEXT,
  FOREIGN KEY (academyId) REFERENCES User(academyId)
);
```

### 3. 테이블은 있지만 데이터가 없는 경우

**문제:** 테이블은 존재하지만 실제로 숙제 제출이나 랜딩페이지 생성이 아직 없음

**확인 방법:**
```sql
-- 숙제 제출 확인
SELECT COUNT(*) FROM homework_submissions WHERE submittedAt IS NOT NULL;

-- 랜딩페이지 확인
SELECT COUNT(*) FROM landing_pages WHERE academyId = ?;
```

**해결:** 실제로 데이터를 생성해야 합니다
- 숙제를 제출하거나
- 랜딩페이지를 생성하거나
- 테스트 데이터를 추가

### 4. academyId가 잘못된 경우

**문제:** 사용자의 academyId가 설정되지 않았거나 잘못됨

**확인:**
```sql
SELECT id, email, role, academyId FROM User WHERE id = {userId};
```

**해결:** User 테이블에서 academyId를 올바르게 설정

## 📝 테이블 스키마 요약

| 테이블 | 필수 컬럼 | 카운트 조건 |
|--------|----------|------------|
| **homework_submissions** | `userId`, `submittedAt` | `submittedAt IS NOT NULL` AND 플랜 기간 내 |
| **landing_pages** | `academyId`, `createdAt` | 플랜 기간 내 |
| **usage_logs** | `userId`, `type`, `createdAt` | `type='ai_analysis'` OR `type='similar_problem'` AND 플랜 기간 내 |
| **User** | `id`, `academyId`, `role` | `role='STUDENT'` AND `withdrawnAt IS NULL` |

## 🔧 Cloudflare D1 데이터베이스 접근 방법

### Wrangler CLI 사용
```bash
# D1 데이터베이스 목록 확인
wrangler d1 list

# 데이터베이스에 SQL 실행
wrangler d1 execute {DB_NAME} --command="SELECT * FROM homework_submissions LIMIT 5"

# 대화형 쿼리
wrangler d1 execute {DB_NAME} --local
```

### Cloudflare Dashboard 사용
1. https://dash.cloudflare.com 로그인
2. Workers & Pages → D1 Database 선택
3. DB 선택 → Console 탭에서 SQL 직접 실행

## ✅ 해결 체크리스트

- [ ] `homework_submissions` 테이블이 존재하는가?
- [ ] `landing_pages` 테이블이 존재하는가?
- [ ] `usage_logs` 테이블이 존재하는가?
- [ ] User 테이블에 `academyId`가 제대로 설정되어 있는가?
- [ ] 실제로 숙제가 제출된 적이 있는가? (`submittedAt` 필드 있음)
- [ ] 실제로 랜딩페이지가 생성된 적이 있는가?
- [ ] 구독 정보가 올바르게 저장되어 있는가?
- [ ] `startDate` 또는 `createdAt` 날짜가 올바른가?

## 🚀 다음 단계

1. **디버그 API 호출** (`/api/subscription/debug-count?academyId=...`)
2. **결과 분석** - 어떤 테이블이 없거나 비어있는지 확인
3. **테이블 생성/데이터 추가**
4. **재확인** - `/api/subscription/check` 호출하여 카운트가 제대로 나오는지 확인

## 📞 문제 지속 시

**로그 확인:**
- Cloudflare Dashboard → Workers & Pages → superplace-academy → Logs
- 콘솔에 표시되는 에러 메시지 확인
- 어떤 테이블에서 에러가 발생하는지 확인

**로그 예시:**
```
⚠️ homework_submissions 테이블 없음: no such table: homework_submissions
⚠️ landing_pages 테이블 없음: no such table: landing_pages
```

이 경우 해당 테이블을 생성해야 합니다.
