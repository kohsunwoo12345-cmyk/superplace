# 🏫 학원 상세 페이지 기능 추가 완료

## 📋 요청사항
학원 목록에서 학원을 클릭하면 상세 페이지가 나와야 하며, 다음 정보들이 표시되어야 함:
- 구매 중인 AI 봇
- 결제한 요금제
- AI 봇 채팅 수
- 학생 수
- 선생님 수

## ✅ 구현 완료

### 1. API 개선 (functions/api/admin/academies.ts)

**엔드포인트**: `GET /api/admin/academies?id={academyId}`

**추가된 데이터**:
```typescript
{
  // 기존 정보
  ...academyResult,
  
  // 새로 추가된 정보
  assignedBots: [          // AI 봇 할당 정보
    {
      id, name, description,
      assignedAt, status
    }
  ],
  payments: [              // 결제 내역
    {
      id, planName, amount,
      status, createdAt, approvedAt
    }
  ],
  revenue: {               // 매출 요약
    totalRevenue,
    transactionCount
  }
}
```

**쿼리**:
- `ai_bot_assignments` 테이블에서 할당된 AI 봇 조회
- `payment_requests` 테이블에서 결제 내역 조회
- 승인된 결제만 매출에 포함

### 2. 프론트엔드 개선 (src/app/dashboard/admin/academies/detail/page.tsx)

**탭 구조 변경**:
```
이전: 개요 | 학생 | 선생님 | 통계 | 매출

변경: 개요 | AI 봇 | 결제내역 | 학생 | 선생님 | 통계
```

#### 📊 주요 통계 카드 (상단)
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│  총 학생 수   │ 총 선생님 수  │ 통합 대화 수  │   총 매출    │
│   XX명       │   XX명       │   XX회       │  ₩XX,XXX    │
│ 최대 XX명    │ 최대 XX명    │ 출석+숙제    │  XX건 거래   │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

#### 🤖 AI 봇 탭
- **할당된 AI 봇 목록**
  - 봇 아이콘 (보라색)
  - 봇 이름 및 설명
  - 할당일
  - 상태 배지 (활성/비활성)
- **빈 상태**: "할당된 AI 봇이 없습니다"

#### 💳 결제내역 탭
**요약 카드** (3칸):
```
┌─────────────┬─────────────┬─────────────┐
│  총 결제액   │ 승인된 결제  │ 현재 요금제  │
│  ₩XX,XXX    │   XX건      │  BASIC/PRO  │
└─────────────┴─────────────┴─────────────┘
```

**결제 목록**:
- 결제 상태별 아이콘
  - ✅ 승인완료 (초록색)
  - ⏰ 대기중 (노란색)
  - ❌ 거절됨 (빨간색)
- 요금제 이름
- 신청일 / 승인일
- 금액 및 상태 배지

#### 👥 학생/선생님 탭
- 이름, 이메일, 전화번호
- 등록일 표시 추가

#### 📈 통계 탭
- AI 채팅 통계 (출석/숙제/총 활동)
- 구독 정보
  - 구독 플랜 배지
  - 학생/선생님 제한 프로그레스 바

## 📊 배포 정보

### Git 커밋
```
540d1d5 - feat: 학원 상세 페이지에 AI 봇 및 결제내역 탭 추가 (2026-02-13 16:59)
```

### 배포 상태
- **커밋**: 540d1d5
- **배포 시각**: 2026-02-13 16:59
- **예상 반영**: 약 2-3분 (17:02 완료 예상)

### 빌드 결과
```
✓ Compiled successfully in 15.5s
Route: /dashboard/admin/academies/detail    6.21 kB    227 kB
```

## 🧪 테스트 방법

### 1. 학원 목록 접속
```
URL: https://superplacestudy.pages.dev/dashboard/admin/academies/
```

### 2. 학원 클릭
학원 목록에서 학원을 클릭하면 상세 페이지로 이동

### 3. 정보 확인

#### 📊 상단 통계 카드
- 총 학생 수 / 최대 제한
- 총 선생님 수 / 최대 제한
- 통합 대화 수 (출석 + 숙제)
- 총 매출 / 거래 건수

#### 🤖 AI 봇 탭
- 할당된 AI 봇 목록 확인
- 봇 이름, 설명, 할당일, 상태

#### 💳 결제내역 탭
- 총 결제액, 승인된 결제 수
- 현재 요금제 (BASIC, PRO, ENTERPRISE 등)
- 결제 목록:
  - 요금제 이름
  - 금액
  - 상태 (승인완료/대기중/거절됨)
  - 신청일 및 승인일

#### 👥 학생/선생님 탭
- 사용자 목록
- 이름, 이메일, 전화번호, 등록일

#### 📈 통계 탭
- AI 채팅 통계
- 구독 정보 및 제한사항

## 🎯 데이터 구조

### AI 봇 할당 (ai_bot_assignments)
```sql
SELECT 
  ab.id, ab.name, ab.description,
  aba.assignedAt, aba.status
FROM ai_bot_assignments aba
JOIN ai_bots ab ON aba.botId = ab.id
WHERE aba.academyId = ? AND aba.status = 'ACTIVE'
```

### 결제 내역 (payment_requests)
```sql
SELECT 
  id, planName, amount, status,
  createdAt, approvedAt
FROM payment_requests
WHERE academyId = ?
ORDER BY createdAt DESC
```

### 매출 계산
```javascript
const approvedPayments = payments.filter(p => p.status === 'APPROVED');
const totalRevenue = approvedPayments.reduce((sum, p) => sum + p.amount, 0);
const transactionCount = approvedPayments.length;
```

## 🎨 UI 개선사항

### 아이콘 추가
- `Bot` - AI 봇 (보라색)
- `CreditCard` - 결제/요금제 (보라색)
- `CheckCircle` - 승인완료 (초록색)
- `Clock` - 대기중 (노란색)
- `XCircle` - 거절됨 (빨간색)

### 색상 테마
- **AI 봇**: 보라색 (`purple-600`)
- **결제 승인**: 초록색 (`green-600`)
- **결제 대기**: 노란색 (`yellow-600`)
- **결제 거절**: 빨간색 (`red-600`)
- **요금제**: 보라색 (`purple-600`)

## ✅ 완료 체크리스트

✅ API에 학원 상세 조회 엔드포인트 추가 (`?id={academyId}`)  
✅ AI 봇 할당 정보 조회  
✅ 결제 내역 조회  
✅ 매출 계산 (승인된 결제만)  
✅ 프론트엔드에 AI 봇 탭 추가  
✅ 프론트엔드에 결제내역 탭 추가  
✅ 결제 상태별 아이콘 및 색상 표시  
✅ 학생/선생님 등록일 표시  
✅ 빌드 성공  
✅ Git 커밋 및 푸시 완료  

## 🔧 관련 파일

- **API**: `functions/api/admin/academies.ts`
- **프론트엔드**: `src/app/dashboard/admin/academies/detail/page.tsx`

## 📝 추가 개선 가능 사항

### 향후 추가 기능
1. AI 봇 채팅 통계 상세 (봇별)
2. 결제 내역 필터링 (상태별, 날짜별)
3. 학생/선생님 필터 및 검색
4. 월별 매출 차트
5. AI 봇 사용량 차트

---

**작성 시각**: 2026-02-13 17:01  
**배포 커밋**: 540d1d5  
**배포 URL**: https://superplacestudy.pages.dev/dashboard/admin/academies/
