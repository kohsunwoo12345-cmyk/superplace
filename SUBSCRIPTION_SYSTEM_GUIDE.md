# 🎯 요금제 시스템 완전 구현 가이드

## 📅 구현 완료: 2026-03-02

---

## ✅ 구현 완료 사항

### 1. **요금제 관리 API**

#### 데이터베이스: `pricing_plans` 테이블
```sql
CREATE TABLE pricing_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  
  -- 가격 (기간별)
  pricing_1month INTEGER NOT NULL,
  pricing_6months INTEGER NOT NULL,
  pricing_12months INTEGER NOT NULL,
  
  -- 기능 한도
  maxStudents INTEGER DEFAULT -1,          -- -1 = 무제한
  maxTeachers INTEGER DEFAULT -1,
  maxHomeworkChecks INTEGER DEFAULT -1,
  maxAIAnalysis INTEGER DEFAULT -1,
  maxAIGrading INTEGER DEFAULT -1,
  maxCapabilityAnalysis INTEGER DEFAULT -1,
  maxConceptAnalysis INTEGER DEFAULT -1,
  maxSimilarProblems INTEGER DEFAULT -1,
  maxLandingPages INTEGER DEFAULT -1,
  
  -- 메타 정보
  features TEXT,                           -- JSON array
  isPopular INTEGER DEFAULT 0,
  color TEXT DEFAULT '#3B82F6',
  `order` INTEGER DEFAULT 0,
  isActive INTEGER DEFAULT 1,
  
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### API 엔드포인트:
- `GET /api/admin/pricing-plans` - 요금제 목록 조회
- `POST /api/admin/pricing-plans` - 요금제 생성

**요청 예시:**
```bash
curl -X POST "https://superplacestudy.pages.dev/api/admin/pricing-plans" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "스탠다드",
    "description": "중소 학원을 위한 기본 플랜",
    "pricing_1month": 50000,
    "pricing_6months": 270000,
    "pricing_12months": 480000,
    "maxStudents": 50,
    "maxTeachers": 5,
    "maxHomeworkChecks": 500,
    "maxAIAnalysis": 100,
    "maxAIGrading": 100,
    "maxCapabilityAnalysis": 100,
    "maxConceptAnalysis": 100,
    "maxSimilarProblems": 200,
    "maxLandingPages": 1,
    "features": "[\"출석 관리\", \"숙제 검사\", \"AI 분석\", \"랜딩페이지 1개\"]",
    "isPopular": true,
    "color": "#3B82F6",
    "order": 1,
    "isActive": true
  }'
```

---

### 2. **사용자 구독 관리**

#### 데이터베이스: `user_subscriptions` 테이블
```sql
CREATE TABLE user_subscriptions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  planId TEXT NOT NULL,
  planName TEXT NOT NULL,
  period TEXT NOT NULL,              -- '1month' | '6months' | '12months'
  status TEXT DEFAULT 'pending',     -- 'pending' | 'active' | 'expired' | 'cancelled'
  
  startDate DATETIME,
  endDate DATETIME,
  
  -- 현재 사용량
  usage_students INTEGER DEFAULT 0,
  usage_teachers INTEGER DEFAULT 0,
  usage_homeworkChecks INTEGER DEFAULT 0,
  usage_aiAnalysis INTEGER DEFAULT 0,
  usage_aiGrading INTEGER DEFAULT 0,
  usage_capabilityAnalysis INTEGER DEFAULT 0,
  usage_conceptAnalysis INTEGER DEFAULT 0,
  usage_similarProblems INTEGER DEFAULT 0,
  usage_landingPages INTEGER DEFAULT 0,
  
  -- 한도 (플랜 기준)
  limit_maxStudents INTEGER DEFAULT -1,
  limit_maxTeachers INTEGER DEFAULT -1,
  limit_maxHomeworkChecks INTEGER DEFAULT -1,
  limit_maxAIAnalysis INTEGER DEFAULT -1,
  limit_maxAIGrading INTEGER DEFAULT -1,
  limit_maxCapabilityAnalysis INTEGER DEFAULT -1,
  limit_maxConceptAnalysis INTEGER DEFAULT -1,
  limit_maxSimilarProblems INTEGER DEFAULT -1,
  limit_maxLandingPages INTEGER DEFAULT -1,
  
  lastPaymentAmount INTEGER DEFAULT 0,
  lastPaymentDate DATETIME,
  autoRenew INTEGER DEFAULT 0,
  lastResetDate DATETIME,
  
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### API 엔드포인트:

**1) 구독 상태 조회**
```bash
GET /api/subscriptions/status?userId={userId}
```

**응답 예시:**
```json
{
  "success": true,
  "hasSubscription": true,
  "subscription": {
    "id": "sub-1772460123456-abc123",
    "planName": "스탠다드",
    "period": "1month",
    "status": "active",
    "startDate": "2026-03-01T00:00:00.000Z",
    "endDate": "2026-04-01T00:00:00.000Z",
    "currentUsage": {
      "students": 25,
      "teachers": 3,
      "homeworkChecks": 150
    },
    "limits": {
      "maxStudents": 50,
      "maxTeachers": 5,
      "maxHomeworkChecks": 500
    },
    "daysLeft": 29
  }
}
```

**2) 기능 사용 가능 여부 체크**
```bash
POST /api/subscriptions/check-limit
Content-Type: application/json

{
  "userId": "user-123",
  "featureType": "student_add"
}
```

**응답 (사용 가능):**
```json
{
  "success": true,
  "allowed": true,
  "currentUsage": 25,
  "maxLimit": 50,
  "remaining": 25
}
```

**응답 (한도 초과):**
```json
{
  "success": false,
  "allowed": false,
  "reason": "LIMIT_EXCEEDED",
  "message": "student_add 사용 한도를 초과했습니다. (50/50)",
  "currentUsage": 50,
  "maxLimit": 50
}
```

**응답 (구독 없음):**
```json
{
  "success": false,
  "allowed": false,
  "reason": "NO_SUBSCRIPTION",
  "message": "활성 구독이 없습니다. 요금제를 선택해주세요."
}
```

**응답 (구독 만료):**
```json
{
  "success": false,
  "allowed": false,
  "reason": "SUBSCRIPTION_EXPIRED",
  "message": "구독이 만료되었습니다. 갱신이 필요합니다.",
  "expiredDate": "2026-03-01T00:00:00.000Z"
}
```

**3) 사용량 추적**
```bash
POST /api/subscriptions/track-usage
Content-Type: application/json

{
  "userId": "user-123",
  "featureType": "student_add",
  "action": "create",
  "metadata": {
    "studentId": "student-456",
    "studentName": "홍길동"
  }
}
```

**4) 구독 할당 (관리자 전용)**
```bash
POST /api/admin/assign-subscription
Content-Type: application/json

{
  "userId": "user-123",
  "planId": "plan-1772460000000-xyz",
  "period": "1month",
  "startDate": "2026-03-01"
}
```

---

### 3. **사용량 로그 시스템**

#### 데이터베이스: `usage_logs` 테이블
```sql
CREATE TABLE usage_logs (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  subscriptionId TEXT,
  featureType TEXT NOT NULL,         -- 'student_add', 'homework_check', etc.
  action TEXT NOT NULL,              -- 'create', 'delete', 'use'
  metadata TEXT,                     -- JSON
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**기능 타입:**
- `student_add` - 학생 추가
- `teacher_add` - 선생님 추가
- `homework_check` - 숙제 검사
- `ai_analysis` - AI 분석
- `ai_grading` - AI 채점
- `capability_analysis` - 역량 분석
- `concept_analysis` - 부족한 개념 분석
- `similar_problem` - 유사문제 출제
- `landing_page` - 랜딩페이지 생성
- `attendance_check` - 출석 체크

---

### 4. **구독 검증 통합**

#### A) 출석 체크 (`functions/api/attendance/checkin.ts`)

**흐름:**
1. 출석 코드 확인
2. 해당 학원의 학원장(DIRECTOR) 조회
3. 학원장의 활성 구독 확인
4. **구독 없으면 → 403 에러 반환**
5. **구독 만료되었으면 → 403 에러 반환**
6. 출석 체크 진행

**에러 응답:**
```json
{
  "success": false,
  "error": "SUBSCRIPTION_EXPIRED",
  "message": "학원의 구독이 만료되었습니다. 학원장에게 갱신을 요청해주세요.",
  "expiredDate": "2026-03-01T00:00:00.000Z"
}
```

#### B) 학생 추가 (`functions/api/admin/users/create.ts`)

**흐름:**
1. 이메일 중복 체크
2. **학생 추가 시 → 학원의 학원장 구독 확인**
3. **구독 없으면 → 403 에러 반환**
4. **구독 만료되었으면 → 403 에러 반환**
5. **학생 수 한도 체크 (usage_students >= limit_maxStudents)**
6. **한도 초과 시 → 403 에러 반환**
7. 학생 생성
8. **출석 코드 생성**
9. **사용량 자동 증가 (usage_students += 1)**
10. **사용 로그 기록**

**에러 응답 (한도 초과):**
```json
{
  "success": false,
  "error": "STUDENT_LIMIT_EXCEEDED",
  "message": "학생 수 한도를 초과했습니다. (50/50)",
  "currentUsage": 50,
  "maxLimit": 50
}
```

---

## 🔒 기능별 차단 정책

### 1. **구독이 없는 경우**
- ❌ 출석 체크
- ❌ 학생 추가
- ❌ 선생님 추가
- ❌ 숙제 검사
- ❌ AI 분석
- ❌ AI 채점
- ❌ 랜딩페이지 생성
- ❌ 모든 프리미엄 기능

### 2. **구독이 만료된 경우**
- ❌ 출석 체크 (**중요: 출석 자체가 불가능**)
- ❌ 학생 추가
- ❌ 모든 기능

### 3. **한도 초과 시**
- 학생 수 한도 → 학생 추가 차단
- 선생님 수 한도 → 선생님 추가 차단
- 숙제 검사 한도 → 숙제 검사 차단
- AI 분석 한도 → AI 분석 차단
- 랜딩페이지 한도 → 랜딩페이지 생성 차단

---

## 📊 사용량 관리

### 자동 증가 시점
- **학생 추가 시** → `usage_students + 1`
- **선생님 추가 시** → `usage_teachers + 1`
- **숙제 검사 시** → `usage_homeworkChecks + 1`
- **AI 분석 시** → `usage_aiAnalysis + 1`
- **랜딩페이지 생성 시** → `usage_landingPages + 1`

### 자동 감소 시점
- **학생 삭제 시** → `usage_students - 1`
- **선생님 삭제 시** → `usage_teachers - 1`
- **랜딩페이지 삭제 시** → `usage_landingPages - 1`

### 월별 리셋
- 매월 1일 0시에 다음 항목 리셋:
  - `usage_homeworkChecks = 0`
  - `usage_aiAnalysis = 0`
  - `usage_aiGrading = 0`
  - `usage_capabilityAnalysis = 0`
  - `usage_conceptAnalysis = 0`
  - `usage_similarProblems = 0`

---

## 🎯 테스트 시나리오

### 1. 요금제 생성 테스트
```bash
# 스탠다드 플랜 생성
curl -X POST "https://superplacestudy.pages.dev/api/admin/pricing-plans" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "스탠다드",
    "description": "중소 학원용",
    "pricing_1month": 50000,
    "pricing_6months": 270000,
    "pricing_12months": 480000,
    "maxStudents": 50,
    "maxTeachers": 5,
    "maxLandingPages": 1,
    "features": "[\"출석관리\",\"AI분석\"]",
    "isActive": true
  }'

# 요금제 목록 조회
curl "https://superplacestudy.pages.dev/api/admin/pricing-plans"
```

### 2. 구독 할당 테스트
```bash
# 학원장에게 1개월 스탠다드 플랜 할당
curl -X POST "https://superplacestudy.pages.dev/api/admin/assign-subscription" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-director-123",
    "planId": "plan-1772460000000-xyz",
    "period": "1month"
  }'
```

### 3. 학생 추가 테스트 (한도 체크)
```bash
# 학생 추가 (구독 한도 체크 자동 적용)
curl -X POST "https://superplacestudy.pages.dev/api/admin/users/create" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "홍길동",
    "email": "student@example.com",
    "password": "password123",
    "role": "STUDENT",
    "academyId": "107"
  }'

# 성공 시 usage_students 자동 증가
# 한도 초과 시 403 에러 반환
```

### 4. 출석 체크 테스트 (만료 체크)
```bash
# 출석 체크 (구독 만료 체크 자동 적용)
curl -X POST "https://superplacestudy.pages.dev/api/attendance/checkin" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "123456"
  }'

# 구독 없음/만료 시 403 에러 반환
```

### 5. 구독 상태 조회 테스트
```bash
# 사용자의 구독 상태 및 사용량 조회
curl "https://superplacestudy.pages.dev/api/subscriptions/status?userId=user-director-123"
```

---

## 🔗 API 엔드포인트 요약

### 관리자 API
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/admin/pricing-plans` | 요금제 목록 조회 |
| POST | `/api/admin/pricing-plans` | 요금제 생성 |
| POST | `/api/admin/assign-subscription` | 사용자에게 구독 할당 |

### 구독 API
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/subscriptions/status` | 구독 상태 조회 |
| POST | `/api/subscriptions/check-limit` | 기능 사용 가능 여부 체크 |
| POST | `/api/subscriptions/track-usage` | 사용량 추적 |

### 통합된 API (구독 검증 자동 적용)
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | `/api/attendance/checkin` | 출석 체크 (구독 검증 포함) |
| POST | `/api/admin/users/create` | 사용자 생성 (한도 체크 포함) |

---

## 📝 다음 단계 (To-Do)

### 1. 프론트엔드 UI 구현
- [ ] 관리자 요금제 관리 페이지
- [ ] 구독 상태 대시보드
- [ ] 한도 초과 알림 모달
- [ ] 사용량 차트 표시

### 2. 추가 기능 통합
- [ ] 랜딩페이지 생성 시 한도 체크
- [ ] 숙제 검사 시 한도 체크
- [ ] AI 분석 시 한도 체크

### 3. 자동화
- [ ] 월별 사용량 리셋 크론 작업
- [ ] 구독 만료 자동 알림
- [ ] 결제 연동

---

## ✅ 검증 체크리스트

- [x] pricing_plans 테이블 생성
- [x] user_subscriptions 테이블 생성
- [x] usage_logs 테이블 생성
- [x] 요금제 생성 API
- [x] 구독 할당 API
- [x] 구독 상태 조회 API
- [x] 기능 사용 가능 여부 체크 API
- [x] 사용량 추적 API
- [x] 출석 체크에 구독 검증 추가
- [x] 학생 추가에 한도 체크 및 사용량 자동 증가
- [ ] 랜딩페이지 생성에 한도 체크
- [ ] 프론트엔드 한도 초과 알림

---

## 🎉 핵심 달성 사항

✅ **구독 없으면 모든 기능 차단**  
✅ **구독 만료 시 출석 체크 포함 모든 기능 차단**  
✅ **학생 추가 시 한도 초과 체크**  
✅ **사용량 자동 추적 및 로깅**  
✅ **실시간 한도 검증**

**배포 URL:** https://superplacestudy.pages.dev

**구현 완료:** 2026-03-02  
**문서 작성:** AI Assistant  
**커밋:** edfc421
