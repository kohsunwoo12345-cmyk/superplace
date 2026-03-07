# 🔴 사용량 한도 표시 문제 - 최종 진단 보고서

**작성일:** 2026-03-07  
**커밋:** `0222f382`

---

## 📊 현재 상태

### ✅ 정상 작동
- **학생 수 카운트**: 제대로 표시됨
- **정적 페이지**: 모두 정상 배포 (https://superplace-academy.pages.dev)
- **UI 컴포넌트**: 카카오 알림톡 미리보기 등 정상

### ❌ 문제 발생
- **숙제 검사**: 0으로 표시
- **AI 분석**: 0으로 표시
- **유사문제**: 0으로 표시
- **랜딩페이지 수**: 0으로 표시

---

## 🔍 근본 원인 분석

### 1️⃣ Cloudflare Functions가 배포되지 않음

**문제:**
```typescript
// next.config.ts
output: 'export'  // ← 정적 파일만 생성, Functions 미포함
```

**결과:**
- `/functions` 디렉토리의 모든 API가 404 Not Found
- `/api/subscription/check` → 404
- `/api/subscription/reset-all-tables` → 404
- `/test` → 404

**확인 방법:**
```bash
curl https://superplace-academy.pages.dev/test
# 응답: 404 Not Found
```

### 2️⃣ D1 데이터베이스 테이블 부재 또는 스키마 불일치

**의심되는 문제:**
- `homework_submissions` 테이블이 없거나 컬럼명이 다름 (user_id vs userId)
- `landing_pages` 테이블이 없거나 컬럼명이 다름 (academy_id vs academyId)
- `usage_logs` 테이블에 `subscriptionId` 컬럼 없음

**에러 메시지:**
```
D1_ERROR: no such column: user_id at offset 41: SQLITE_ERROR
NOT NULL constraint failed: usage_logs.subscriptionId: SQLITE_CONSTRAINT
```

---

## 🎯 해결 방법

### ⚠️ 중요: Cloudflare Functions는 현재 작동하지 않음

현재 `output: 'export'` 모드이기 때문에 **모든 데이터베이스 작업은 Cloudflare D1 Console에서 직접 SQL로 실행**해야 합니다.

---

## 📋 Cloudflare D1 Console에서 실행할 SQL

### 접속 방법:
1. https://dash.cloudflare.com 로그인
2. Workers & Pages → D1 선택
3. `webapp-production` 데이터베이스 선택
4. Console 탭

---

### SQL 1: 현재 테이블 목록 확인
```sql
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
```

---

### SQL 2: homework_submissions 테이블 생성
```sql
DROP TABLE IF EXISTS homework_submissions;

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
  submittedAt TEXT NOT NULL,
  gradedAt TEXT,
  createdAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_hw_userId ON homework_submissions(userId);
CREATE INDEX idx_hw_submittedAt ON homework_submissions(submittedAt);
```

---

### SQL 3: landing_pages 테이블 생성
```sql
DROP TABLE IF EXISTS landing_pages;

CREATE TABLE landing_pages (
  id TEXT PRIMARY KEY,
  academyId TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  slug TEXT UNIQUE,
  status TEXT DEFAULT 'draft',
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT,
  publishedAt TEXT
);

CREATE INDEX idx_lp_academyId ON landing_pages(academyId);
CREATE INDEX idx_lp_createdAt ON landing_pages(createdAt);
```

---

### SQL 4: usage_logs 테이블 생성
```sql
DROP TABLE IF EXISTS usage_logs;

CREATE TABLE usage_logs (
  id TEXT PRIMARY KEY,
  userId INTEGER NOT NULL,
  subscriptionId INTEGER,
  type TEXT NOT NULL,
  action TEXT,
  metadata TEXT,
  createdAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_ul_userId ON usage_logs(userId);
CREATE INDEX idx_ul_subscriptionId ON usage_logs(subscriptionId);
CREATE INDEX idx_ul_type ON usage_logs(type);
CREATE INDEX idx_ul_createdAt ON usage_logs(createdAt);
```

---

### SQL 5: 테스트 데이터 추가
```sql
-- 숙제 제출 테스트
INSERT INTO homework_submissions (id, userId, submittedAt, gradedAt, score, feedback, subject, createdAt)
VALUES 
  ('hw_test_1', 1, datetime('now'), datetime('now'), 85, '잘했어요!', '수학', datetime('now')),
  ('hw_test_2', 2, datetime('now'), datetime('now'), 90, '완벽해요!', '영어', datetime('now')),
  ('hw_test_3', 3, datetime('now'), datetime('now'), 75, '노력하세요', '과학', datetime('now'));

-- 랜딩페이지 테스트
INSERT INTO landing_pages (id, academyId, title, content, status, createdAt)
VALUES 
  ('lp_test_1', '1', '봄 특강 모집', '새학기 수학 특강', 'published', datetime('now')),
  ('lp_test_2', '1', '여름 캠프', '여름방학 영어 캠프', 'published', datetime('now'));

-- 사용 로그 테스트
INSERT INTO usage_logs (id, userId, subscriptionId, type, action, createdAt)
VALUES 
  ('log_test_1', 1, 1, 'ai_analysis', 'AI 약점 분석', datetime('now')),
  ('log_test_2', 2, 1, 'ai_analysis', 'AI 개념 분석', datetime('now')),
  ('log_test_3', 3, 1, 'similar_problem', '유사 문제 생성', datetime('now'));
```

---

### SQL 6: 데이터 확인
```sql
-- homework_submissions 확인
SELECT COUNT(*) as total, 
       COUNT(CASE WHEN submittedAt IS NOT NULL THEN 1 END) as submitted 
FROM homework_submissions;

-- landing_pages 확인
SELECT COUNT(*) FROM landing_pages;

-- usage_logs 확인
SELECT type, COUNT(*) as count FROM usage_logs GROUP BY type;
```

---

## 🔧 장기적 해결 방안

### 옵션 1: Cloudflare Functions 활성화 (권장)

**next.config.ts 수정:**
```typescript
const nextConfig: NextConfig = {
  // output: 'export',  // ← 이 줄 제거 또는 주석 처리
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // ... 나머지 동일
};
```

**장점:**
- Functions API가 작동함
- 동적 데이터 처리 가능

**단점:**
- Next.js 서버 사이드 렌더링 필요
- Cloudflare Pages 설정 변경 필요

---

### 옵션 2: D1 Console에서 직접 관리 (현재 방식)

**장점:**
- 즉시 사용 가능
- 코드 변경 불필요

**단점:**
- 모든 데이터베이스 작업을 수동으로 해야 함
- API를 통한 자동화 불가능

---

## ✅ 실행 체크리스트

위의 SQL을 순서대로 Cloudflare D1 Console에서 실행하면:

- [ ] 1. 테이블 목록 확인
- [ ] 2. homework_submissions 테이블 생성
- [ ] 3. landing_pages 테이블 생성
- [ ] 4. usage_logs 테이블 생성
- [ ] 5. 테스트 데이터 추가
- [ ] 6. 데이터 확인

완료 후:
- [ ] 7. 설정 페이지에서 카운트 확인 (/dashboard/settings)
- [ ] 8. 숙제 검사 수 표시 확인
- [ ] 9. 랜딩페이지 수 표시 확인
- [ ] 10. AI 분석, 유사문제 수 표시 확인

---

## 📝 최종 결론

**현재 상태:**
- Cloudflare Functions가 배포되지 않아 API를 통한 데이터베이스 작업 불가능
- 모든 데이터베이스 작업은 D1 Console에서 직접 SQL 실행 필요

**즉시 해결:**
- 위의 SQL을 D1 Console에서 실행하여 테이블 생성 및 테스트 데이터 추가

**장기 해결:**
- `output: 'export'` 제거하고 Functions 활성화
- 또는 현재 방식 유지 (수동 SQL 관리)

---

**작성자:** Claude  
**최종 수정:** 2026-03-07
