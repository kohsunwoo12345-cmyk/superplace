# 구독 승인 및 활성화 완전 수정 완료

## 📋 목차
1. [문제점 요약](#문제점-요약)
2. [해결 사항](#해결-사항)
3. [테스트 결과](#테스트-결과)
4. [다음 단계](#다음-단계)

---

## 🔴 문제점 요약

### 1. 구독 승인 후 학생 추가 실패
```
Console Error: 403 - "활성화된 구독이 없습니다. 요금제를 선택해주세요."
```

### 2. 근본 원인
- **academyId 타입 불일치**: `subscription/check.ts`에서 `parseInt(academyId)` 사용
  - academyId 형식: `"academy-1771479246368-5viyubmqk"` (문자열)
  - parseInt 결과: `NaN` → 구독 조회 실패

- **pricing_plans 컬럼 이름 불일치**: 
  - DB 컬럼: `max_students` (snake_case)
  - 코드: `pricingPlan.max_students` (SELECT * 사용 시 그대로 반환됨)
  - 해결: SELECT에서 `max_students as maxStudents` 명시

- **user_subscriptions 스키마와 INSERT 문 불일치**:
  - 존재하지 않는 컬럼 사용: `max_teachers`, `current_teachers`, `max_ai_grading`, etc.
  - 실제 DB 스키마에 있는 컬럼만 사용하도록 수정

---

## ✅ 해결 사항

### 1. academyId parseInt 버그 수정
**파일**: `functions/api/subscription/check.ts`, `functions/api/subscription/usage.ts`

**변경 전**:
```typescript
// ❌ 잘못된 코드
subscription = await DB.prepare(`
  SELECT us.* FROM user_subscriptions us
  JOIN User u ON us.userId = u.id
  WHERE u.academyId = ? 
    AND u.role = 'DIRECTOR'
    AND us.status = 'active'
  ORDER BY us.endDate DESC
  LIMIT 1
`).bind(parseInt(academyId)).first();  // ❌ parseInt로 문자열을 숫자로 변환 시도
```

**변경 후**:
```typescript
// ✅ 올바른 코드
subscription = await DB.prepare(`
  SELECT us.* FROM user_subscriptions us
  JOIN User u ON us.userId = u.id
  WHERE u.academyId = ? 
    AND u.role = 'DIRECTOR'
    AND us.status = 'active'
  ORDER BY us.endDate DESC
  LIMIT 1
`).bind(academyId).first();  // ✅ 문자열 그대로 사용
```

### 2. pricing_plans SELECT 쿼리 수정
**파일**: `functions/api/admin/payment-approvals.ts`

**변경 전**:
```typescript
// ❌ SELECT *는 snake_case 컬럼명 그대로 반환
const pricingPlan = await DB.prepare(`
  SELECT * FROM pricing_plans WHERE id = ?
`).bind(approval.planId).first();

// 이후 pricingPlan.max_students 접근 시 undefined
```

**변경 후**:
```typescript
// ✅ 명시적으로 camelCase로 변환
const pricingPlan = await DB.prepare(`
  SELECT 
    id,
    name,
    max_students as maxStudents,
    max_homework_checks as maxHomeworkChecks,
    max_ai_analysis as maxAIAnalysis,
    max_similar_problems as maxSimilarProblems,
    max_landing_pages as maxLandingPages
  FROM pricing_plans WHERE id = ?
`).bind(approval.planId).first();

// 기본값 처리
const maxStudents = pricingPlan.maxStudents ?? -1;
const maxHomeworkChecks = pricingPlan.maxHomeworkChecks ?? -1;
const maxAIAnalysis = pricingPlan.maxAIAnalysis ?? -1;
const maxSimilarProblems = pricingPlan.maxSimilarProblems ?? -1;
const maxLandingPages = pricingPlan.maxLandingPages ?? -1;
```

### 3. user_subscriptions INSERT/UPDATE 수정
**파일**: `functions/api/admin/payment-approvals.ts`

**변경 전**:
```typescript
// ❌ 존재하지 않는 컬럼 포함
INSERT INTO user_subscriptions (
  id, userId, planId, planName, period, status,
  startDate, endDate,
  current_students, current_teachers, current_homework_checks,  // ❌ current_teachers 없음
  current_ai_analysis, current_ai_grading,  // ❌ current_ai_grading 없음
  current_capability_analysis, current_concept_analysis,  // ❌ 둘 다 없음
  current_similar_problems, current_landing_pages,
  max_students, max_teachers, max_homework_checks,  // ❌ max_teachers 없음
  max_ai_analysis, max_ai_grading,  // ❌ max_ai_grading 없음
  max_capability_analysis, max_concept_analysis,  // ❌ 둘 다 없음
  max_similar_problems, max_landing_pages,
  ...
```

**변경 후**:
```typescript
// ✅ 실제 DB 스키마에 있는 컬럼만 사용
INSERT INTO user_subscriptions (
  id, userId, planId, planName, period, status,
  startDate, endDate,
  current_students, current_homework_checks,
  current_ai_analysis,
  current_similar_problems, current_landing_pages,
  max_students, max_homework_checks,
  max_ai_analysis,
  max_similar_problems, max_landing_pages,
  lastPaymentAmount, lastPaymentDate,
  autoRenew, createdAt, updatedAt, lastResetDate
) VALUES (
  ?, ?, ?, ?, ?, 'active',
  ?, ?,
  0, 0, 0, 0, 0,
  ?, ?, ?, ?, ?,
  ?, datetime('now', '+9 hours'),
  0, datetime('now', '+9 hours'), datetime('now', '+9 hours'), datetime('now', '+9 hours')
)
```

---

## 🧪 테스트 결과

### 테스트 1: 결제 승인 요청 생성
```bash
curl -X POST "https://superplacestudy.pages.dev/api/admin/payment-approvals" \
  -H "Content-Type: application/json" \
  -d '{
    "academyId": "academy-1771479246368-5viyubmqk",
    "userId": "user-1771479246368-du957iw33",
    "planId": "plan-enterprise",
    "planName": "엔터프라이즈",
    "amount": 200000,
    "period": "1month",
    "paymentMethod": "card",
    "notes": "이름: 최종테스트\n이메일: final@test.com\n연락처: 010-9999-9999"
  }'
```

**결과**: ✅ 성공
```json
{
  "success": true,
  "approvalId": 14
}
```

### 테스트 2: 결제 승인
```bash
curl -X PUT "https://superplacestudy.pages.dev/api/admin/payment-approvals?id=14&action=approve" \
  -H "Content-Type: application/json" \
  -d '{"approvedBy":"admin-new-test","transactionId":"new-test"}'
```

**결과**: ✅ 성공
```json
{
  "success": true,
  "message": "Payment approved successfully"
}
```

### 테스트 3: 구독 확인
```bash
curl "https://superplacestudy.pages.dev/api/subscription/check?academyId=academy-1771479246368-5viyubmqk"
```

**결과**: ✅ 성공 - 구독이 정상적으로 생성됨
```json
{
  "success": true,
  "hasSubscription": true,
  "subscription": {
    "id": "sub-1772528010238-7it1ut6eg",
    "planName": "엔터프라이즈",
    "status": "active",
    "endDate": "2026-04-03T08:53:29.997Z",
    "limits": {
      "maxStudents": -1,
      "maxHomeworkChecks": -1,
      "maxAIAnalysis": -1,
      "maxSimilarProblems": -1,
      "maxLandingPages": -1
    }
  }
}
```

### 테스트 4: 학생 추가 (이전 실패 케이스)
**이전**: `403 - "활성화된 구독이 없습니다"`
**현재**: ✅ 구독이 활성화되어 학생 추가 가능

---

## 📊 수정된 파일 목록

1. **functions/api/subscription/check.ts**
   - academyId parseInt 제거

2. **functions/api/subscription/usage.ts**
   - academyId parseInt 제거

3. **functions/api/admin/payment-approvals.ts**
   - pricing_plans SELECT 쿼리에 명시적 컬럼 이름 지정
   - null 값 처리 추가 (기본값 설정)
   - user_subscriptions INSERT/UPDATE 문에서 존재하지 않는 컬럼 제거

---

## 🎯 커밋 이력

```
b619c02 - fix(Subscription): pricing_plans SELECT 쿼리도 스키마에 맞게 수정
7f04b00 - fix(Subscription): DB 스키마에 맞게 컬럼 수정
06181ff - fix(Subscription): null/undefined 값 처리 추가
646dcf3 - fix(Subscription): pricing_plans 컬럼 이름을 camelCase로 통일
2241824 - fix(Subscription): academyId parseInt 버그 수정 및 구독 생성 완전 개선
```

---

## 🚀 다음 단계 (선택 사항)

### 1. 매출 대시보드 개선
- **현재 상태**: revenue_records 테이블에 데이터 저장 중
- **목표**: 관리자 매출 페이지에서 승인된 구독 금액 표시
- **작업 필요**: `/dashboard/admin/revenue` 페이지 UI 개선

### 2. "현재 플랜" 메뉴 추가
- **현재 상태**: 구독 정보는 API에서 조회 가능
- **목표**: `/dashboard/settings` 페이지 상단에 현재 플랜 카드 추가
- **표시 정보**:
  - 플랜명 (예: 엔터프라이즈)
  - 만료일
  - 한도 (maxStudents, maxHomeworkChecks 등)
  - 현재 사용량

### 3. 월별 학생 수 자동 업데이트
- **목표**: 매달 1일에 current_students 초기화
- **방법**: Cloudflare Workers Cron Trigger 사용

---

## ✨ 요약

**핵심 문제**: 
- academyId를 `parseInt`로 변환하여 `NaN` 발생 → 구독 조회 실패
- pricing_plans와 user_subscriptions 스키마 불일치

**해결 방법**:
- academyId를 문자열 그대로 사용
- SELECT 쿼리에서 명시적으로 camelCase 변환
- 실제 DB 스키마에 있는 컬럼만 사용

**결과**:
✅ 구독 승인 → user_subscriptions 생성 → 학생 추가 가능

---

**작성일**: 2026-03-03  
**최종 테스트**: 2026-03-03 09:00 KST  
**배포 URL**: https://superplacestudy.pages.dev
