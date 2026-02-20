# 봇 쇼핑몰 결제 승인 시스템

## 📋 개요

학원장이 AI 봇을 구매 신청하면, 관리자가 승인하거나 거절할 수 있는 완전한 결제 승인 시스템입니다.

---

## 🎯 주요 기능

### 1️⃣ 구매 요청 생성 (학원장)
- **API**: `POST /api/bot-purchase-requests`
- 학원장이 봇 쇼핑몰에서 봇 구매 신청
- 구독 기간: 1, 3, 6, 12개월
- 자동 할인 적용:
  - 6개월: 10% 할인
  - 12개월: 20% 할인
- 요청 IP, User-Agent 자동 기록

### 2️⃣ 승인 관리 (관리자)
- **페이지**: `/dashboard/admin/bot-shop-approvals`
- 모든 구매 요청 목록 조회
- 상태별 필터: 전체, 대기중, 승인됨, 거절됨
- 검색: 학원명, 봇 이름, 요청자
- 실시간 통계 대시보드

### 3️⃣ 상세 정보 확인
- 학원 정보
- 봇 정보 (이름, 아이콘, 구독 기간)
- 금액 (할인 적용된 최종 가격)
- 요청자 정보 (이름, 이메일, 사용자 ID)
- 요청 시간, IP 주소, User-Agent
- 승인/거절 이력

### 4️⃣ 승인/거절 처리
- **승인 API**: `POST /api/admin/bot-purchase-requests/[id]/approve`
  - 자동으로 bot_assignments 테이블에 봇 할당 생성
  - 종료일 자동 계산
  - 승인자 및 승인 시간 기록
  
- **거절 API**: `POST /api/admin/bot-purchase-requests/[id]/reject`
  - 거절 사유 필수 입력
  - 거절자 및 거절 시간 기록

---

## 💰 가격 정책

| 기간 | 기본 가격 | 할인율 | 최종 가격 |
|------|----------|--------|----------|
| 1개월 | ₩100,000 | 0% | ₩100,000 |
| 3개월 | ₩300,000 | 0% | ₩300,000 |
| 6개월 | ₩600,000 | 10% | ₩540,000 |
| 12개월 | ₩1,200,000 | 20% | ₩960,000 |

---

## 📊 통계 대시보드

실시간으로 다음 정보를 표시합니다:

- **전체 요청**: 모든 구매 요청 수
- **대기중** 🟡: PENDING 상태 요청 (승인 필요)
- **승인됨** 🟢: APPROVED 상태 요청
- **거절됨** 🔴: REJECTED 상태 요청
- **총 매출**: 승인된 요청의 총 금액

---

## 🔐 보안 추적

각 구매 요청마다 다음 정보를 자동으로 기록합니다:

- **요청 IP**: `CF-Connecting-IP` 헤더에서 추출
- **User-Agent**: 브라우저 및 디바이스 정보
- **요청 시간**: ISO 8601 형식 타임스탬프
- **승인/거절 이력**: 처리자, 처리 시간, 사유

---

## 🗄️ 데이터베이스 스키마

### bot_purchase_requests 테이블

```sql
CREATE TABLE bot_purchase_requests (
  id TEXT PRIMARY KEY,
  academyId TEXT NOT NULL,
  botId TEXT NOT NULL,
  requestedBy TEXT NOT NULL,
  durationMonths INTEGER NOT NULL,
  price INTEGER NOT NULL,
  status TEXT DEFAULT 'PENDING',
  requestedAt TEXT DEFAULT (datetime('now')),
  requestIp TEXT,
  userAgent TEXT,
  notes TEXT,
  approvedAt TEXT,
  approvedBy TEXT,
  rejectedAt TEXT,
  rejectedBy TEXT,
  rejectionReason TEXT,
  FOREIGN KEY (academyId) REFERENCES Academy(id),
  FOREIGN KEY (botId) REFERENCES ai_bots(id),
  FOREIGN KEY (requestedBy) REFERENCES User(id)
);
```

### 상태 값

- `PENDING`: 대기중 (기본값)
- `APPROVED`: 승인됨
- `REJECTED`: 거절됨

---

## 🎨 UI/UX 특징

### 색상 코드
- **대기중**: 노란색 (yellow-600)
- **승인됨**: 초록색 (green-600)
- **거절됨**: 빨간색 (red-600)
- **메인 테마**: 보라색 (purple-600)

### 주요 화면
1. **목록 화면**: 카드 형태로 요청 표시
2. **상세 모달**: 클릭 시 전체 정보 표시
3. **필터**: 상태별 빠른 필터링
4. **검색**: 실시간 검색 기능

---

## 🔄 워크플로우

```
1. 학원장 구매 신청
   ↓
2. 관리자 대시보드에 표시 (PENDING)
   ↓
3. 관리자 상세 정보 확인
   ↓
4-A. 승인 → bot_assignments 생성 → APPROVED
4-B. 거절 (사유 입력) → REJECTED
   ↓
5. 학원장에게 결과 통지 (TODO: 알림 기능)
```

---

## 📡 API 엔드포인트

### 학원장용
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/bot-purchase-requests` | 구매 요청 생성 |

### 관리자용
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/admin/bot-purchase-requests` | 모든 구매 요청 조회 |
| POST | `/api/admin/bot-purchase-requests/[id]/approve` | 요청 승인 |
| POST | `/api/admin/bot-purchase-requests/[id]/reject` | 요청 거절 |

---

## 🚀 접근 방법

### 관리자 대시보드에서
1. `/dashboard/admin` 접속
2. "🛒 봇 쇼핑몰 결제 승인" 카드 클릭
3. 또는 직접 URL: `/dashboard/admin/bot-shop-approvals`

### 권한
- **SUPER_ADMIN**: 모든 기능 접근 가능
- **ADMIN**: 모든 기능 접근 가능
- **DIRECTOR**: 구매 요청만 생성 가능
- **기타**: 접근 불가

---

## 🧪 테스트 시나리오

### 1. 구매 요청 생성 (학원장)
```bash
curl -X POST https://superplacestudy.pages.dev/api/bot-purchase-requests \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "botId": "bot-xxx",
    "durationMonths": 12,
    "notes": "테스트 구매"
  }'
```

### 2. 요청 목록 조회 (관리자)
```bash
curl https://superplacestudy.pages.dev/api/admin/bot-purchase-requests \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 3. 승인 (관리자)
```bash
curl -X POST https://superplacestudy.pages.dev/api/admin/bot-purchase-requests/REQ_ID/approve \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 4. 거절 (관리자)
```bash
curl -X POST https://superplacestudy.pages.dev/api/admin/bot-purchase-requests/REQ_ID/reject \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "예산 초과"}'
```

---

## 📝 TODO / 향후 개선사항

- [ ] 이메일 알림: 승인/거절 시 학원장에게 자동 이메일 발송
- [ ] SMS 알림: 중요 알림을 SMS로 전송
- [ ] 구매 내역 대시보드: 학원장이 자신의 구매 내역 조회
- [ ] 정기 결제: 자동 갱신 옵션
- [ ] 환불 처리: 승인 취소 및 환불 워크플로우
- [ ] 통계 분석: 월별/봇별 판매 통계
- [ ] 할인 쿠폰: 프로모션 코드 시스템
- [ ] 무료 체험: 7일 무료 체험 기간

---

## 🛠️ 배포 정보

- **커밋 ID**: `182dd12`
- **배포 URL**: https://superplacestudy.pages.dev
- **배포 시간**: 약 2-3분
- **페이지 경로**: `/dashboard/admin/bot-shop-approvals`

---

## ✅ 완료된 기능

✅ 구매 요청 생성 API  
✅ 관리자 승인 페이지  
✅ 상세 정보 모달  
✅ 승인/거절 API  
✅ 자동 봇 할당 생성  
✅ 요청 IP/User-Agent 추적  
✅ 실시간 통계 대시보드  
✅ 상태별 필터링  
✅ 검색 기능  
✅ 관리자 대시보드 메뉴 추가  

---

**문서 작성일**: 2026-02-20  
**시스템 버전**: 1.0.0
