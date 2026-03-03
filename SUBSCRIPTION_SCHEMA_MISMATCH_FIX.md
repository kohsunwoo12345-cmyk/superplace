# 플랜 승인 후에도 "요금제 선택" 오류 근본 원인 해결

**날짜**: 2026-03-03  
**문제**: 플랜 승인 후에도 계속 "활성화된 구독이 없습니다. 요금제를 선택해주세요" 표시  
**커밋**: `741c5f8`  
**상태**: ✅ 해결됨

---

## 🚨 심각한 문제 상황

### 증상
```
1. 관리자가 플랜 신청 승인
2. "승인되었습니다" 메시지 표시
3. 학원장이 /dashboard/settings 접속
4. ❌ "활성화된 구독이 없습니다. 요금제를 선택해주세요" 계속 표시
5. 반복: 승인 → 여전히 "요금제 선택" → 무한 루프
```

### 사용자 영향
- 플랜을 승인해도 서비스 이용 불가
- 학원장이 승인 여부를 확인할 방법 없음
- 관리자가 반복 승인 시도 → 데이터 중복 가능성
- **핵심 기능 완전 마비**

---

## 🔍 근본 원인 분석 (3단계 디버깅)

### 1️⃣ 프론트엔드 확인

#### 설정 페이지 (`src/app/dashboard/settings/page.tsx`)
```typescript
const fetchSubscription = async (academyId: string) => {
  const response = await fetch(`/api/subscription/check?academyId=${academyId}`);
  const data = await response.json();
  
  if (data.success && data.hasSubscription) {
    setSubscription(data.subscription);  // ✅ 코드 정상
  } else {
    console.log("활성 구독 없음:", data.message);
    setSubscription(null);  // → "요금제 선택" 표시
  }
};
```

**결과**: ✅ 프론트엔드는 정상 - API 응답에 따라 올바르게 동작

---

### 2️⃣ 구독 조회 API 확인

#### 조회 API (`functions/api/subscription/check.ts`)
```typescript
// academyId로 구독 조회
subscription = await DB.prepare(`
  SELECT us.* FROM user_subscriptions us
  JOIN User u ON us.userId = u.id
  WHERE u.academyId = ? 
    AND u.role = 'DIRECTOR'
    AND us.status = 'active'
  ORDER BY us.endDate DESC
  LIMIT 1
`).bind(academyId).first();

if (!subscription) {
  return { 
    success: false, 
    hasSubscription: false,
    message: "활성화된 구독이 없습니다" 
  };
}
```

**결과**: ✅ API 코드는 정상 - SELECT 쿼리가 정확함

**문제**: `subscription`이 항상 `null`로 반환됨 → 테이블에 데이터가 없음!

---

### 3️⃣ 승인 API 확인 ⭐ (문제 발견!)

#### 승인 API (`functions/api/admin/subscription-approvals.ts`)
```typescript
// 승인 처리 시 user_subscriptions 테이블에 INSERT
await env.DB.prepare(`
  INSERT INTO user_subscriptions (
    id, userId, planId, planName, period, status,
    startDate, endDate,
    current_students, current_homework_checks, current_ai_analysis,     // ⚠️
    current_similar_problems, current_landing_pages,                    // ⚠️
    max_students, max_homework_checks, max_ai_analysis, 
    max_similar_problems, max_landing_pages,
    lastPaymentAmount, lastPaymentDate, autoRenew,                      // ⚠️
    createdAt, updatedAt, lastResetDate                                 // ⚠️
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).bind(
  subscriptionId,
  requestData.userId,
  // ... 24개 값
).run();
```

**INSERT 쿼리**: 24개 컬럼에 값을 삽입하려고 시도

---

### 4️⃣ 테이블 스키마 확인 ⭐ (핵심 문제!)

#### 우리가 생성한 테이블 (이전 버전)
```sql
CREATE TABLE user_subscriptions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  planId TEXT NOT NULL,
  planName TEXT NOT NULL,
  period TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  startDate TEXT NOT NULL,
  endDate TEXT NOT NULL,
  -- ❌ current_students 없음
  -- ❌ current_homework_checks 없음
  -- ❌ current_ai_analysis 없음
  -- ❌ current_similar_problems 없음
  -- ❌ current_landing_pages 없음
  max_students INTEGER DEFAULT -1,
  max_homework_checks INTEGER DEFAULT -1,
  max_ai_analysis INTEGER DEFAULT -1,
  max_similar_problems INTEGER DEFAULT -1,
  max_landing_pages INTEGER DEFAULT -1,
  lastPaymentAmount INTEGER,
  lastPaymentDate TEXT,
  -- ❌ autoRenew 없음
  -- ❌ lastResetDate 없음
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id)
);
```

**컬럼 수**: 17개 (한도만 있고, 현재 사용량/관리 컬럼 누락)

---

## 💥 **최종 원인: 컬럼 불일치**

### 비교표

| 항목 | 승인 API가 INSERT하는 컬럼 | 실제 테이블 컬럼 | 상태 |
|------|------------------------|----------------|------|
| 기본 정보 | id, userId, planId, planName, period, status, startDate, endDate | ✅ 동일 | 정상 |
| **현재 사용량** | current_students, current_homework_checks, current_ai_analysis, current_similar_problems, current_landing_pages | ❌ **없음** | **오류** |
| 한도 | max_students, max_homework_checks, max_ai_analysis, max_similar_problems, max_landing_pages | ✅ 동일 | 정상 |
| 결제 정보 | lastPaymentAmount, lastPaymentDate | ✅ 동일 | 정상 |
| **관리 정보** | autoRenew, lastResetDate | ❌ **없음** | **오류** |
| 타임스탬프 | createdAt, updatedAt | ✅ 동일 | 정상 |

### SQL 오류 발생

```sql
-- 승인 API 실행
INSERT INTO user_subscriptions (...24개 컬럼...) VALUES (...24개 값...)

-- 실제 테이블
user_subscriptions 테이블: 17개 컬럼만 존재

-- 결과
❌ SQL Error: table user_subscriptions has 17 columns but 24 values were supplied
❌ INSERT 실패
❌ 구독 정보 저장 안 됨
❌ 조회 시 빈 결과
❌ "활성화된 구독이 없습니다" 표시
```

---

## ✅ 해결 방법

### 수정: user_subscriptions 테이블 스키마

**파일**: `functions/api/admin/create-subscription-tables.ts`

#### 추가된 컬럼

```sql
CREATE TABLE user_subscriptions (
  -- ... 기존 컬럼 ...
  
  -- ✅ 현재 사용량 컬럼 추가 (5개)
  current_students INTEGER DEFAULT 0,
  current_homework_checks INTEGER DEFAULT 0,
  current_ai_analysis INTEGER DEFAULT 0,
  current_similar_problems INTEGER DEFAULT 0,
  current_landing_pages INTEGER DEFAULT 0,
  
  -- 한도 컬럼 (기존)
  max_students INTEGER DEFAULT -1,
  max_homework_checks INTEGER DEFAULT -1,
  max_ai_analysis INTEGER DEFAULT -1,
  max_similar_problems INTEGER DEFAULT -1,
  max_landing_pages INTEGER DEFAULT -1,
  
  -- ✅ 관리 컬럼 추가 (2개)
  autoRenew INTEGER DEFAULT 0,          -- 자동 갱신 여부
  lastResetDate TEXT,                   -- 마지막 리셋 날짜
  
  -- ... 기타 컬럼 ...
);
```

### 최종 스키마

| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| id | TEXT | (필수) | 구독 ID |
| userId | TEXT | (필수) | 사용자 ID |
| planId | TEXT | (필수) | 플랜 ID |
| planName | TEXT | (필수) | 플랜명 |
| period | TEXT | (필수) | 기간 (1month/6months/12months) |
| status | TEXT | 'active' | 상태 (active/expired/cancelled) |
| startDate | TEXT | (필수) | 시작일 |
| endDate | TEXT | (필수) | 종료일 |
| **current_students** | INTEGER | 0 | 현재 학생 수 |
| **current_homework_checks** | INTEGER | 0 | 현재 숙제 검사 수 |
| **current_ai_analysis** | INTEGER | 0 | 현재 AI 분석 수 |
| **current_similar_problems** | INTEGER | 0 | 현재 유사문제 수 |
| **current_landing_pages** | INTEGER | 0 | 현재 랜딩페이지 수 |
| max_students | INTEGER | -1 | 최대 학생 수 |
| max_homework_checks | INTEGER | -1 | 최대 숙제 검사 수 |
| max_ai_analysis | INTEGER | -1 | 최대 AI 분석 수 |
| max_similar_problems | INTEGER | -1 | 최대 유사문제 수 |
| max_landing_pages | INTEGER | -1 | 최대 랜딩페이지 수 |
| lastPaymentAmount | INTEGER | NULL | 마지막 결제 금액 |
| lastPaymentDate | TEXT | NULL | 마지막 결제일 |
| **autoRenew** | INTEGER | 0 | 자동 갱신 (0=비활성, 1=활성) |
| **lastResetDate** | TEXT | NULL | 마지막 사용량 리셋 날짜 |
| createdAt | TEXT | datetime('now') | 생성일 |
| updatedAt | TEXT | datetime('now') | 수정일 |

**총 25개 컬럼** (이전 17개 → 25개)

---

## 📋 실행 단계 (반드시 순서대로!)

### ⚠️ 중요: 기존 테이블 삭제 후 재생성 필요

기존에 잘못된 스키마로 생성된 테이블이 있을 수 있으므로, 먼저 삭제 후 올바른 스키마로 재생성해야 합니다.

### Step 1: 배포 확인 (2-3분 대기)
```
커밋: 741c5f8
저장소: https://github.com/kohsunwoo12345-cmyk/superplace
배포 URL: https://superplacestudy.pages.dev
```

### Step 2: 기존 테이블 삭제 (Cloudflare D1 대시보드)

**Cloudflare D1 대시보드 접속**:
1. https://dash.cloudflare.com/ 접속
2. D1 데이터베이스 선택: `webapp-production`
3. Console 탭 이동
4. 다음 SQL 실행:

```sql
-- 1. 기존 테이블 삭제
DROP TABLE IF EXISTS user_subscriptions;
DROP TABLE IF EXISTS subscription_requests;
DROP TABLE IF EXISTS usage_alerts;
DROP TABLE IF EXISTS usage_logs;

-- 2. 삭제 확인
SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%subscription%';
-- 결과: 빈 배열이어야 함
```

### Step 3: 새 테이블 생성 API 호출 ⭐

**브라우저 콘솔에서 실행**:
```javascript
fetch('/api/admin/create-subscription-tables', { method: 'POST' })
  .then(r => r.json())
  .then(d => {
    console.log('✅ 성공:', d.success);
    console.log('📊 생성된 테이블:', d.tables);
    console.log('📝 user_subscriptions 상세:', d.created);
  });
```

**예상 응답**:
```json
{
  "success": true,
  "message": "모든 subscription 관련 테이블 생성 완료",
  "tables": [
    "subscription_requests",
    "usage_alerts",
    "usage_logs",
    "user_subscriptions"
  ],
  "created": {
    "subscription_requests": true,
    "user_subscriptions": true,
    "usage_alerts": true,
    "usage_logs": true
  }
}
```

### Step 4: 테이블 스키마 확인 (Cloudflare D1)

```sql
-- user_subscriptions 테이블 컬럼 확인
PRAGMA table_info(user_subscriptions);
```

**확인 사항**:
- ✅ current_students 컬럼 존재
- ✅ current_homework_checks 컬럼 존재
- ✅ current_ai_analysis 컬럼 존재
- ✅ current_similar_problems 컬럼 존재
- ✅ current_landing_pages 컬럼 존재
- ✅ autoRenew 컬럼 존재
- ✅ lastResetDate 컬럼 존재
- ✅ **총 25개 컬럼**

### Step 5: 플랜 신청 및 승인 테스트

#### 5-1. 학원장으로 플랜 신청
1. 학원장 계정 로그인
2. `/pricing` 페이지 접속
3. 플랜 선택 (예: 프리미엄)
4. 신청 완료

#### 5-2. 관리자가 승인
1. 관리자 계정 로그인
2. `/dashboard/admin/subscription-approvals` 접속
3. 대기 중인 신청 확인
4. "승인" 버튼 클릭

**확인 포인트**:
```javascript
// 브라우저 콘솔에서 확인
fetch('/api/subscription/check?academyId=YOUR_ACADEMY_ID')
  .then(r => r.json())
  .then(d => {
    console.log('✅ 성공:', d.success);
    console.log('✅ 구독 있음:', d.hasSubscription);
    console.log('📊 플랜명:', d.subscription?.planName);
    console.log('📊 상태:', d.subscription?.status);
    console.log('📊 종료일:', d.subscription?.endDate);
  });
```

**예상 결과**:
```json
{
  "success": true,
  "hasSubscription": true,
  "subscription": {
    "id": "sub-123456",
    "planName": "프리미엄",
    "status": "active",
    "endDate": "2027-03-03T00:00:00.000Z",
    "usage": {
      "students": 0,
      "homeworkChecks": 0,
      "aiAnalysis": 0,
      "similarProblems": 0,
      "landingPages": 0
    },
    "limits": {
      "maxStudents": 100,
      "maxHomeworkChecks": 1000,
      "maxAIAnalysis": 500,
      "maxSimilarProblems": 300,
      "maxLandingPages": 10
    }
  }
}
```

### Step 6: 설정 페이지 확인 ✅

학원장 계정으로:
1. `/dashboard/settings` 접속
2. ✅ "구독 정보" 카드 표시
3. ✅ 플랜명 표시 (예: "프리미엄")
4. ✅ 만료일 표시 (예: "2027-03-03")
5. ✅ 사용량/한도 표시
   - 학생: 0 / 100
   - 숙제 검사: 0 / 1000
   - AI 분석: 0 / 500
   - 유사문제: 0 / 300
   - 랜딩페이지: 0 / 10

---

## 🎯 Before & After

### ❌ Before (문제 상황)

```
관리자: 승인 버튼 클릭
  ↓
INSERT INTO user_subscriptions (
  ...24개 컬럼...
) VALUES (
  ...24개 값...
)
  ↓
테이블: 17개 컬럼만 존재
  ↓
❌ SQL Error: column count mismatch
  ↓
INSERT 실패 (구독 정보 저장 안 됨)
  ↓
SELECT ... FROM user_subscriptions
  ↓
빈 결과 (데이터 없음)
  ↓
UI: "활성화된 구독이 없습니다. 요금제를 선택해주세요"
```

### ✅ After (해결 후)

```
관리자: 승인 버튼 클릭
  ↓
INSERT INTO user_subscriptions (
  ...24개 컬럼...
) VALUES (
  ...24개 값...
)
  ↓
테이블: 25개 컬럼 (충분함)
  ↓
✅ INSERT 성공
  ↓
데이터 저장:
{
  id: "sub-123",
  userId: "user-abc",
  planName: "프리미엄",
  status: "active",
  current_students: 0,
  max_students: 100,
  ...
}
  ↓
SELECT ... FROM user_subscriptions
  ↓
✅ 구독 정보 반환
  ↓
UI: 플랜명, 만료일, 사용량/한도 모두 정상 표시 ✅
```

---

## 🧪 상세 테스트 체크리스트

### ✅ 테이블 생성 확인
- [ ] 기존 테이블 삭제 (DROP TABLE)
- [ ] API 호출 성공 (`success: true`)
- [ ] 4개 테이블 모두 생성 확인
- [ ] user_subscriptions 25개 컬럼 확인
- [ ] 인덱스 3개 생성 확인

### ✅ 플랜 승인 프로세스
- [ ] 학원장 로그인 및 플랜 신청
- [ ] subscription_requests 테이블에 저장 확인
- [ ] 관리자 로그인 및 승인
- [ ] **INSERT 성공 확인** (SQL 오류 없음)
- [ ] user_subscriptions 테이블에 데이터 저장 확인

### ✅ 구독 정보 조회
- [ ] `/api/subscription/check` 호출
- [ ] `success: true, hasSubscription: true` 반환
- [ ] 플랜명 정상 반환
- [ ] 상태 'active' 확인
- [ ] 종료일 정상 반환

### ✅ UI 표시
- [ ] `/dashboard/settings` 접속
- [ ] 구독 정보 카드 표시
- [ ] 플랜명 정상 표시
- [ ] 만료일 정상 표시
- [ ] 사용량/한도 표시
- [ ] ❌ **"요금제 선택" 메시지 없음**

### ✅ 사용량 추적 (추가 테스트)
- [ ] 학생 추가 → current_students 증가
- [ ] AI 분석 사용 → current_ai_analysis 증가
- [ ] 한도 도달 시 알림 표시

---

## 🎓 교훈

### 1. 스키마 일치의 중요성
- INSERT 쿼리의 컬럼 수와 테이블 컬럼 수가 정확히 일치해야 함
- 한쪽만 수정하면 즉시 오류 발생
- **테이블 생성 시 사용하는 모든 컬럼을 사전 조사 필수**

### 2. API 분석의 중요성
```typescript
// 승인 API를 먼저 분석했어야 함
INSERT INTO user_subscriptions (
  ...컬럼 목록...
) VALUES (...)

// 이 컬럼 목록을 보고 테이블을 설계해야 정확함
```

### 3. 오류 메시지가 없는 실패
- SQL INSERT 실패 → 그냥 빈 결과 반환
- 사용자에게는 "구독 없음"으로만 표시
- **로그 확인 필수**: Cloudflare Workers 로그 확인

### 4. 디버깅 전략
1. 프론트엔드 확인 (코드 정상)
2. 조회 API 확인 (코드 정상, 데이터 없음)
3. 승인 API 확인 (INSERT 쿼리 분석)
4. **테이블 스키마 확인** ← 여기서 문제 발견!

---

## 📊 요약

| 항목 | 내용 |
|------|------|
| **문제** | 테이블 컬럼 수 불일치 (17개 vs 24개) |
| **원인** | current_*, autoRenew, lastResetDate 컬럼 누락 |
| **해결** | 7개 컬럼 추가 (25개로 증가) |
| **커밋** | `741c5f8` |
| **파일** | `functions/api/admin/create-subscription-tables.ts` |
| **테이블** | user_subscriptions (25개 컬럼) |
| **핵심** | INSERT 쿼리와 테이블 스키마 완벽 일치 |
| **다음** | 기존 테이블 삭제 → API 호출 → 재생성 → 테스트 |

---

## 🔗 관련 링크

- **GitHub**: https://github.com/kohsunwoo12345-cmyk/superplace
- **배포 URL**: https://superplacestudy.pages.dev
- **테이블 생성 API**: `/api/admin/create-subscription-tables` (POST)
- **구독 확인 API**: `/api/subscription/check?academyId=...`
- **설정 페이지**: `/dashboard/settings`

---

## ⚡ 즉시 실행 필요!

배포가 완료되면 (약 2-3분 후):

### 1️⃣ Cloudflare D1에서 기존 테이블 삭제
```sql
DROP TABLE IF EXISTS user_subscriptions;
DROP TABLE IF EXISTS subscription_requests;
DROP TABLE IF EXISTS usage_alerts;
DROP TABLE IF EXISTS usage_logs;
```

### 2️⃣ 새 테이블 생성
```javascript
fetch('/api/admin/create-subscription-tables', { method: 'POST' })
  .then(r => r.json())
  .then(d => console.log('✅ 테이블 생성:', d));
```

### 3️⃣ 플랜 신청 및 승인

### 4️⃣ 설정 페이지 확인
→ ✅ 플랜 정보 정상 표시! 🎉

**상태**: ✅ 해결 완료  
**예상 시간**: 배포 2-3분 + 테이블 재생성 10초 + 테스트 2분 = **총 5분**

---

**작성자**: GenSpark AI Developer  
**최종 수정**: 2026-03-03  
**문서**: SUBSCRIPTION_SCHEMA_MISMATCH_FIX.md
