# 테이블 생성 API 사용 가이드

## 📋 개요
구독 사용량 카운트를 위한 필수 테이블들을 생성하는 API입니다.

---

## 🔧 개별 테이블 생성 API

### 1️⃣ homework_submissions 테이블 생성

**API 호출:**
```bash
curl -X POST https://superplace-academy.pages.dev/api/subscription/create-homework-table
```

**테이블 스키마:**
```sql
CREATE TABLE homework_submissions (
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
  submittedAt TEXT NOT NULL,    -- 숙제 제출 시간 (필수)
  gradedAt TEXT,                -- 채점 완료 시간
  createdAt TEXT DEFAULT (datetime('now'))
);
```

**인덱스:**
- `idx_homework_submissions_userId` (검색 성능 향상)
- `idx_homework_submissions_submittedAt` (날짜 필터링 성능 향상)

---

### 2️⃣ landing_pages 테이블 생성

**API 호출:**
```bash
curl -X POST https://superplace-academy.pages.dev/api/subscription/create-landing-table
```

**테이블 스키마:**
```sql
CREATE TABLE landing_pages (
  id TEXT PRIMARY KEY,
  academyId TEXT NOT NULL,      -- 학원 ID
  title TEXT NOT NULL,           -- 랜딩페이지 제목
  content TEXT,                  -- 내용
  slug TEXT UNIQUE,              -- URL 슬러그
  status TEXT DEFAULT 'draft',   -- 상태 (draft/published)
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT,
  publishedAt TEXT
);
```

**인덱스:**
- `idx_landing_pages_academyId` (학원별 조회)
- `idx_landing_pages_createdAt` (날짜 필터링)
- `idx_landing_pages_status` (상태별 조회)

---

### 3️⃣ usage_logs 테이블 생성

**API 호출:**
```bash
curl -X POST https://superplace-academy.pages.dev/api/subscription/create-usage-table
```

**테이블 스키마:**
```sql
CREATE TABLE usage_logs (
  id TEXT PRIMARY KEY,
  userId INTEGER NOT NULL,
  type TEXT NOT NULL,           -- 'ai_analysis' 또는 'similar_problem'
  metadata TEXT,                -- 추가 메타데이터 (JSON)
  createdAt TEXT DEFAULT (datetime('now'))
);
```

**인덱스:**
- `idx_usage_logs_userId` (사용자별 조회)
- `idx_usage_logs_type` (타입별 조회)
- `idx_usage_logs_createdAt` (날짜 필터링)
- `idx_usage_logs_type_userId` (복합 인덱스, 조회 성능 최적화)

---

## 🚀 통합 테이블 생성 API

**한 번에 모든 테이블 생성:**
```bash
curl -X POST https://superplace-academy.pages.dev/api/subscription/init-tables
```

**응답 예시:**
```json
{
  "success": true,
  "message": "테이블 초기화 완료",
  "timestamp": "2026-03-07T10:30:00.000Z",
  "tables": {
    "homework_submissions": {
      "created": true,
      "exists": true,
      "currentCount": 0,
      "message": "homework_submissions 테이블 생성 완료"
    },
    "landing_pages": {
      "created": true,
      "exists": true,
      "currentCount": 0,
      "message": "landing_pages 테이블 생성 완료"
    },
    "usage_logs": {
      "created": true,
      "exists": true,
      "currentCount": 0,
      "message": "usage_logs 테이블 생성 완료"
    },
    "all_tables": [
      "User",
      "homework_submissions",
      "landing_pages",
      "usage_logs",
      "user_subscriptions",
      ...
    ]
  }
}
```

---

## 📊 테이블 생성 순서 (권장)

### 방법 1: 통합 API 사용 (권장)
```bash
# 한 번에 모든 테이블 생성
curl -X POST https://superplace-academy.pages.dev/api/subscription/init-tables
```

### 방법 2: 개별 API 사용
```bash
# 1. homework_submissions 생성
curl -X POST https://superplace-academy.pages.dev/api/subscription/create-homework-table

# 2. landing_pages 생성
curl -X POST https://superplace-academy.pages.dev/api/subscription/create-landing-table

# 3. usage_logs 생성
curl -X POST https://superplace-academy.pages.dev/api/subscription/create-usage-table
```

---

## ✅ 테이블 생성 확인

테이블이 제대로 생성되었는지 확인:
```bash
curl "https://superplace-academy.pages.dev/api/subscription/debug-count?academyId=1"
```

**예상 응답:**
```json
{
  "academyId": "1",
  "timestamp": "2026-03-07T...",
  "tables": {
    "homework_submissions": {
      "exists": true,
      "count": { "total": 0, "submitted": 0 }
    },
    "landing_pages": {
      "exists": true,
      "count": { "total": 0 }
    },
    "usage_logs": {
      "exists": true,
      "counts": []
    }
  }
}
```

---

## 🧪 테스트 데이터 추가

Cloudflare Dashboard → D1 Database → Console에서:

### homework_submissions 테스트 데이터
```sql
INSERT INTO homework_submissions (id, userId, submittedAt, gradedAt, score, feedback, subject, createdAt)
VALUES 
  ('hw_test_1', 1, datetime('now'), datetime('now'), 85, '잘했어요!', '수학', datetime('now')),
  ('hw_test_2', 2, datetime('now'), datetime('now'), 90, '완벽해요!', '영어', datetime('now')),
  ('hw_test_3', 3, datetime('now'), datetime('now'), 75, '조금 더 노력하세요', '과학', datetime('now'));
```

### landing_pages 테스트 데이터
```sql
INSERT INTO landing_pages (id, academyId, title, content, status, createdAt)
VALUES 
  ('lp_test_1', '1', '봄 특강 모집', '새학기 수학 특강 안내', 'published', datetime('now')),
  ('lp_test_2', '1', '여름방학 캠프', '여름방학 영어 캠프', 'published', datetime('now')),
  ('lp_test_3', '1', '가을 집중반', '가을학기 과학 집중반', 'draft', datetime('now'));
```

### usage_logs 테스트 데이터
```sql
INSERT INTO usage_logs (id, userId, type, createdAt)
VALUES 
  ('log_test_1', 1, 'ai_analysis', datetime('now')),
  ('log_test_2', 2, 'ai_analysis', datetime('now')),
  ('log_test_3', 3, 'similar_problem', datetime('now')),
  ('log_test_4', 1, 'similar_problem', datetime('now'));
```

---

## 🔍 문제 해결

### 에러: "no such column: user_id"
❌ **원인:** 컬럼 이름이 `user_id`가 아니라 `userId`입니다.

✅ **해결:** 위의 API들은 모두 `userId` (camelCase)를 사용합니다.

### 에러: "FOREIGN KEY constraint failed"
❌ **원인:** FOREIGN KEY 제약 조건이 있어서 참조하는 테이블이 없으면 실패합니다.

✅ **해결:** 새 API들은 FOREIGN KEY 제약 조건을 제거했습니다.

### 에러: "no such table"
❌ **원인:** 테이블이 아직 생성되지 않았습니다.

✅ **해결:** 위의 테이블 생성 API를 먼저 호출하세요.

---

## 📝 API 엔드포인트 요약

| API | 메서드 | URL | 설명 |
|-----|--------|-----|------|
| 통합 테이블 생성 | POST | `/api/subscription/init-tables` | 모든 테이블 한 번에 생성 |
| homework_submissions | POST | `/api/subscription/create-homework-table` | 숙제 제출 테이블 생성 |
| landing_pages | POST | `/api/subscription/create-landing-table` | 랜딩페이지 테이블 생성 |
| usage_logs | POST | `/api/subscription/create-usage-table` | 사용 로그 테이블 생성 |
| 디버그 정보 | GET | `/api/subscription/debug-count?academyId=1` | 테이블 및 데이터 확인 |
| 사용량 조회 | GET | `/api/subscription/check?academyId=1` | 구독 사용량 확인 |

---

## 🎯 완료 체크리스트

- [ ] 1️⃣ 테이블 생성 API 호출 완료
- [ ] 2️⃣ 테이블 생성 확인 (debug-count API)
- [ ] 3️⃣ 테스트 데이터 추가 (필요 시)
- [ ] 4️⃣ 사용량 조회 정상 작동 확인 (check API)
- [ ] 5️⃣ 설정 페이지에서 카운트 정상 표시 확인

완료되면 **설정 페이지**에서 숙제 검사, 랜딩페이지 수가 정확하게 표시됩니다! 🎉
