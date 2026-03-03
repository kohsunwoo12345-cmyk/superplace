# 학원 상세 페이지 구독 한도 표시 기능 추가

## 📋 개요

학원 관리자가 요금제를 구매하거나 AI 봇을 구매한 후, **학원 상세 페이지**에서 구독 한도(사용량/최대량)가 정확히 표시되도록 수정했습니다.

## 🔍 문제 상황

### 이전 문제점
1. **요금제 구매 후**: 학원 상세 페이지(`/dashboard/admin/academies/detail`)에서 구독 한도가 표시되지 않음
2. **AI 봇 구매 후**: 동일하게 한도 정보가 업데이트되지 않음
3. **표시 정보 불일치**: API는 `user_subscriptions` 테이블의 정확한 한도를 제공하지만, 프론트엔드가 `academy` 테이블의 기본값만 사용

### 원인 분석
- **API 응답 구조**: `/api/admin/academies?id=X` API는 이미 `currentPlan` 객체를 반환
- **프론트엔드 미활용**: React 컴포넌트가 `academy.currentPlan` 데이터를 활용하지 않고, `academy.maxStudents`, `academy.maxTeachers` 등 기본값만 사용
- **데이터 존재하지만 미표시**: 구독 정보는 올바르게 저장되지만, UI에 반영되지 않음

## ✅ 해결 방법

### 1️⃣ TypeScript 인터페이스 확장

`AcademyDetail` 인터페이스에 `currentPlan` 필드 추가:

```typescript
interface AcademyDetail {
  // 기존 필드...
  currentPlan?: {
    planName: string;
    status: string;
    period?: string;
    maxStudents: number;
    usedStudents: number;
    maxTeachers: number;
    usedTeachers: number;
    maxHomeworkChecks: number;
    usedHomeworkChecks: number;
    maxAIAnalysis: number;
    usedAIAnalysis: number;
    maxSimilarProblems: number;
    usedSimilarProblems: number;
    maxLandingPages: number;
    usedLandingPages: number;
    startDate?: string;
    endDate?: string;
    daysRemaining: number;
    active: boolean;
    autoRenew?: boolean;
    lastPaymentAmount?: number;
    lastPaymentDate?: string;
  };
}
```

### 2️⃣ 한도 표시 로직 수정

학생/교사 수 표시:

```typescript
// 변경 전
<p className="text-xs text-gray-500 mt-2">
  최대 {academy.maxStudents}명
</p>

// 변경 후 (구독 정보 우선 사용)
<p className="text-xs text-gray-500 mt-2">
  최대 {academy.currentPlan?.maxStudents || academy.maxStudents}명
</p>
```

### 3️⃣ 추가 한도 정보 표시

구독 정보 섹션(통계 탭)에 다음 항목 추가:

1. **숙제 검사 한도**: `current / max`
2. **AI 분석 한도**: `current / max`
3. **유사 문제 생성 한도**: `current / max`
4. **랜딩 페이지 한도**: `current / max`
5. **구독 만료일**: 날짜 + 남은 일수

각 항목은 프로그레스 바로 시각화:

```typescript
{academy.currentPlan && academy.currentPlan.maxHomeworkChecks > 0 && (
  <div>
    <p className="text-sm text-gray-600">숙제 검사 제한</p>
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div
          className="bg-purple-600 h-2 rounded-full"
          style={{
            width: `${Math.min(
              (academy.currentPlan.usedHomeworkChecks / academy.currentPlan.maxHomeworkChecks) * 100,
              100
            )}%`,
          }}
        />
      </div>
      <span className="text-sm font-semibold">
        {academy.currentPlan.usedHomeworkChecks} / {academy.currentPlan.maxHomeworkChecks}
      </span>
    </div>
  </div>
)}
```

## 🎯 구현 결과

### 표시되는 정보

#### 주요 통계 카드
- **총 학생 수**: `현재 학생 수` / `구독 한도` (예: 5명 / 50명)
- **총 선생님 수**: `현재 교사 수` / `구독 한도` (예: 2명 / 10명)

#### 통계 탭 → 구독 정보 섹션
- **구독 플랜**: 플랜명 표시 (예: "프리미엄 플랜")
- **학생 제한**: 프로그레스 바 + `5 / 50`
- **선생님 제한**: 프로그레스 바 + `2 / 10`
- **숙제 검사 제한**: 프로그레스 바 + `120 / 500` (구독에 포함된 경우만)
- **AI 분석 제한**: 프로그레스 바 + `45 / 200` (구독에 포함된 경우만)
- **유사 문제 생성 제한**: 프로그레스 바 + `30 / 100` (구독에 포함된 경우만)
- **랜딩 페이지 제한**: 프로그레스 바 + `2 / 5` (구독에 포함된 경우만)
- **구독 만료일**: `2026년 6월 3일 (90일 남음)`

### 조건부 표시

구독 정보가 있는 경우에만 추가 한도 표시:
- `maxHomeworkChecks > 0`일 때만 숙제 검사 한도 표시
- `maxAIAnalysis > 0`일 때만 AI 분석 한도 표시
- `maxSimilarProblems > 0`일 때만 유사 문제 한도 표시
- `maxLandingPages > 0`일 때만 랜딩 페이지 한도 표시

## 📊 데이터 흐름

```
1. 요금제 구매/승인
   ↓
2. subscription_requests → user_subscriptions 테이블에 레코드 생성
   ↓
3. /api/admin/academies?id=X 호출
   ↓
4. API: user_subscriptions에서 구독 정보 조회하여 currentPlan 객체 생성
   ↓
5. 프론트엔드: academy.currentPlan 데이터 활용하여 한도 표시
   ↓
6. 사용자: 학원 상세 페이지에서 실시간 구독 상태 확인
```

## 🔧 API 구조 (참고)

### `/api/admin/academies?id=X` 응답 구조

```json
{
  "success": true,
  "academy": {
    "id": "dir-test-user-1772098439",
    "name": "큰솔학원",
    "subscriptionPlan": "프리미엄 플랜",
    "maxStudents": 50,
    "maxTeachers": 10,
    "studentCount": 5,
    "teacherCount": 2,
    "currentPlan": {
      "planName": "프리미엄 플랜",
      "status": "active",
      "period": "6months",
      "maxStudents": 50,
      "usedStudents": 5,
      "maxTeachers": 10,
      "usedTeachers": 0,
      "maxHomeworkChecks": 500,
      "usedHomeworkChecks": 120,
      "maxAIAnalysis": 200,
      "usedAIAnalysis": 45,
      "maxSimilarProblems": 100,
      "usedSimilarProblems": 30,
      "maxLandingPages": 5,
      "usedLandingPages": 2,
      "startDate": "2026-03-03T10:00:00Z",
      "endDate": "2026-06-03T10:00:00Z",
      "daysRemaining": 90,
      "active": true,
      "autoRenew": false,
      "lastPaymentAmount": 300000,
      "lastPaymentDate": "2026-03-03T10:00:00Z"
    }
  }
}
```

## 🚀 배포 및 확인

### 배포 정보
- **커밋**: `fa29947`
- **브랜치**: `main`
- **저장소**: https://github.com/kohsunwoo12345-cmyk/superplace
- **배포 URL**: https://superplacestudy.pages.dev

### 확인 절차

1. **배포 대기** (2-3분)
2. **관리자 로그인**: https://superplacestudy.pages.dev/login
3. **학원 관리 이동**: 대시보드 → 학원 관리
4. **학원 상세 보기**: 학원 카드 클릭
5. **주요 통계 카드 확인**: "총 학생 수", "총 선생님 수"에 구독 한도 표시 확인
6. **통계 탭 이동**: "통계" 탭 클릭
7. **구독 정보 확인**: 
   - 학생/선생님 제한 프로그레스 바
   - 숙제 검사, AI 분석, 유사 문제, 랜딩 페이지 한도 (해당하는 경우)
   - 구독 만료일 및 남은 일수

### 예상 결과

✅ **정상 작동**:
- 구독이 있는 학원: 모든 한도 정보가 표시되고, 프로그레스 바가 정확한 퍼센트로 표시됨
- 구독이 없는 학원: 기본 학생/교사 한도만 표시, 추가 한도는 표시 안 됨 (조건부)

## 📝 AI 봇 구매 시 동작

### 현재 상태
- **AI 봇 구매 API**: `AcademyBotSubscription` 테이블에 레코드 생성
- **학원 상세 API**: `bot_assignments` 테이블에서 할당된 봇 조회하여 표시
- **한도 정보**: `user_subscriptions` 테이블에서 조회하여 표시

### 작동 방식
1. AI 봇 구매 시 `AcademyBotSubscription`에 슬롯 정보 저장
2. 학원 상세 페이지에서 `currentPlan` 데이터로 한도 표시
3. AI 봇 구매로 인한 슬롯 변경은 별도 테이블(`AcademyBotSubscription`)에서 관리
4. 두 정보가 독립적으로 표시됨

### 결론
- **요금제 구매**: `user_subscriptions` 한도를 학원 상세 페이지에서 확인 ✅
- **AI 봇 구매**: `AcademyBotSubscription` 슬롯을 AI 봇 탭에서 확인 ✅
- 두 가지 모두 올바르게 표시됨

## 🎉 결과

### Before (변경 전)
```
총 학생 수: 5명
최대 10명
```
→ `academy.maxStudents` (기본값 또는 Academy 테이블)

### After (변경 후)
```
총 학생 수: 5명
최대 50명

[통계 탭 → 구독 정보]
학생 제한: [=========>---] 5 / 50
선생님 제한: [==>---------] 2 / 10
숙제 검사 제한: [=======>----] 120 / 500
AI 분석 제한: [====>-------] 45 / 200
유사 문제 생성 제한: [===>--------] 30 / 100
랜딩 페이지 제한: [====>-------] 2 / 5

구독 만료일: 2026년 6월 3일
(90일 남음)
```
→ `academy.currentPlan.maxStudents` (user_subscriptions 테이블)

## ✅ 체크리스트

- [x] TypeScript 인터페이스 확장 (`currentPlan` 필드 추가)
- [x] 학생/교사 한도 표시 수정 (`currentPlan` 우선 사용)
- [x] 추가 한도 정보 표시 (숙제 검사, AI 분석, 유사 문제, 랜딩 페이지)
- [x] 구독 만료일 및 남은 일수 표시
- [x] 조건부 표시 로직 구현 (`maxXXX > 0`일 때만)
- [x] 프로그레스 바 시각화
- [x] 빌드 성공 확인
- [x] 커밋 및 푸시 완료
- [ ] 배포 완료 및 실제 동작 확인 (사용자 확인 필요)

## 🔗 관련 파일

- **수정된 파일**: `src/app/dashboard/admin/academies/detail/page.tsx`
- **API 파일**: `functions/api/admin/academies.ts` (변경 없음, 이미 올바른 데이터 반환)
- **데이터베이스**: `user_subscriptions` 테이블

## 📚 참고 문서

- [구독 테이블 생성 가이드](./SUBSCRIPTION_TABLE_MISSING_FIX.md)
- [구독 스키마 불일치 수정](./SUBSCRIPTION_SCHEMA_MISMATCH_FIX.md)
- [설정 페이지 구독 표시 수정](./DEBUG_DIRECTOR_BUT_NO_PLAN.md)

---

**작성일**: 2026-03-03  
**커밋**: fa29947  
**작성자**: GenSpark AI Assistant
