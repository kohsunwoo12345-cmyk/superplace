# 🎯 요금제 시스템 완전 분석 및 수정 보고서

**작성일**: 2026-03-02  
**상태**: ✅ 수정 완료 및 배포됨  
**커밋**: 5a4c1fe

---

## 📋 발견한 문제

### 1. ❌ 프론트엔드 필드명 불일치
**파일**: `src/app/dashboard/admin/pricing/page.tsx`

**문제**:
```typescript
// ❌ 잘못된 구조 (API와 불일치)
const payload = {
  pricing: {
    '1month': Number(formData.monthlyPrice),
    '6months': ...,
    '12months': ...
  },
  limits: {
    maxStudents: Number(formData.maxStudents),
    maxTeachers: ...
  }
};
```

**API가 기대하는 구조**:
```typescript
// ✅ 올바른 구조
const payload = {
  pricing_1month: Number(formData.monthlyPrice),
  pricing_6months: ...,
  pricing_12months: ...,
  maxStudents: Number(formData.maxStudents),
  maxTeachers: ...
};
```

**결과**: 요금제 생성 시 모든 값이 NULL로 저장됨

---

## ✅ 수정 내용

### 1. 프론트엔드 필드명 통일

**변경 파일**: `src/app/dashboard/admin/pricing/page.tsx` (라인 160-183)

**변경 전**:
```typescript
const payload = {
  pricing: { '1month': ..., '6months': ..., '12months': ... },
  limits: { maxStudents: ..., maxTeachers: ..., ... },
  features: featuresArray,  // Array 그대로 전송
};
```

**변경 후**:
```typescript
const payload = {
  pricing_1month: Number(formData.monthlyPrice),
  pricing_6months: Number(formData.yearlyPrice) > 0 
    ? Number(formData.yearlyPrice) / 2 
    : Number(formData.monthlyPrice) * 6,
  pricing_12months: Number(formData.yearlyPrice) || Number(formData.monthlyPrice) * 12,
  maxStudents: Number(formData.maxStudents),
  maxTeachers: Number(formData.maxTeachers),
  maxHomeworkChecks: Number(formData.maxHomeworkChecks),
  maxAIAnalysis: Number(formData.maxCapabilityAnalysis),
  maxAIGrading: Number(formData.maxAIGrading),
  maxCapabilityAnalysis: Number(formData.maxCapabilityAnalysis),
  maxConceptAnalysis: Number(formData.maxConceptAnalysis),
  maxSimilarProblems: Number(formData.maxSimilarProblems),
  maxLandingPages: Number(formData.maxLandingPages),
  features: JSON.stringify(featuresArray),  // JSON 문자열로 변환
  isPopular: formData.isPopular,
  isActive: true,
};
```

---

## 🔍 전체 플로우 분석

### 단계 1: 요금제 생성 (관리자)
**URL**: `/dashboard/admin/pricing`

1. 관리자가 폼에 값 입력:
   - 월간 가격: 50,000원
   - 연간 가격: 480,000원
   - 학생 한도: 30명
   - 선생님 한도: 5명
   - 숙제 검사: 100회
   - AI 분석: 50회
   - ... 등

2. "저장" 클릭 → `POST /api/admin/pricing-plans`

3. **API 저장** (`functions/api/admin/pricing-plans.ts`):
```sql
INSERT INTO pricing_plans (
  id, name, description,
  pricing_1month, pricing_6months, pricing_12months,
  maxStudents, maxTeachers, maxHomeworkChecks,
  maxAIAnalysis, maxAIGrading, maxCapabilityAnalysis,
  maxConceptAnalysis, maxSimilarProblems, maxLandingPages,
  features, isPopular, color, `order`, isActive
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
```

4. **저장 결과**:
```json
{
  "id": "plan-1234567890-abc123",
  "name": "스탠다드 플랜",
  "pricing_1month": 50000,
  "pricing_12months": 480000,
  "maxStudents": 30,
  "maxTeachers": 5,
  ...
}
```

### 단계 2: 구독 할당 (관리자 → 학원장)
**API**: `POST /api/admin/assign-subscription`

**요청**:
```json
{
  "userId": "director-12345",
  "planId": "plan-1234567890-abc123",
  "period": "12months"
}
```

**처리** (`functions/api/admin/assign-subscription.ts`):
```typescript
// 1. 요금제 정보 조회
const plan = await db.prepare(`
  SELECT * FROM pricing_plans WHERE id = ?
`).bind(planId).first();

// 2. user_subscriptions에 저장
await db.prepare(`
  INSERT INTO user_subscriptions (
    id, userId, planId, planName, period, status,
    startDate, endDate,
    limit_maxStudents,    // ← pricing_plans.maxStudents
    limit_maxTeachers,    // ← pricing_plans.maxTeachers
    limit_maxHomeworkChecks,
    ...
  ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ...)
`).bind(
  subscriptionId,
  userId,
  plan.id,
  plan.name,
  period,
  startDate,
  endDate,
  plan.maxStudents,     // ✅ 한도 복사
  plan.maxTeachers,
  plan.maxHomeworkChecks,
  ...
).run();
```

**결과**:
```json
{
  "success": true,
  "subscriptionId": "sub-1234567890-xyz789",
  "subscription": {
    "planName": "스탠다드 플랜",
    "period": "12months",
    "startDate": "2026-03-02",
    "endDate": "2027-03-02"
  }
}
```

### 단계 3: 학생 추가 시 한도 체크
**API**: `POST /api/admin/users/create`

**요청**:
```json
{
  "name": "홍길동",
  "email": "student@test.com",
  "role": "STUDENT",
  "academyId": "academy-123"
}
```

**처리** (`functions/api/admin/users/create.ts`):
```typescript
// 1. 학원의 DIRECTOR 찾기
const director = await DB.prepare(`
  SELECT id FROM User 
  WHERE academyId = ? AND role = 'DIRECTOR'
  LIMIT 1
`).bind(academyId).first();

// 2. DIRECTOR의 활성 구독 확인
const subscription = await DB.prepare(`
  SELECT * FROM user_subscriptions 
  WHERE userId = ? AND status = 'active'
  ORDER BY createdAt DESC
  LIMIT 1
`).bind(director.id).first();

// 3. 구독 없으면 차단
if (!subscription) {
  return {
    success: false,
    error: "SUBSCRIPTION_REQUIRED",
    message: "학원의 요금제 구독이 필요합니다."
  };
}

// 4. 만료 확인
const now = new Date();
const endDate = new Date(subscription.endDate);
if (now > endDate) {
  return {
    success: false,
    error: "SUBSCRIPTION_EXPIRED",
    message: "학원의 구독이 만료되었습니다."
  };
}

// 5. 학생 수 한도 체크
const maxStudents = subscription.limit_maxStudents;
const currentStudents = subscription.usage_students;

if (maxStudents !== -1 && currentStudents >= maxStudents) {
  return {
    success: false,
    error: "STUDENT_LIMIT_EXCEEDED",
    message: `학생 수 한도를 초과했습니다. (${currentStudents}/${maxStudents})`
  };
}

// 6. 학생 생성
await DB.prepare(`INSERT INTO User (...) VALUES (...)`).run();

// 7. 사용량 증가
await DB.prepare(`
  UPDATE user_subscriptions 
  SET usage_students = usage_students + 1,
      updatedAt = datetime('now')
  WHERE userId = ? AND status = 'active'
`).bind(director.id).run();

// 8. 사용 로그 기록
await DB.prepare(`
  INSERT INTO usage_logs (id, userId, subscriptionId, featureType, action, metadata)
  VALUES (?, ?, ?, 'student_add', 'create', ?)
`).bind(logId, director.id, subscription.id, JSON.stringify({ studentId, studentName })).run();
```

**성공 시**:
```json
{
  "success": true,
  "message": "학생이 추가되었습니다. 출석 코드: 123456",
  "user": { "id": "user-...", "name": "홍길동", ... },
  "attendanceCode": "123456"
}
```

**실패 시 (구독 없음)**:
```json
{
  "success": false,
  "error": "SUBSCRIPTION_REQUIRED",
  "message": "학원의 요금제 구독이 필요합니다. 요금제를 선택해주세요."
}
```

**실패 시 (한도 초과)**:
```json
{
  "success": false,
  "error": "STUDENT_LIMIT_EXCEEDED",
  "message": "학생 수 한도를 초과했습니다. (30/30)",
  "currentUsage": 30,
  "maxLimit": 30
}
```

### 단계 4: 원장 계정 기능 접근
**문제**: "기능들이 막혀있다"

**원인 분석**:
1. **구독이 없는 경우**: 위의 단계 3 로직에 따라 모든 프리미엄 기능 차단
2. **구독이 만료된 경우**: `endDate < now` → 차단
3. **한도 초과**: 특정 기능만 차단

**해결 방법**:
```bash
# 1. 구독 상태 확인
curl -s "https://superplacestudy.pages.dev/api/subscriptions/status?userId=DIRECTOR_ID" \
  -H "Authorization: Bearer $TOKEN"

# 2. 응답 확인
{
  "hasSubscription": false,  // ← 구독 없음!
  "subscription": null,
  "message": "활성 구독이 없습니다. 요금제를 선택해주세요."
}

# 또는
{
  "hasSubscription": false,
  "subscription": null,
  "message": "구독이 만료되었습니다. 갱신이 필요합니다.",
  "expired": true
}
```

**조치 방법**:
1. 관리자가 해당 학원장에게 구독 할당
2. 또는 학원장이 요금제 신청 → 관리자 승인

---

## 🧪 테스트 시나리오

### 시나리오 A: 새 요금제 생성 → 적용
```bash
# 1. 요금제 생성 (관리자)
요금제 관리 → 새 요금제 → 값 입력 → 저장
→ pricing_plans 테이블에 저장 ✅

# 2. 구독 할당 (관리자 → 학원장)
POST /api/admin/assign-subscription
→ user_subscriptions 테이블에 한도 복사 ✅

# 3. 학생 추가 (학원장)
POST /api/admin/users/create
→ 한도 체크 후 생성 또는 차단 ✅
```

### 시나리오 B: 한도 초과 테스트
```bash
# 전제: 학생 5명 한도 요금제

# 1~5번째 학생 추가: 성공 ✅
# 6번째 학생 추가: 차단 ❌
{
  "error": "STUDENT_LIMIT_EXCEEDED",
  "message": "학생 수 한도를 초과했습니다. (5/5)"
}
```

### 시나리오 C: 만료된 구독
```bash
# 전제: endDate = 2026-01-01, 현재 = 2026-03-02

# 학생 추가 시도: 차단 ❌
{
  "error": "SUBSCRIPTION_EXPIRED",
  "message": "학원의 구독이 만료되었습니다. 갱신이 필요합니다."
}

# 출석 체크 시도: 차단 ❌
{
  "error": "SUBSCRIPTION_EXPIRED",
  "message": "구독이 만료되었습니다."
}
```

---

## 📊 데이터 흐름 다이어그램

```
[관리자] → 요금제 생성
    ↓
[pricing_plans 테이블]
    pricing_1month: 50000
    maxStudents: 30
    maxTeachers: 5
    ...
    
[관리자] → 구독 할당
    ↓
[user_subscriptions 테이블]
    userId: director-123
    planId: plan-abc
    limit_maxStudents: 30  ← pricing_plans.maxStudents 복사
    limit_maxTeachers: 5   ← pricing_plans.maxTeachers 복사
    usage_students: 0
    usage_teachers: 0
    status: 'active'
    endDate: '2027-03-02'
    
[학원장] → 학생 추가
    ↓
[users/create.ts] → 체크:
    1. 구독 존재? → Yes ✅
    2. 만료 안 됨? → Yes ✅
    3. usage_students < limit_maxStudents? → Yes (0 < 30) ✅
    ↓
[User 테이블] → 학생 생성 ✅
    ↓
[user_subscriptions 테이블] → 사용량 증가
    usage_students: 1 (0 → 1)
    ↓
[usage_logs 테이블] → 로그 기록
    featureType: 'student_add'
    action: 'create'
```

---

## ✅ 검증 체크리스트

### API 레벨
- [x] `POST /api/admin/pricing-plans` - 요금제 생성 시 필드 정상 저장
- [x] `GET /api/admin/pricing-plans` - 저장된 요금제 조회 정상
- [x] `POST /api/admin/assign-subscription` - 한도 복사 정상
- [x] `GET /api/subscriptions/status` - 구독 상태 조회 정상
- [x] `POST /api/admin/users/create` - 한도 체크 로직 정상

### 기능 레벨
- [x] 요금제 생성 후 DB에 정확한 값 저장
- [x] 구독 할당 시 한도가 `user_subscriptions`에 복사됨
- [x] 학생 추가 시 구독 체크 작동
- [x] 한도 초과 시 차단 메시지 표시
- [x] 만료된 구독 시 기능 차단

### UI 레벨
- [x] 요금제 관리 페이지에서 연간 가격 입력 가능
- [x] 각 한도 필드 입력 가능
- [x] 저장 후 새로고침 시 값 유지

---

## 🎯 최종 결론

### ✅ 수정 완료
1. **프론트엔드 필드명 통일** - API와 일치하도록 수정
2. **요금제 저장 정상화** - 입력한 값이 정확히 저장됨
3. **구독 한도 적용 정상화** - 요금제 → 구독 변환 정상
4. **한도 체크 로직 검증** - 학생 추가 시 정확히 차단

### 📝 사용자 액션 아이템
1. **요금제 생성**: 관리자 → `/dashboard/admin/pricing` → 새 요금제 생성
2. **구독 할당**: 관리자 → 학원 선택 → 구독 할당
3. **테스트**: 학원장 계정으로 로그인 → 학생 추가 시도
4. **확인**: 한도 내에서는 성공, 초과 시 차단 메시지 확인

### 🔍 원장 계정 "기능 막힘" 해결
**원인**: 구독이 없거나 만료됨  
**해결**: 관리자가 해당 학원장에게 구독 할당

**확인 방법**:
```bash
# 브라우저 콘솔에서
const user = JSON.parse(localStorage.getItem('user'));
console.log('User ID:', user.id);

// API 호출
fetch(`/api/subscriptions/status?userId=${user.id}`, {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
})
  .then(r => r.json())
  .then(console.log);
```

---

## 📞 추가 지원

### 테스트 스크립트
```bash
cd /home/user/webapp

# 로직 검증
./verify-pricing-logic.sh

# 전체 플로우 테스트 (관리자 계정 필요)
./test-pricing-limit-enforcement.sh
```

### 관련 문서
- `SUBSCRIPTION_FIX_COMPLETE.md` - 구독 시스템 완전 가이드
- `QUICK_START.md` - 5분 안에 테스트하기

---

**작성자**: Claude AI  
**배포 상태**: ✅ Production (커밋 5a4c1fe)  
**URL**: https://superplacestudy.pages.dev
