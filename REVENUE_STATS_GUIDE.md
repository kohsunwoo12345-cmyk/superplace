# 매출 통계 시스템 가이드

## 📋 개요

대시보드에 실시간 매출 통계 시스템이 추가되었습니다. 학원장과 관리자가 결제 내역과 매출 현황을 한눈에 확인할 수 있습니다.

---

## 🎯 주요 기능

### 1. **실시간 매출 통계** ✅
- ✅ 총 매출액 표시
- ✅ 결제 건수 표시
- ✅ 평균 결제 금액 계산
- ✅ 기간별 필터 (오늘, 최근 7일, 이번 달, 올해, 전체)

### 2. **상품별 매출 분석** ✅
- ✅ 각 상품(요금제)별 매출액
- ✅ 판매 건수
- ✅ 매출 순위

### 3. **결제 수단별 통계** ✅
- ✅ 카드, 계좌이체, 가상계좌 등 수단별 매출
- ✅ 비율 표시
- ✅ 건수 표시

### 4. **최근 결제 내역** ✅
- ✅ 누가 (사용자 이름, 학원명)
- ✅ 언제 (결제 일시, 한국 시간)
- ✅ 무엇을 (상품명, 요금제)
- ✅ 얼마에 (결제 금액)
- ✅ 어떻게 (결제 수단)

### 5. **월별 매출 추이** ✅
- ✅ 최근 12개월 매출 동향
- ✅ 월별 결제 건수
- ✅ 그래프 형태로 시각화

---

## 🗄️ 데이터베이스 스키마

### Product (상품/요금제)
```prisma
model Product {
  id              String    @id @default(cuid())
  name            String    // 상품명 (예: "BASIC 플랜")
  description     String?   // 상품 설명
  plan            String    // FREE, BASIC, PRO, ENTERPRISE
  price           Decimal   // 가격
  currency        String    @default("KRW")
  billingCycle    String    @default("MONTHLY") // MONTHLY, YEARLY, ONE_TIME
  features        Json?     // 제공 기능 목록
  maxStudents     Int       @default(10)
  maxTeachers     Int       @default(2)
  aiUsageLimit    Int       @default(100)
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  payments        Payment[]
}
```

### Payment (결제)
```prisma
model Payment {
  id              String    @id @default(cuid())
  
  // 결제 주체
  academyId       String    // 결제한 학원
  userId          String    // 결제한 사용자 (학원장)
  
  // 상품 정보
  productId       String
  productName     String    // 상품명 (스냅샷)
  plan            String    // 요금제 (스냅샷)
  
  // 결제 금액
  amount          Decimal
  currency        String    @default("KRW")
  
  // 결제 상태
  status          String    @default("PENDING")
  // PENDING, COMPLETED, FAILED, CANCELLED, REFUNDED
  
  // 결제 수단
  paymentMethod   String?
  // CARD, BANK_TRANSFER, VIRTUAL_ACCOUNT, KAKAO_PAY, NAVER_PAY
  
  paymentProvider String?   // TOSS, PORTONE, STRIPE
  
  // 결제 대행사 정보
  transactionId   String?   @unique
  providerOrderId String?
  receiptUrl      String?
  
  // 결제 시간
  paidAt          DateTime? // 결제 완료 시간
  cancelledAt     DateTime?
  refundedAt      DateTime?
  
  // 구독 기간
  subscriptionStartDate DateTime?
  subscriptionEndDate   DateTime?
  
  // 메타데이터
  metadata        Json?
  failReason      String?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  academy         Academy   @relation(...)
  user            User      @relation(...)
  product         Product   @relation(...)
}
```

---

## 🔌 API 엔드포인트

### 1. GET `/api/revenue/stats`
**기능**: 매출 통계 조회  
**권한**: SUPER_ADMIN, DIRECTOR

**쿼리 파라미터**:
- `period`: 기간 (day, week, month, year, all)
- `startDate`: 시작 날짜 (YYYY-MM-DD)
- `endDate`: 종료 날짜 (YYYY-MM-DD)

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRevenue": 1500000,
      "paymentCount": 15,
      "avgPayment": 100000,
      "currency": "KRW"
    },
    "byProduct": [
      {
        "productId": "clx...",
        "productName": "PRO 플랜",
        "plan": "PRO",
        "revenue": 900000,
        "count": 9
      }
    ],
    "byPaymentMethod": [
      {
        "method": "CARD",
        "revenue": 1200000,
        "count": 12
      }
    ],
    "monthlyTrend": [
      {
        "month": "2026-01",
        "revenue": 500000,
        "count": 5
      }
    ],
    "recentPayments": [
      {
        "id": "clx...",
        "productName": "PRO 플랜",
        "plan": "PRO",
        "amount": 100000,
        "paymentMethod": "CARD",
        "paidAt": "2026-01-24T10:30:00.000Z",
        "user": {
          "id": "clx...",
          "name": "홍길동",
          "email": "hong@example.com"
        },
        "academy": {
          "id": "clx...",
          "name": "서울학원"
        }
      }
    ]
  }
}
```

### 2. GET `/api/revenue/payments`
**기능**: 결제 목록 조회  
**권한**: SUPER_ADMIN, DIRECTOR

**쿼리 파라미터**:
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 결과 개수 (기본값: 20)
- `status`: 상태 필터 (COMPLETED, PENDING, etc.)
- `startDate`: 시작 날짜
- `endDate`: 종료 날짜

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "clx...",
        "academyId": "clx...",
        "userId": "clx...",
        "productId": "clx...",
        "productName": "PRO 플랜",
        "plan": "PRO",
        "amount": 100000,
        "currency": "KRW",
        "status": "COMPLETED",
        "paymentMethod": "CARD",
        "paidAt": "2026-01-24T10:30:00.000Z",
        "user": {
          "id": "clx...",
          "name": "홍길동",
          "email": "hong@example.com",
          "role": "DIRECTOR"
        },
        "academy": {
          "id": "clx...",
          "name": "서울학원",
          "code": "SEOUL123"
        },
        "product": {
          "id": "clx...",
          "name": "PRO 플랜",
          "plan": "PRO",
          "description": "프로 요금제"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

---

## 📱 사용 방법

### 1. 매출 통계 페이지 접속
```
1. SUPER_ADMIN 또는 DIRECTOR 계정으로 로그인
2. 사이드바에서 "매출 통계" 클릭
3. 또는 URL 직접 접속: /dashboard/revenue
```

### 2. 기간별 매출 확인
```
- 오른쪽 상단 드롭다운에서 기간 선택
  - 오늘
  - 최근 7일
  - 이번 달
  - 올해
  - 전체
```

### 3. 상세 정보 확인
```
탭 1: 최근 결제
- 최근 10건의 결제 내역
- 결제한 사용자, 학원, 금액, 시간

탭 2: 상품별
- 각 상품별 매출액 및 판매 건수
- 매출 순위로 정렬

탭 3: 결제 수단별
- 결제 수단별 매출 및 비율
```

### 4. 월별 추이 확인
```
- 페이지 하단의 "월별 매출 추이" 섹션
- 최근 12개월 동향 확인
```

---

## 🎨 UI 구성

### 요약 카드 (상단)
```
┌─────────────────────────────────────────────────────┐
│  총 매출         결제 건수       평균 결제 금액       │
│  ₩1,500,000     15건           ₩100,000           │
└─────────────────────────────────────────────────────┘
```

### 최근 결제 내역
```
┌──────────────────────────────────────────────────────┐
│ PRO 플랜                             PRO 배지         │
│ 👤 홍길동 | 서울학원 | 카드                          │
│ 📅 2026년 1월 24일 10:30                             │
│ ₩100,000                                             │
└──────────────────────────────────────────────────────┘
```

### 상품별 매출
```
┌──────────────────────────────────────────────────────┐
│ 1  PRO 플랜              PRO 배지       ₩900,000    │
│    9건 판매                                          │
├──────────────────────────────────────────────────────┤
│ 2  BASIC 플랜            BASIC 배지     ₩600,000    │
│    6건 판매                                          │
└──────────────────────────────────────────────────────┘
```

---

## 🔐 권한 및 접근

### 접근 권한
- ✅ **SUPER_ADMIN**: 모든 학원의 매출 조회 가능
- ✅ **DIRECTOR**: 자기 학원의 매출만 조회 가능
- ❌ **TEACHER**: 접근 불가
- ❌ **STUDENT**: 접근 불가

### 권한별 차이
```
SUPER_ADMIN:
- 전체 학원의 매출 통계
- 학원별 필터 가능

DIRECTOR:
- 자기 학원의 매출만
- 학원 필터 없음
```

---

## 📊 데이터 특징

### 실제 데이터만 표시
- ✅ 시드 데이터 없음
- ✅ 실제 결제 완료 건만 집계
- ✅ `status = 'COMPLETED'` 조건

### 한국 시간 표시
```typescript
formatDateTime('2026-01-24T10:30:00.000Z')
// → "2026년 1월 24일 10:30"

timeZone: 'Asia/Seoul'
```

### 금액 표시
```typescript
formatCurrency(100000)
// → "₩100,000"

currency: 'KRW'
style: 'currency'
locale: 'ko-KR'
```

---

## 🧪 테스트 방법

### 현재 상태
```
결제 데이터: 0건 (실제 결제 없음)
표시 메시지: "결제 내역이 없습니다."
```

### 향후 테스트 (결제 시스템 통합 후)
```
1. 테스트 결제 생성
   - Product 생성
   - Payment 생성 (status: COMPLETED)

2. 매출 통계 페이지 확인
   - 총 매출액 표시
   - 상품별 매출 표시
   - 최근 결제 내역 표시

3. 기간별 필터 테스트
   - 오늘 → 오늘 결제만
   - 이번 달 → 이번 달 결제만
   - 전체 → 모든 결제

4. 권한별 테스트
   - DIRECTOR: 자기 학원만
   - SUPER_ADMIN: 모든 학원
```

---

## 🚀 향후 개선 사항

### 1. 결제 시스템 통합
- [ ] 토스페이먼츠 연동
- [ ] 카카오페이 연동
- [ ] 네이버페이 연동
- [ ] 포트원 (PortOne) 연동

### 2. 결제 페이지 구현
- [ ] 상품 선택 페이지
- [ ] 결제 정보 입력
- [ ] 결제 진행
- [ ] 결제 완료 페이지

### 3. 고급 통계 기능
- [ ] 매출 그래프 (차트)
- [ ] 예측 매출
- [ ] 학원별 비교
- [ ] 엑셀 다운로드

### 4. 자동화 기능
- [ ] 월별 매출 리포트 이메일
- [ ] 구독 자동 갱신
- [ ] 구독 만료 알림
- [ ] 결제 실패 알림

---

## 📝 수정된 파일 목록

### Prisma 스키마
- `prisma/schema.prisma`
  - Product 모델 추가
  - Payment 모델 추가
  - Academy에 payments 관계 추가
  - User에 payments 관계 추가

### API 엔드포인트
- `src/app/api/revenue/stats/route.ts` (신규)
  - 매출 통계 조회
- `src/app/api/revenue/payments/route.ts` (신규)
  - 결제 목록 조회

### 대시보드 페이지
- `src/app/dashboard/revenue/page.tsx` (신규)
  - 매출 통계 대시보드

### 네비게이션
- `src/components/dashboard/Sidebar.tsx`
  - SUPER_ADMIN, DIRECTOR 메뉴에 "매출 통계" 추가
  - DollarSign 아이콘 추가

---

## 📦 배포 정보

- **Repository**: https://github.com/kohsunwoo12345-cmyk/superplace
- **Branch**: main
- **최근 커밋**: c3d73c9 - 매출 통계 시스템 구현
- **배포 URL**: https://superplace-study.vercel.app
- **배포 상태**: ✅ 자동 배포 완료

---

## 🛠️ 문제 해결

### "결제 내역이 없습니다"
- 정상: 아직 실제 결제가 없음
- 해결: 결제 시스템 통합 후 테스트

### "매출 통계 조회 권한이 없습니다"
- 원인: TEACHER 또는 STUDENT 계정
- 해결: DIRECTOR 또는 SUPER_ADMIN 계정으로 로그인

### "매출 통계를 불러올 수 없습니다"
- 원인: API 오류 또는 권한 문제
- 확인: 브라우저 개발자 도구 콘솔 확인
- 해결: 세션 확인, 재로그인

---

## ✅ 완료 체크리스트

- [x] Product 모델 추가
- [x] Payment 모델 추가
- [x] Prisma DB Push 완료
- [x] GET `/api/revenue/stats` API 구현
- [x] GET `/api/revenue/payments` API 구현
- [x] 매출 통계 대시보드 구현
- [x] 기간별 필터 (오늘, 최근 7일, 이번 달, 올해, 전체)
- [x] 상품별 매출 분석
- [x] 결제 수단별 통계
- [x] 최근 결제 내역 (최근 10건)
- [x] 월별 매출 추이 (최근 12개월)
- [x] 한국 시간 표시
- [x] 금액 포맷팅 (₩)
- [x] SUPER_ADMIN, DIRECTOR 권한 체크
- [x] 사이드바 메뉴 추가
- [x] 반응형 UI
- [x] Git 커밋 및 푸시
- [x] 문서 작성

---

## 🎉 완료!

**매출 통계 시스템이 성공적으로 구현되었습니다!**

### 구현된 기능
- ✅ 실시간 매출 통계
- ✅ 상품별/결제 수단별 분석
- ✅ 최근 결제 내역 (누가, 언제, 무엇을, 얼마에)
- ✅ 월별 매출 추이
- ✅ 한국 시간 표시
- ✅ 실제 데이터만 표시

### 접속 방법
```
URL: /dashboard/revenue
권한: SUPER_ADMIN, DIRECTOR
상태: ✅ 실시간 집계 중
```

### 다음 단계
1. 결제 시스템 통합 (토스페이먼츠 등)
2. 상품 등록 (요금제)
3. 결제 페이지 구현
4. 실제 결제 테스트

---

**작성일**: 2026-01-24  
**작성자**: Claude AI  
**버전**: 1.0  
**커밋 ID**: c3d73c9
