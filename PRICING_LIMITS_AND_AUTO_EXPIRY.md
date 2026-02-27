# 요금제 제한 필드 추가 및 자동 만료 완료 ✅

## 📋 완료된 작업

### 1. ✅ 요금제 관리 페이지에 모든 제한 필드 추가
**위치**: `/dashboard/admin/pricing`

#### 추가된 입력 필드 (8개)
1. **최대 학생 수** (`maxStudents`)
   - 기본값: 10
   - -1 입력 시 무제한

2. **최대 선생님 수** (`maxTeachers`)
   - 기본값: 2
   - -1 입력 시 무제한

3. **월별 숙제 검사 횟수** (`maxHomeworkChecks`)
   - 기본값: 100
   - -1 입력 시 무제한

4. **월별 AI 채점 횟수** (`maxAIGrading`)
   - 기본값: 100
   - -1 입력 시 무제한

5. **월별 역량 분석 횟수** (`maxCapabilityAnalysis`)
   - 기본값: 50
   - -1 입력 시 무제한

6. **월별 개념 분석 횟수** (`maxConceptAnalysis`)
   - 기본값: 50
   - -1 입력 시 무제한

7. **월별 유사문제 생성** (`maxSimilarProblems`)
   - 기본값: 100
   - -1 입력 시 무제한

8. **랜딩페이지 제작 수** (`maxLandingPages`)
   - 기본값: 3
   - -1 입력 시 무제한

---

### 2. ✅ 입력한 제한 값이 실제 적용됨

#### 플랜 생성/수정 → 구독 승인 → 제한 적용 플로우

**Step 1: 관리자가 플랜 생성**
```
관리자 대시보드 → 요금제 관리 → 새 요금제 추가
→ 모든 제한 필드 입력 (예: 학생 50명, 선생님 10명, AI 채점 200회)
→ 저장
```

**Step 2: 사용자가 플랜 신청**
```
/pricing 페이지 → 플랜 선택 → 계좌이체
→ 하나은행 746-910023-17004 입금
```

**Step 3: 관리자가 입금 승인**
```
관리자 대시보드 → 결제 승인 → 해당 신청 승인
→ user_subscriptions 테이블에 자동 생성
→ 관리자가 설정한 모든 제한 값이 자동으로 적용됨
```

**Step 4: 사용자가 기능 사용**
```
학생 추가 시도
→ 현재 학생 수가 제한(50명)보다 적으면: 추가 성공
→ 현재 학생 수가 제한(50명)에 도달: "제한 초과" 메시지, 접근 차단
```

#### 실제 적용 예시
| 플랜 | 학생 수 | 선생님 수 | AI 채점 | 역량 분석 | 개념 분석 |
|------|---------|-----------|---------|-----------|-----------|
| 무료 | 5 | 2 | 10 | 5 | 5 |
| 스타터 | 30 | 5 | 100 | 50 | 50 |
| 프로 | 100 | 15 | 500 | 200 | 200 |
| 엔터프라이즈 | -1 (무제한) | -1 | -1 | -1 | -1 |

---

### 3. ✅ 구독 자동 만료 기능

#### 크론잡 생성
**파일**: `/functions/api/subscription/expire-cron.ts`

#### 동작 방식
1. **매일 자정 자동 실행** (Cloudflare Cron Trigger)
2. `user_subscriptions` 테이블에서 `endDate < now()` 조회
3. 만료된 구독의 `status`를 `'expired'`로 자동 변경
4. 로그 기록 및 결과 반환

#### 만료 플로우
```
2024-01-01: 1개월 플랜 시작 (endDate = 2024-02-01)
  ↓
2024-02-01 00:00: 크론잡 실행
  ↓
status = 'active' → 'expired' 자동 변경
  ↓
사용자가 기능 사용 시도
  ↓
"구독이 만료되었습니다" 메시지 → /pricing 안내
```

#### Cloudflare 설정 방법
`wrangler.toml` 파일에 추가:
```toml
[triggers]
crons = ["0 0 * * *"]  # 매일 자정 (UTC)
```

또는 Cloudflare Dashboard에서 설정:
```
Workers & Pages → superplace → Triggers → Add Cron Trigger
→ Schedule: "0 0 * * *"
```

#### 수동 실행 테스트
```bash
# API 호출로 테스트
curl https://superplacestudy.pages.dev/api/subscription/expire-cron
```

응답 예시:
```json
{
  "success": true,
  "message": "3개 구독이 만료되었습니다.",
  "expiredCount": 3,
  "logs": [
    "🕐 구독 만료 체크 시작: 2024-02-01T00:00:00.000Z",
    "📊 만료된 구독: 3개",
    "✅ 구독 만료 처리: userId=user-123, plan=스타터, endDate=2024-01-31",
    "✅ 총 3개 구독 만료 처리 완료"
  ]
}
```

---

### 4. ✅ 1개월 플랜 → 1개월 후 자동 취소

#### 구독 기간 계산 로직
**파일**: `/functions/api/admin/subscription-approvals.ts` (Line 92-101)

```typescript
const startDate = new Date();
const endDate = new Date(startDate);

const periodMap = {
  '1month': 1,
  '6months': 6,
  '12months': 12
};

endDate.setMonth(endDate.getMonth() + (periodMap[requestData.period] || 1));
```

#### 실제 동작
1. **1개월 플랜 선택 & 승인**
   - startDate: 2024-01-01
   - endDate: 2024-02-01
   - status: 'active'

2. **2024-02-01 자정 크론잡 실행**
   - 만료 조건: `datetime('2024-02-01') < datetime('now')`
   - 결과: status → 'expired'

3. **2024-02-01 이후 사용자 접근**
   - 구독 체크 → status = 'expired'
   - 에러: "구독이 만료되었습니다. 요금제를 갱신해주세요."
   - 리다이렉트: `/pricing`

---

## 🗂️ 수정된 파일

### 1. 프론트엔드
- **`src/app/dashboard/admin/pricing/page.tsx`**
  - 8개 제한 필드 추가 (입력 폼)
  - API 호출 시 `/api/admin/pricing-plans` 사용
  - payload 구조 변경 (pricing, limits 객체 분리)

### 2. 백엔드 API
- **`functions/api/subscription/expire-cron.ts`** (신규)
  - 구독 자동 만료 크론잡
  - 매일 자정 실행
  - 만료된 구독 status 변경

---

## 🚀 배포 및 테스트

### 1. 코드 배포
- **커밋**: `74e74a0`
- **GitHub**: https://github.com/kohsunwoo12345-cmyk/superplace
- **라이브**: https://superplacestudy.pages.dev
- **자동 배포**: 2-3분 소요

### 2. 크론잡 설정 (Cloudflare Dashboard)
```
1. https://dash.cloudflare.com 접속
2. Workers & Pages → superplace 선택
3. Settings → Triggers → Cron Triggers
4. "Add Cron Trigger" 클릭
5. Schedule 입력: 0 0 * * *
6. "Add Trigger" 저장
```

### 3. 테스트 시나리오

#### 테스트 1: 제한 필드 입력 테스트
1. 관리자로 로그인
2. `/dashboard/admin/pricing` 접속
3. "새 요금제 추가" 클릭
4. 모든 필드 입력:
   ```
   이름: 테스트 플랜
   월간 가격: 50000
   학생 수: 20
   선생님 수: 5
   숙제 검사: 200
   AI 채점: 150
   역량 분석: 80
   개념 분석: 80
   유사문제: 150
   랜딩페이지: 5
   ```
5. 저장 후 데이터베이스 확인:
   ```sql
   SELECT * FROM pricing_plans WHERE name = '테스트 플랜';
   ```

#### 테스트 2: 제한 값 적용 테스트
1. 위에서 만든 플랜으로 구독 신청
2. 관리자가 승인
3. 데이터베이스 확인:
   ```sql
   SELECT 
     max_students, max_teachers, max_homework_checks,
     max_ai_grading, max_capability_analysis, max_concept_analysis
   FROM user_subscriptions 
   WHERE userId = 'user-id';
   ```
4. 학생 20명 추가 시도
5. 21번째 학생 추가 시: "제한 초과" 메시지 확인

#### 테스트 3: 자동 만료 테스트
1. 1개월 플랜 구독 생성 (수동으로 endDate를 과거로 설정)
   ```sql
   UPDATE user_subscriptions 
   SET endDate = datetime('now', '-1 day')
   WHERE id = 'sub-test';
   ```
2. 크론잡 API 수동 실행:
   ```bash
   curl https://superplacestudy.pages.dev/api/subscription/expire-cron
   ```
3. 응답에서 만료 처리 확인
4. 데이터베이스에서 status 확인:
   ```sql
   SELECT id, status, endDate FROM user_subscriptions WHERE id = 'sub-test';
   ```
   → status = 'expired' 확인

#### 테스트 4: 무제한 플랜 테스트
1. 엔터프라이즈 플랜 생성 (모든 제한 -1로 설정)
2. 구독 승인
3. 학생 100명 추가 → 성공
4. 선생님 50명 추가 → 성공
5. 제한 없이 모든 기능 사용 가능 확인

---

## 📊 데이터베이스 구조

### pricing_plans 테이블 (업데이트됨)
```sql
-- 기존 필드
id, name, description
price_1month, price_6months, price_12months

-- 제한 필드 (모두 INTEGER)
max_students              -- 학생 수
max_teachers              -- 선생님 수
max_homework_checks       -- 숙제 검사
max_ai_grading            -- AI 채점 ⭐
max_capability_analysis   -- 역량 분석 ⭐
max_concept_analysis      -- 개념 분석 ⭐
max_similar_problems      -- 유사문제
max_landing_pages         -- 랜딩페이지

-- 메타 정보
features (TEXT/JSON)
isPopular, color, order, isActive
createdAt, updatedAt
```

### user_subscriptions 테이블 (업데이트됨)
```sql
-- 기본 정보
id, userId, planId, planName, period
status ('active' | 'expired' | 'cancelled')
startDate, endDate

-- 현재 사용량 (매월 리셋)
current_students
current_teachers
current_homework_checks
current_ai_grading           ⭐
current_capability_analysis  ⭐
current_concept_analysis     ⭐
current_similar_problems
current_landing_pages

-- 제한 (플랜에서 복사됨)
max_students
max_teachers
max_homework_checks
max_ai_grading               ⭐
max_capability_analysis      ⭐
max_concept_analysis         ⭐
max_similar_problems
max_landing_pages

-- 기타
lastPaymentAmount, lastPaymentDate
autoRenew, lastResetDate
createdAt, updatedAt
```

---

## 🔧 주요 로직

### 1. 플랜 생성 시 제한 적용
```typescript
// 관리자가 플랜 생성
const payload = {
  name: "스타터",
  limits: {
    maxStudents: 30,
    maxTeachers: 5,
    maxAIGrading: 100,
    maxCapabilityAnalysis: 50,
    maxConceptAnalysis: 50,
    // ...
  }
};

// pricing_plans 테이블에 저장
INSERT INTO pricing_plans (...) VALUES (...);
```

### 2. 구독 승인 시 제한 복사
```typescript
// 플랜 정보 조회
const plan = await DB.prepare(`SELECT * FROM pricing_plans WHERE id = ?`).first();

// user_subscriptions에 제한 복사
INSERT INTO user_subscriptions (
  ...,
  max_students, max_teachers, max_ai_grading, 
  max_capability_analysis, max_concept_analysis, ...
) VALUES (
  ...,
  plan.max_students, plan.max_teachers, plan.max_ai_grading,
  plan.max_capability_analysis, plan.max_concept_analysis, ...
);
```

### 3. 사용 시 제한 체크
```typescript
// 학생 추가 시
const sub = await DB.prepare(`SELECT * FROM user_subscriptions WHERE ...`).first();
const current = sub.current_students;
const max = sub.max_students;

if (max !== -1 && current >= max) {
  // 제한 초과
  return error("학생 수 제한 초과");
}

// 사용량 증가
UPDATE user_subscriptions SET current_students = current_students + 1 WHERE id = ?;
```

### 4. 자동 만료
```typescript
// 매일 자정 실행
const expired = await DB.prepare(`
  SELECT * FROM user_subscriptions 
  WHERE status = 'active' AND datetime(endDate) < datetime('now')
`).all();

// 만료 처리
for (const sub of expired.results) {
  UPDATE user_subscriptions SET status = 'expired' WHERE id = sub.id;
}
```

---

## ✅ 완료 체크리스트

| 항목 | 상태 | 비고 |
|------|------|------|
| 제한 필드 8개 추가 | ✅ | 관리자 페이지에서 입력 가능 |
| 입력한 값 실제 적용 | ✅ | 구독 승인 시 자동 적용 |
| 사용 시 제한 체크 | ✅ | 학생/선생님 추가 시 동작 |
| 자동 만료 크론잡 | ✅ | 매일 자정 실행 |
| 1개월 후 자동 취소 | ✅ | endDate 기반 자동 처리 |
| -1 = 무제한 처리 | ✅ | 모든 필드에 적용 |

---

## 📝 추가 정보

### 크론잡 실행 시간
- **UTC 기준 00:00** (한국 시간 09:00)
- 필요시 시간 조정 가능: `0 15 * * *` (한국 자정)

### 무제한 플랜 설정
모든 제한 필드에 `-1` 입력

### 주의사항
1. 크론잡은 Cloudflare Dashboard에서 수동 설정 필요
2. 기존 구독은 migration SQL로 제한 추가 필요
3. 매월 사용량 리셋은 별도 크론잡 추가 가능

---

**작성일**: 2026-02-27  
**커밋**: 74e74a0  
**상태**: ✅ 완료 및 배포됨
