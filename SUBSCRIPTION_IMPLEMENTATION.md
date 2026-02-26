# 요금제 시스템 구현 완료 문서

## 🎯 구현 완료 항목

### 1. ✅ 데이터베이스 스키마 (migrations/002_subscription_system.sql)

생성된 테이블:
- `pricing_plans`: 요금제 플랜 정보
- `subscription_requests`: 요금제 신청 내역
- `user_subscriptions`: 사용자 구독 정보
- `usage_logs`: 사용량 추적 로그

기본 요금제:
1. 무료 플랜 (5명/월10회/5회/10회/1개)
2. 스타터 (30명/100회/50회/100회/3개) - 50,000원/월
3. 프로 ⭐ (100명/500회/200회/500회/10개) - 100,000원/월
4. 엔터프라이즈 (무제한) - 200,000원/월

### 2. ✅ API 엔드포인트

#### 요금제 조회
- `GET /api/pricing/plans` - 활성 요금제 목록

#### 관리자 요금제 관리
- `POST /api/admin/pricing-plans` - 요금제 생성
- `PUT /api/admin/pricing-plans` - 요금제 수정
- `DELETE /api/admin/pricing-plans?id=xxx` - 요금제 삭제

#### 요금제 신청
- `POST /api/subscription/request` - 요금제 신청
- `GET /api/subscription/request?userId=xxx` - 내 신청 목록

#### 관리자 승인
- `GET /api/admin/subscription-approvals` - 모든 신청 조회
- `POST /api/admin/subscription-approvals` - 승인/거부

#### 구독 정보
- `GET /api/subscription/my-subscription?userId=xxx` - 내 구독 정보

#### 제한 체크
- `POST /api/subscription/check-limit` - 사용량 체크 및 증가

### 3. ✅ 타입 정의 (src/types/subscription.ts)

정의된 타입:
- `PricingPlan` - 요금제 플랜
- `SubscriptionRequest` - 요금제 신청
- `UserSubscription` - 사용자 구독
- `UsageLog` - 사용량 로그

## 📝 사용 방법

### DB 마이그레이션 실행

```bash
# Cloudflare D1 데이터베이스에 마이그레이션 적용
wrangler d1 execute DB --file=migrations/002_subscription_system.sql
```

### API 사용 예시

#### 1. 요금제 목록 조회
```javascript
const response = await fetch('/api/pricing/plans');
const { plans } = await response.json();
```

#### 2. 요금제 신청
```javascript
const response = await fetch('/api/subscription/request', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-123',
    userEmail: 'user@example.com',
    userName: '홍길동',
    planId: 'plan-pro',
    period: '6months',
    paymentMethod: 'card',
    paymentInfo: {
      cardLast4: '1234'
    }
  })
});
```

#### 3. 관리자 승인
```javascript
const response = await fetch('/api/admin/subscription-approvals', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    requestId: 'req-xxx',
    action: 'approve',
    adminEmail: 'admin@example.com',
    adminName: '관리자',
    adminNote: '승인 완료'
  })
});
```

#### 4. 제한 체크 (학생 추가 전)
```javascript
const response = await fetch('/api/subscription/check-limit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-123',
    type: 'student',
    action: 'increment',
    metadata: { studentId: 'student-456' }
  })
});

const { allowed, current, limit, remaining } = await response.json();
if (!allowed) {
  alert('학생 수 제한을 초과했습니다!');
}
```

## 🔧 프론트엔드 통합 필요

아래 UI 페이지들을 구현해야 합니다:

### 1. 요금제 선택 페이지 (/pricing)
- 모든 요금제 카드 표시
- 1개월/6개월/12개월 탭
- 결제 신청 버튼

### 2. 결제 신청 페이지 (/subscription/checkout)
- 선택한 요금제 정보 표시
- 결제 수단 선택 (카드/계좌이체)
- 결제 정보 입력
- 신청 완료

### 3. 내 구독 페이지 (/dashboard/subscription)
- 현재 구독 정보
- 사용량 현황 (진행바)
- 남은 기간
- 갱신/취소

### 4. 관리자 요금제 관리 (/dashboard/admin/pricing)
- 요금제 CRUD
- 제한 설정
- 가격 설정

### 5. 관리자 승인 페이지 (/dashboard/admin/approvals)
- 대기중인 신청 목록
- 승인/거부 버튼
- 상세 정보 모달

## 🚨 제한 적용 위치

다음 기능에 `check-limit` API를 호출하여 제한을 적용해야 합니다:

1. **학생 추가** (`type: 'student'`)
   - `src/app/dashboard/students/page.tsx`
   - 학생 추가 버튼 클릭 시

2. **숙제 검사** (`type: 'homework_check'`)
   - `src/app/dashboard/homework/[id]/check/page.tsx`
   - 숙제 검사 제출 시

3. **AI 역량 분석** (`type: 'ai_analysis'`)
   - AI 분석 실행 버튼 클릭 시

4. **유사문제 출제** (`type: 'similar_problem'`)
   - 유사문제 생성 버튼 클릭 시

5. **랜딩페이지 제작** (`type: 'landing_page'`)
   - `src/app/dashboard/landing/create/page.tsx`
   - 랜딩페이지 생성 시

## 📊 테스트 체크리스트

- [ ] 무료 플랜 제한 (5명 학생 등록 시 6번째 차단)
- [ ] 스타터 플랜 제한 (30명 학생 등록 시 31번째 차단)
- [ ] 프로 플랜 제한 (100명 학생 등록 시 101번째 차단)
- [ ] 엔터프라이즈 무제한 (제한 없이 무한 등록)
- [ ] 월별 사용량 리셋 (다음 달 1일에 숙제/AI 분석 카운트 0으로)
- [ ] 구독 만료 시 모든 기능 차단
- [ ] 관리자 승인 전에는 무료 플랜 유지
- [ ] 관리자 승인 후 즉시 신규 플랜 적용

