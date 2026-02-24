# AI 쇼핑몰 구독 시스템 완전 테스트 가이드

## 🎯 목표
AI 봇 구독 시스템의 모든 기능이 올바르게 작동하는지 확인

---

## 📋 사전 준비

### 1. 데이터베이스 마이그레이션
```bash
# 로컬 환경
cd /home/user/webapp
wrangler d1 execute DB --local --file=schema/complete-migration.sql

# 프로덕션 환경 (주의!)
wrangler d1 execute DB --remote --file=schema/complete-migration.sql
```

### 2. 시스템 검증
```bash
# 모든 테이블과 인덱스 확인
wrangler d1 execute DB --local --file=schema/verify-system.sql
```

### 3. 테스트 계정 준비
- **관리자 계정**: AI 쇼핑몰 제품 관리, 구매 승인
- **학원장 계정**: 구매 신청, 봇 할당
- **학생 계정**: 봇 사용

---

## 🧪 테스트 시나리오

### Phase 1: 제품 관리 (관리자)

#### 1.1 AI 쇼핑몰 제품 생성
**URL**: `/dashboard/admin/store-management/create`

**테스트 데이터**:
```
제품명: AI 수학 튜터
카테고리: 교육
설명: 수학 학습을 도와주는 AI 튜터입니다
학생당 월 가격: 990원
```

**예상 결과**:
- ✅ 제품이 StoreProducts 테이블에 저장됨
- ✅ pricePerStudent = 990

**검증 SQL**:
```sql
SELECT id, name, pricePerStudent 
FROM StoreProducts 
WHERE pricePerStudent > 0 
LIMIT 5;
```

---

### Phase 2: 구매 신청 (학원장)

#### 2.1 AI 쇼핑몰 접속
**URL**: `/store`

**확인 사항**:
- ✅ 학생당 가격이 표시됨 (₩990/학생/월)
- ✅ "구매하기" 버튼 활성화

#### 2.2 구매 신청
**입력 데이터**:
```
학생 수: 50명
개월 수: 3개월
총 금액: 148,500원 (자동 계산)
입금 은행: 국민은행
입금자명: 홍길동
요청 메시지: 50명 학생 구독 신청합니다
```

**예상 결과**:
- ✅ BotPurchaseRequest 테이블에 레코드 생성
- ✅ status = 'PENDING'
- ✅ totalPrice = 148,500

**검증 SQL**:
```sql
SELECT 
  id, productName, studentCount, months, 
  totalPrice, status 
FROM BotPurchaseRequest 
ORDER BY createdAt DESC 
LIMIT 1;
```

---

### Phase 3: 구매 승인 (관리자)

#### 3.1 구매 요청 목록 확인
**URL**: `/dashboard/admin/bot-shop-approvals`

**확인 사항**:
- ✅ 통계 대시보드 표시 (전체/대기/승인/거절/매출)
- ✅ 구매 요청 카드 표시
  - 제품명, 학원명, 학생 수, 개월 수, 총 금액

#### 3.2 상세 정보 확인
**클릭**: "상세보기" 버튼

**확인 사항**:
- ✅ 제품 정보 (이름, 학생당 가격)
- ✅ 구독 정보 (학생 수, 개월, 총 금액, 계산식)
- ✅ 학원 및 신청자 정보
- ✅ 입금 정보 (은행, 입금자명, 첨부파일)

#### 3.3 승인 처리
**클릭**: "승인" 버튼

**예상 결과**:
- ✅ BotPurchaseRequest.status → 'APPROVED'
- ✅ AcademyBotSubscription 레코드 생성
  - totalStudentSlots = 50
  - usedStudentSlots = 0
  - remainingStudentSlots = 50
  - subscriptionEnd = 현재 + 3개월

**검증 SQL**:
```sql
-- 승인된 요청 확인
SELECT id, status, approvedBy, approvedAt 
FROM BotPurchaseRequest 
WHERE status = 'APPROVED' 
ORDER BY approvedAt DESC 
LIMIT 1;

-- 생성된 구독 확인
SELECT 
  id, academyId, productName,
  totalStudentSlots, usedStudentSlots, remainingStudentSlots,
  subscriptionStart, subscriptionEnd
FROM AcademyBotSubscription 
ORDER BY createdAt DESC 
LIMIT 1;
```

---

### Phase 4: 봇 할당 (학원장)

#### 4.1 구독 상태 확인 (선택사항)
**API**: `GET /api/user/bot-subscriptions`

**예상 응답**:
```json
{
  "success": true,
  "data": {
    "subscriptions": [{
      "totalStudentSlots": 50,
      "usedStudentSlots": 0,
      "remainingStudentSlots": 50,
      "isExpired": false,
      "daysRemaining": 90
    }],
    "stats": {
      "totalSlots": 50,
      "usedSlots": 0,
      "remainingSlots": 50
    }
  }
}
```

#### 4.2 학생에게 봇 할당
**URL**: `/dashboard/admin/ai-bots/assign`

**입력 데이터**:
```
AI 봇: (구독한 봇 선택)
사용자: (학생 선택)
기간: 1개월
```

**예상 결과**:
- ✅ 구독 검증 통과
- ✅ 봇 할당 성공
- ✅ 슬롯 차감:
  - usedStudentSlots = 1
  - remainingStudentSlots = 49

**검증 SQL**:
```sql
-- 슬롯 상태 확인
SELECT 
  academyId, productName,
  totalStudentSlots, usedStudentSlots, remainingStudentSlots
FROM AcademyBotSubscription 
WHERE academyId = 'YOUR_ACADEMY_ID';

-- 할당 내역 확인
SELECT 
  botId, userId, academyId, 
  assignedAt, status
FROM ai_bot_assignments 
ORDER BY assignedAt DESC 
LIMIT 1;
```

#### 4.3 슬롯 부족 테스트
**테스트 케이스**: 50개 슬롯을 모두 사용한 후 51번째 할당 시도

**예상 결과**:
```
❌ 사용 가능한 학생 슬롯이 부족합니다.

현재 상태:
- 전체 슬롯: 50개
- 사용 중: 50개
- 남은 슬롯: 0개

추가 슬롯이 필요한 경우 AI 쇼핑몰에서 구독을 추가 신청하세요.
```

---

### Phase 5: 할당 취소 및 슬롯 복구 (학원장)

#### 5.1 봇 할당 취소
**URL**: `/dashboard/admin/ai-bots/assign`

**액션**: 할당 목록에서 "취소" 버튼 클릭

**예상 결과**:
- ✅ 할당 삭제
- ✅ 슬롯 복구:
  - usedStudentSlots = 49
  - remainingStudentSlots = 1

**검증 SQL**:
```sql
-- 슬롯 복구 확인
SELECT 
  academyId, productName,
  totalStudentSlots, usedStudentSlots, remainingStudentSlots
FROM AcademyBotSubscription 
WHERE academyId = 'YOUR_ACADEMY_ID';
```

---

### Phase 6: 추가 구독 (학원장)

#### 6.1 슬롯 추가 구매
**시나리오**: 학생 20명 추가 (2개월)

**입력 데이터**:
```
학생 수: 20명
개월 수: 2개월
총 금액: 39,600원 (20 × 2 × 990)
```

#### 6.2 관리자 승인 후 슬롯 확인

**예상 결과**:
- ✅ 기존 구독에 슬롯 추가 (업데이트)
  - totalStudentSlots = 50 + 20 = 70
  - remainingStudentSlots = (기존 남은 수) + 20
- ✅ 구독 기간 연장 (기존 만료일 + 2개월)

**검증 SQL**:
```sql
SELECT 
  academyId, productName,
  totalStudentSlots, usedStudentSlots, remainingStudentSlots,
  subscriptionEnd
FROM AcademyBotSubscription 
WHERE academyId = 'YOUR_ACADEMY_ID';
```

---

## 🔍 에러 시나리오 테스트

### E1: 구독 없이 봇 할당 시도
**예상 에러**:
```
❌ 이 AI 봇에 대한 구독이 없습니다.
AI 쇼핑몰에서 구독을 신청하거나 관리자에게 문의하세요.
```

### E2: 구독 만료 후 봇 할당 시도
**예상 에러**:
```
❌ 구독이 만료되었습니다 (만료일: 2026-05-24).
새로운 구독을 신청해주세요.
```

### E3: 슬롯 부족 시 봇 할당 시도
**예상 에러**:
```
❌ 사용 가능한 학생 슬롯이 부족합니다.
(상세 정보 표시)
```

---

## 📊 최종 검증 체크리스트

### 데이터베이스
- [ ] StoreProducts.pricePerStudent 컬럼 존재
- [ ] BotPurchaseRequest 테이블 존재 및 데이터 정상
- [ ] AcademyBotSubscription 테이블 존재 및 슬롯 정상
- [ ] 인덱스 10개 이상 생성
- [ ] 트리거 3개 생성

### API 엔드포인트
- [ ] POST /api/bot-purchase-requests/create (구매 신청)
- [ ] GET /api/admin/bot-purchase-requests/list (목록 조회)
- [ ] POST /api/admin/bot-purchase-requests/approve (승인)
- [ ] POST /api/admin/bot-purchase-requests/reject (거절)
- [ ] GET /api/user/bot-subscriptions (구독 상태)
- [ ] POST /api/admin/ai-bots/assign (봇 할당 + 슬롯 차감)
- [ ] DELETE /api/admin/ai-bots/assignments/[id] (취소 + 슬롯 복구)

### 프론트엔드
- [ ] 관리자: 제품 생성 페이지
- [ ] 관리자: 구매 승인 페이지
- [ ] 학원장: AI 쇼핑몰 페이지
- [ ] 학원장: 봇 할당 페이지

### 비즈니스 로직
- [ ] 학생당 가격 × 학생 수 × 개월 수 = 총 금액
- [ ] 승인 시 슬롯 자동 생성
- [ ] 봇 할당 시 슬롯 차감
- [ ] 할당 취소 시 슬롯 복구
- [ ] 슬롯 부족 시 에러 반환
- [ ] 구독 만료 시 에러 반환

---

## 🚀 배포 전 최종 확인

```bash
# 1. 빌드 테스트
npm run build

# 2. 로컬 D1 마이그레이션
wrangler d1 execute DB --local --file=schema/complete-migration.sql

# 3. 로컬 검증
wrangler d1 execute DB --local --file=schema/verify-system.sql

# 4. 프로덕션 D1 마이그레이션 (신중하게!)
wrangler d1 execute DB --remote --file=schema/complete-migration.sql

# 5. 프로덕션 검증
wrangler d1 execute DB --remote --file=schema/verify-system.sql

# 6. Git 커밋 및 푸시
git add -A
git commit -m "feat: AI 쇼핑몰 구독 시스템 완전 검증 및 배포"
git push origin main

# 7. Cloudflare Pages 자동 배포 확인
# https://superplacestudy.pages.dev
```

---

## 📝 트러블슈팅

### 문제: "pricePerStudent 컬럼이 없습니다"
**해결**:
```sql
ALTER TABLE StoreProducts ADD COLUMN pricePerStudent INTEGER DEFAULT 0;
```

### 문제: "AcademyBotSubscription 테이블이 없습니다"
**해결**:
```bash
wrangler d1 execute DB --remote --file=schema/complete-migration.sql
```

### 문제: "슬롯 계산이 맞지 않습니다"
**해결**:
```sql
UPDATE AcademyBotSubscription 
SET remainingStudentSlots = totalStudentSlots - usedStudentSlots,
    updatedAt = datetime('now')
WHERE (totalStudentSlots - usedStudentSlots) != remainingStudentSlots;
```

---

## ✅ 완료!

모든 테스트가 통과하면 AI 쇼핑몰 구독 시스템이 완벽하게 작동합니다! 🎉
