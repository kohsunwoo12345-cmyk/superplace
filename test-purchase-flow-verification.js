#!/usr/bin/env node

/**
 * 🧪 AI 쇼핑몰 전체 플로우 자동 검증 스크립트
 * 
 * 이 스크립트는 각 단계에서 필요한 SQL 쿼리를 제공합니다.
 * Cloudflare D1 콘솔에서 직접 실행하세요.
 */

console.log(`
╔═══════════════════════════════════════════════════════════════════════╗
║ 🧪 AI 쇼핑몰 전체 플로우 검증 가이드                                      ║
╚═══════════════════════════════════════════════════════════════════════╝

📍 목적: 제품 추가 → 구매 → 승인 → AI 챗봇 사용까지 전체 검증

🔗 Cloudflare D1 콘솔:
   https://dash.cloudflare.com
   → Workers & Pages → superplacestudy
   → Settings → Bindings → D1 Database → Open Console

---

## 1️⃣ 제품 추가 검증

### 1-1. 최근 생성된 제품 확인
\`\`\`sql
SELECT 
  id, 
  name, 
  category, 
  pricePerStudent, 
  monthlyPrice,
  isActive, 
  createdAt
FROM StoreProducts 
ORDER BY createdAt DESC 
LIMIT 5;
\`\`\`

**예상 결과**: 방금 추가한 제품이 보여야 함
**productId 기록**: ___________________________

---

## 2️⃣ 구매 신청 검증

### 2-1. 최근 구매 신청 확인
\`\`\`sql
SELECT 
  id, 
  productName, 
  studentCount, 
  months,
  email, 
  name, 
  requestAcademyName, 
  phoneNumber,
  status, 
  createdAt
FROM BotPurchaseRequest 
ORDER BY createdAt DESC 
LIMIT 5;
\`\`\`

**예상 결과**:
- status = 'PENDING'
- email, name, requestAcademyName, phoneNumber 모두 채워져 있음

**requestId 기록**: ___________________________

### 2-2. 필수 필드 누락 확인
\`\`\`sql
SELECT 
  id, 
  email, 
  name, 
  requestAcademyName, 
  phoneNumber
FROM BotPurchaseRequest 
WHERE email IS NULL 
   OR name IS NULL 
   OR requestAcademyName IS NULL 
   OR phoneNumber IS NULL;
\`\`\`

**예상 결과**: 레코드 없어야 함 (0 rows)

---

## 3️⃣ 승인 전 사전 검증

### 3-1. 학원 목록 확인
\`\`\`sql
SELECT 
  id, 
  name, 
  createdAt
FROM Academy 
ORDER BY createdAt DESC 
LIMIT 10;
\`\`\`

**선택할 학원 ID 기록**: ___________________________

### 3-2. 제품-봇 연결 확인
\`\`\`sql
-- StoreProducts의 productId와 ai_bots의 id가 일치하는지 확인
SELECT 
  'StoreProducts' as source,
  id, 
  name
FROM StoreProducts
WHERE id = '{productId}'

UNION ALL

SELECT 
  'ai_bots' as source,
  id, 
  name
FROM ai_bots
WHERE id = '{productId}';
\`\`\`

**예상 결과**: 같은 id가 두 테이블에 모두 존재해야 함

---

## 4️⃣ 승인 후 검증

### 4-1. 구매 요청 상태 확인
\`\`\`sql
SELECT 
  id, 
  productName, 
  status, 
  approvedBy, 
  approvedAt,
  updatedAt
FROM BotPurchaseRequest 
WHERE id = '{requestId}';
\`\`\`

**예상 결과**:
- status = 'APPROVED'
- approvedBy = 관리자 ID
- approvedAt = 승인 시간

### 4-2. 구독 생성 확인 (핵심!)
\`\`\`sql
SELECT 
  id, 
  academyId, 
  productId, 
  productName,
  totalStudentSlots, 
  usedStudentSlots, 
  remainingStudentSlots,
  subscriptionStart, 
  subscriptionEnd,
  isActive,
  createdAt, 
  updatedAt
FROM AcademyBotSubscription 
WHERE academyId = '{선택한academyId}'
  AND productId = '{productId}'
ORDER BY createdAt DESC;
\`\`\`

**예상 결과**:
- academyId = 승인 시 선택한 학원 ID
- productId = 구매한 제품 ID
- totalStudentSlots = 구매한 학생 수
- remainingStudentSlots = 구매한 학생 수 (아직 사용 전)
- subscriptionEnd > 현재 시간 + N개월
- isActive = 1 또는 NULL

### 4-3. 구독 활성화 상태 확인
\`\`\`sql
SELECT 
  id,
  academyId,
  productId,
  CASE 
    WHEN isActive IS NULL THEN 'NULL (기본 활성)'
    WHEN isActive = 1 THEN '활성'
    WHEN isActive = 0 THEN '비활성'
    ELSE '알 수 없음'
  END as status,
  date(subscriptionEnd) as endDate,
  date('now') as today,
  CASE 
    WHEN date(subscriptionEnd) >= date('now') THEN '유효'
    ELSE '만료'
  END as validity
FROM AcademyBotSubscription 
WHERE academyId = '{academyId}';
\`\`\`

**예상 결과**: status = '활성' 또는 'NULL (기본 활성)', validity = '유효'

---

## 5️⃣ AI 챗봇 사용 검증

### 5-1. 사용자 학원 연결 확인
\`\`\`sql
SELECT 
  id, 
  email, 
  name, 
  role, 
  academyId,
  CASE 
    WHEN academyId IS NULL THEN '❌ 학원 미연결'
    ELSE '✅ 학원 연결됨'
  END as connection_status
FROM User 
WHERE email = '{사용자이메일}';
\`\`\`

**중요**: academyId가 NULL이면 봇이 표시되지 않음!

### 5-2. 봇 조회 시뮬레이션
\`\`\`sql
-- Step 1: 학원의 구독 조회
SELECT 
  productId,
  productName,
  totalStudentSlots,
  remainingStudentSlots,
  subscriptionEnd
FROM AcademyBotSubscription
WHERE academyId = '{사용자의academyId}'
  AND (isActive = 1 OR isActive IS NULL)
  AND date(subscriptionEnd) >= date('now');
\`\`\`

**예상 결과**: productId 목록이 반환되어야 함

\`\`\`sql
-- Step 2: 봇 정보 조회
SELECT 
  id, 
  name, 
  description, 
  isActive,
  profileIcon,
  model
FROM ai_bots
WHERE id IN ('{productId1}', '{productId2}')  -- 위에서 조회된 productId 입력
  AND isActive = 1;
\`\`\`

**예상 결과**: 구매한 봇 정보가 표시되어야 함

### 5-3. 전체 플로우 검증 쿼리 (통합)
\`\`\`sql
-- 사용자가 볼 수 있는 봇 확인 (전체 조인)
SELECT 
  u.email as user_email,
  u.academyId as user_academy,
  s.productId as subscription_product,
  s.productName as subscription_name,
  s.subscriptionEnd as subscription_end,
  s.isActive as subscription_active,
  b.id as bot_id,
  b.name as bot_name,
  b.isActive as bot_active
FROM User u
LEFT JOIN AcademyBotSubscription s ON u.academyId = s.academyId
  AND (s.isActive = 1 OR s.isActive IS NULL)
  AND date(s.subscriptionEnd) >= date('now')
LEFT JOIN ai_bots b ON s.productId = b.id
  AND b.isActive = 1
WHERE u.email = '{사용자이메일}';
\`\`\`

**예상 결과**: 봇 정보가 표시되면 성공, NULL이면 문제 있음

---

## 🚨 문제 해결

### A. "사용 가능한 AI 봇이 없습니다" 에러

#### 원인 1: AcademyBotSubscription 레코드 없음
\`\`\`sql
-- 확인
SELECT COUNT(*) as subscription_count 
FROM AcademyBotSubscription;

-- 없으면 구매 승인을 다시 진행해야 함
\`\`\`

#### 원인 2: 사용자에게 academyId가 없음
\`\`\`sql
-- 확인 및 수정
UPDATE User 
SET academyId = '{올바른academyId}' 
WHERE email = '{사용자이메일}';

-- 확인
SELECT id, email, academyId FROM User WHERE email = '{사용자이메일}';
\`\`\`

#### 원인 3: isActive가 0으로 설정됨
\`\`\`sql
-- 확인
SELECT id, academyId, isActive 
FROM AcademyBotSubscription 
WHERE academyId = '{academyId}';

-- 수정
UPDATE AcademyBotSubscription 
SET isActive = 1 
WHERE academyId = '{academyId}';
\`\`\`

#### 원인 4: 구독 만료
\`\`\`sql
-- 확인
SELECT 
  id, 
  subscriptionEnd,
  date('now') as today,
  CASE 
    WHEN date(subscriptionEnd) >= date('now') THEN '유효'
    ELSE '만료'
  END as status
FROM AcademyBotSubscription 
WHERE academyId = '{academyId}';

-- 수정 (3개월 연장)
UPDATE AcademyBotSubscription 
SET subscriptionEnd = date('now', '+3 months')
WHERE academyId = '{academyId}';
\`\`\`

#### 원인 5: productId와 ai_bots의 id 불일치
\`\`\`sql
-- 확인
SELECT 
  s.productId as subscription_product,
  b.id as bot_id,
  b.name as bot_name,
  CASE 
    WHEN b.id IS NULL THEN '❌ 봇 없음'
    ELSE '✅ 봇 존재'
  END as status
FROM AcademyBotSubscription s
LEFT JOIN ai_bots b ON s.productId = b.id
WHERE s.academyId = '{academyId}';

-- 수정 (올바른 봇 ID로 변경)
UPDATE AcademyBotSubscription 
SET productId = '{올바른봇ID}' 
WHERE academyId = '{academyId}' AND productId = '{잘못된productId}';
\`\`\`

---

## ✅ 최종 체크리스트

제품 추가:
- [ ] StoreProducts에 제품 존재
- [ ] productId 기록됨

구매 신청:
- [ ] BotPurchaseRequest에 요청 존재
- [ ] status = 'PENDING'
- [ ] email, name, requestAcademyName, phoneNumber 모두 입력

승인 완료:
- [ ] BotPurchaseRequest.status = 'APPROVED'
- [ ] AcademyBotSubscription 레코드 생성됨
- [ ] academyId, productId 정확함
- [ ] totalStudentSlots, remainingStudentSlots 설정됨
- [ ] subscriptionEnd가 미래 날짜
- [ ] isActive = 1 또는 NULL

AI 챗봇 표시:
- [ ] 사용자에게 academyId 있음
- [ ] 구독이 활성 상태 (isActive = 1 또는 NULL)
- [ ] 구독이 만료되지 않음 (subscriptionEnd >= 오늘)
- [ ] productId가 ai_bots.id와 일치
- [ ] ai_bots.isActive = 1
- [ ] /api/user/academy-bots API가 봇 반환

---

## 🔗 관련 링크

- 프로젝트: https://superplacestudy.pages.dev
- GitHub: https://github.com/kohsunwoo12345-cmyk/superplace
- Cloudflare D1: https://dash.cloudflare.com

---

실행 시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}

`);
