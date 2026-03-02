# 🚨 핵심 문제 원인 및 해결책

## 📌 문제 요약

### 문제 1: 랜딩페이지 구독 전 차단 안됨
**상태:** ✅ 해결됨 (커밋 5671247)
- `functions/api/admin/landing-pages.ts`에 구독 체크 로직 추가
- DIRECTOR/TEACHER 계정에서 구독 없으면 생성 차단
- 에러 메시지: "랜딩페이지 생성을 위해 요금제 구독이 필요합니다"

### 문제 2: 구독 후 학생 추가 실패
**상태:** ⚠️ 부분 해결, 추가 조치 필요

## 🔍 근본 원인 분석

### 원인 1: 기존 요금제 데이터에 값이 NULL
```sql
-- 현재 pricing_plans 테이블 상태
SELECT name, maxStudents, maxTeachers, pricing_1month 
FROM pricing_plans;

-- 결과: 모든 limit 필드가 NULL
┌──────────┬─────────────┬─────────────┬─────────────────┐
│ name     │ maxStudents │ maxTeachers │ pricing_1month  │
├──────────┼─────────────┼─────────────┼─────────────────┤
│ 무료 플랜  │ NULL        │ NULL        │ NULL            │
│ 베이직    │ NULL        │ NULL        │ NULL            │
└──────────┴─────────────┴─────────────┴─────────────────┘
```

**왜 NULL인가?**
- 기존 pricing_plans 레코드가 구 스키마로 생성됨
- 새로운 maxStudents 등의 필드는 나중에 ALTER TABLE로 추가되었지만 기본값만 설정
- 기존 레코드는 업데이트되지 않음

### 원인 2: 구독 할당 시 NULL 값 복사
```typescript
// functions/api/admin/assign-subscription.ts (Line 107-115)
await db.prepare(`
  INSERT INTO user_subscriptions (
    ..., limit_maxStudents, limit_maxTeachers, ...
  ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ...)`
).bind(
  ...,
  plan.maxStudents,     // 🔴 NULL 값이 복사됨
  plan.maxTeachers,     // 🔴 NULL 값이 복사됨
  ...
)
```

### 원인 3: 학생 추가 시 NULL 체크 실패
```typescript
// functions/api/admin/users/create.ts (Line 92-95)
const maxStudents = subscription.limit_maxStudents as number;  // 🔴 NULL
const currentStudents = subscription.usage_students as number; // 🔴 NULL 또는 0

// Line 95: NULL !== -1 이므로 체크 로직 통과 못함
if (maxStudents !== -1 && currentStudents >= maxStudents) {
  // currentStudents >= NULL → false
}
```

## ✅ 해결 방법

### 즉시 조치: 기존 요금제 데이터 업데이트

관리자 페이지에서:
1. **Admin → Pricing 페이지 접속**
2. **각 요금제 편집**
3. **모든 필드 값 입력:**
   - 최대 학생 수 (예: 30)
   - 최대 선생님 수 (예: 5)
   - 숙제 검사 횟수 (예: 100)
   - AI 분석 횟수 (예: 50)
   - AI 채점 횟수 (예: 50)
   - 능력 분석 횟수 (예: 30)
   - 개념 분석 횟수 (예: 30)
   - 유사 문제 횟수 (예: 100)
   - 랜딩페이지 수 (예: 3)
4. **저장**

### 검증 방법

```bash
# 1. 요금제 값 확인
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://superplacestudy.pages.dev/api/admin/pricing-plans | jq '.plans[0]'

# 예상 결과: maxStudents, maxTeachers 등에 숫자 값 존재

# 2. 새 구독 할당
# Admin → Academies → 학원 선택 → Assign Subscription

# 3. 구독 상태 확인
curl "https://superplacestudy.pages.dev/api/subscriptions/status?userId=DIRECTOR_ID" | jq .

# 예상 결과:
{
  "success": true,
  "hasSubscription": true,
  "subscription": {
    "maxStudents": 30,      // ✅ 숫자
    "usedStudents": 0,      // ✅ 0
    "maxTeachers": 5,       // ✅ 숫자
    ...
  }
}

# 4. 학생 추가 테스트
# Director 계정 로그인 → 학생 관리 → 학생 추가
# 예상: 성공
```

## 📊 데이터 흐름

```
[관리자가 요금제 생성/수정]
         ↓
    pricing_plans 테이블
    (maxStudents, maxTeachers 등 저장)
         ↓
[관리자가 학원에 구독 할당]
         ↓
    assign-subscription API
    (plan.maxStudents → limit_maxStudents로 복사)
         ↓
    user_subscriptions 테이블
    (limit_maxStudents, usage_students 저장)
         ↓
[학원장이 학생 추가 시도]
         ↓
    users/create API
    (limit_maxStudents 체크)
         ↓
    ✅ 성공 시: usage_students 증가
    ❌ 실패 시: STUDENT_LIMIT_EXCEEDED
```

## 🔧 향후 개선 사항

1. **NULL 값 방어 로직 추가**
```typescript
// assign-subscription.ts 개선안
const maxStudents = plan.maxStudents ?? -1;  // NULL이면 -1 (무제한)
const maxTeachers = plan.maxTeachers ?? -1;
```

2. **기본값 설정**
```sql
-- pricing_plans 생성 시 무료 플랜 자동 생성
INSERT INTO pricing_plans (id, name, pricing_1month, maxStudents, maxTeachers, ...)
VALUES ('plan-free', '무료 플랜', 0, 10, 2, 20, 10, 10, 5, 5, 20, 1);
```

3. **데이터 검증 강화**
- 요금제 생성 시 필수 필드 체크
- 구독 할당 시 NULL 값 경고

## 📋 체크리스트

- [x] 랜딩페이지 구독 체크 추가
- [ ] 기존 요금제 데이터 값 입력 (수동)
- [ ] 구독 재할당
- [ ] 학생 추가 테스트
- [ ] NULL 방어 로직 추가 (선택사항)

---

**작성일:** 2026-03-02
**작성자:** Claude AI
**문서 버전:** 1.0
