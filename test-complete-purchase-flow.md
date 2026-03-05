# 🛒 AI 쇼핑몰 전체 플로우 테스트 가이드

**날짜**: 2026-03-05  
**목적**: 제품 추가 → 구매 → 승인 → AI 챗봇 사용 전 과정 검증

---

## 📋 전체 플로우 개요

```
1. 관리자: AI쇼핑몰 제품 추가 (StoreProducts)
   ↓
2. 사용자: 제품 구매 신청 (BotPurchaseRequest)
   ↓
3. 관리자: 구매 승인 (AcademyBotSubscription 생성)
   ↓
4. 사용자: AI 챗봇 페이지에서 구매한 봇 사용
```

---

## 🔍 1단계: 제품 추가 (관리자)

### URL
```
https://superplacestudy.pages.dev/dashboard/admin/store-management/create
```

### 테스트 데이터
- **제품명**: 테스트 AI 봇 상품
- **카테고리**: academy_operation
- **섹션**: academy_bots
- **설명**: 테스트용 AI 봇 상품입니다
- **학생당 월 가격**: 10000원
- **재고**: 무제한 (-1)

### API
- **Endpoint**: `POST /api/admin/store-products`
- **Table**: `StoreProducts`

### 검증
```sql
-- Cloudflare D1 콘솔
SELECT id, name, category, pricePerStudent, isActive 
FROM StoreProducts 
ORDER BY createdAt DESC 
LIMIT 5;
```

**예상 결과**: 새로 생성된 제품이 표시되어야 함

---

## 🛒 2단계: 제품 구매 (사용자)

### URL
```
https://superplacestudy.pages.dev/store
→ 제품 선택
→ https://superplacestudy.pages.dev/store/purchase?id={productId}
```

### 테스트 데이터
- **학생 수**: 10명
- **이용 기간**: 3개월
- **이메일**: test@example.com
- **이름**: 홍길동
- **학원 이름**: 테스트 학원
- **전화번호**: 010-1234-5678

### API
- **Endpoint**: `POST /api/bot-purchase-requests/create`
- **Table**: `BotPurchaseRequest`

### 검증
```sql
-- Cloudflare D1 콘솔
SELECT 
  id, productName, studentCount, months, 
  email, name, requestAcademyName, 
  status, createdAt
FROM BotPurchaseRequest 
ORDER BY createdAt DESC 
LIMIT 5;
```

**예상 결과**:
- `status` = 'PENDING'
- `studentCount` = 10
- `months` = 3
- `email`, `name`, `requestAcademyName` 모두 채워져 있음

---

## ✅ 3단계: 구매 승인 (관리자)

### URL
```
https://superplacestudy.pages.dev/dashboard/admin/bot-shop-approvals
```

### 작업
1. 구매 요청 목록에서 방금 생성한 요청 확인
2. **학원 선택 드롭다운**에서 학원 선택 (필수!)
3. 학생 수 확인 (필요시 수정)
4. **승인** 버튼 클릭

### API
- **Endpoint**: `POST /api/admin/bot-purchase-requests/approve`
- **Tables**: 
  - `BotPurchaseRequest` (status → 'APPROVED')
  - `AcademyBotSubscription` (신규 생성 또는 업데이트)

### 검증

#### A. 구매 요청 상태 확인
```sql
SELECT 
  id, productName, status, approvedBy, approvedAt
FROM BotPurchaseRequest 
WHERE id = '{requestId}';
```

**예상 결과**:
- `status` = 'APPROVED'
- `approvedBy` = 관리자 ID
- `approvedAt` = 승인 시간

#### B. 구독 정보 확인 (핵심!)
```sql
SELECT 
  id, academyId, productId, productName,
  totalStudentSlots, usedStudentSlots, remainingStudentSlots,
  subscriptionStart, subscriptionEnd,
  isActive, createdAt
FROM AcademyBotSubscription 
ORDER BY createdAt DESC 
LIMIT 5;
```

**예상 결과**:
- `academyId` = 선택한 학원 ID
- `productId` = 구매한 제품 ID
- `totalStudentSlots` = 10
- `remainingStudentSlots` = 10
- `isActive` = 1 (또는 NULL, 기본값)
- `subscriptionEnd` > 현재 시간 + 3개월

#### C. ai_bots 테이블 확인
```sql
SELECT id, name, isActive 
FROM ai_bots 
WHERE id = '{productId}';
```

**예상 결과**: productId에 해당하는 봇이 존재하고 isActive = 1

---

## 🤖 4단계: AI 챗봇 사용 (사용자)

### URL
```
https://superplacestudy.pages.dev/ai-chat
```

### 조건
- 사용자가 **학원에 속해 있어야 함** (academyId가 있어야 함)
- User 테이블에서 academyId 확인 필요

### API
- **Endpoint**: `GET /api/user/academy-bots?academyId={academyId}`
- **로직**:
  1. `AcademyBotSubscription`에서 해당 학원의 구독 조회
     - `academyId` = 사용자의 학원 ID
     - `isActive` = 1 (또는 NULL)
     - `subscriptionEnd` >= 오늘
  2. 구독의 `productId` 목록 추출
  3. `ai_bots` 테이블에서 해당 봇 정보 조회

### 검증

#### A. 사용자 학원 ID 확인
```sql
SELECT id, email, name, role, academyId 
FROM User 
WHERE email = 'test@example.com';
```

**중요**: `academyId`가 NULL이면 봇이 표시되지 않음!

#### B. 구독 조회 시뮬레이션
```sql
SELECT productId 
FROM AcademyBotSubscription
WHERE academyId = '{사용자의academyId}'
  AND (isActive = 1 OR isActive IS NULL)
  AND date(subscriptionEnd) >= date('now');
```

**예상 결과**: 구매한 제품의 productId가 반환되어야 함

#### C. 봇 정보 조회
```sql
SELECT id, name, description, isActive
FROM ai_bots
WHERE id IN ('{productId}')
  AND isActive = 1;
```

**예상 결과**: 구매한 봇 정보가 반환되어야 함

---

## 🚨 문제 해결

### "사용 가능한 AI 봇이 없습니다" 에러

#### 원인 1: AcademyBotSubscription 레코드 없음
```sql
-- 확인
SELECT COUNT(*) FROM AcademyBotSubscription;

-- 해결: 구매 승인을 다시 진행
```

#### 원인 2: 사용자에게 academyId가 없음
```sql
-- 확인
SELECT id, email, academyId FROM User WHERE email = 'test@example.com';

-- 해결: 사용자에게 학원 할당
UPDATE User SET academyId = 'academy_xxx' WHERE email = 'test@example.com';
```

#### 원인 3: isActive가 0으로 설정됨
```sql
-- 확인
SELECT id, academyId, productId, isActive 
FROM AcademyBotSubscription 
WHERE academyId = '{academyId}';

-- 해결: isActive를 1로 변경
UPDATE AcademyBotSubscription 
SET isActive = 1 
WHERE academyId = '{academyId}';
```

#### 원인 4: 구독 만료
```sql
-- 확인
SELECT id, subscriptionEnd 
FROM AcademyBotSubscription 
WHERE academyId = '{academyId}';

-- 해결: 만료일 연장
UPDATE AcademyBotSubscription 
SET subscriptionEnd = date('now', '+3 months')
WHERE academyId = '{academyId}';
```

#### 원인 5: productId와 ai_bots의 id가 일치하지 않음
```sql
-- 확인
SELECT 
  s.productId as subscription_product,
  b.id as bot_id,
  b.name as bot_name
FROM AcademyBotSubscription s
LEFT JOIN ai_bots b ON s.productId = b.id
WHERE s.academyId = '{academyId}';

-- 해결: productId를 올바른 봇 ID로 수정
-- 또는 StoreProducts의 botId를 제대로 설정
```

---

## 🎯 핵심 체크리스트

### 제품 추가 단계
- [ ] StoreProducts 테이블에 제품 생성 완료
- [ ] productId 기록 (예: `product_xxx`)
- [ ] isActive = 1

### 구매 단계
- [ ] BotPurchaseRequest 테이블에 요청 생성 완료
- [ ] status = 'PENDING'
- [ ] email, name, requestAcademyName, phoneNumber 모두 입력됨

### 승인 단계
- [ ] 학원 선택 완료 (필수!)
- [ ] BotPurchaseRequest.status = 'APPROVED'
- [ ] AcademyBotSubscription 레코드 생성 완료
- [ ] academyId, productId 정확히 설정됨
- [ ] totalStudentSlots, remainingStudentSlots 설정됨
- [ ] subscriptionEnd가 미래 날짜임

### AI 챗봇 사용 단계
- [ ] 사용자에게 academyId가 있음
- [ ] AcademyBotSubscription에서 해당 학원의 구독 존재
- [ ] isActive = 1 (또는 NULL)
- [ ] subscriptionEnd >= 오늘
- [ ] productId가 ai_bots 테이블의 id와 일치
- [ ] ai_bots.isActive = 1

---

## 🔗 관련 링크

- **쇼핑몰**: https://superplacestudy.pages.dev/store
- **제품 추가**: https://superplacestudy.pages.dev/dashboard/admin/store-management/create
- **승인 관리**: https://superplacestudy.pages.dev/dashboard/admin/bot-shop-approvals
- **AI 챗봇**: https://superplacestudy.pages.dev/ai-chat
- **Cloudflare D1**: Cloudflare Dashboard → Workers & Pages → superplacestudy → D1 Database
- **GitHub**: https://github.com/kohsunwoo12345-cmyk/superplace

---

## 📝 주의사항

1. **학원 선택 필수**: 승인 시 반드시 학원을 선택해야 함
2. **사용자 학원 연결**: 사용자가 학원에 속해 있어야 봇이 표시됨
3. **productId 일치**: StoreProducts의 id와 ai_bots의 id가 일치해야 함
4. **구독 활성화**: isActive = 1 또는 NULL이어야 함
5. **만료일 체크**: subscriptionEnd가 현재보다 미래여야 함

---

**작성일**: 2026-03-05  
**최종 수정**: 2026-03-05
