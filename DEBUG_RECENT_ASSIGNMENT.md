# 🔍 최근 할당이 안 되는 문제 디버깅 가이드

## 문제 상황
- ✅ 이전 할당 (중1 수학 문제 출제 AI): 정상 작동
- ❌ 최근 할당: 챗봇에 안 보임, 학생 할당 불가

## 원인 분석

### API 체인
1. **관리자가 학원에 할당**
   ```javascript
   POST /api/admin/academy-bot-subscriptions
   Body: { academyId, productId, ... }
   → AcademyBotSubscription 테이블에 저장
   ```

2. **학원장이 구독 목록 조회**
   ```javascript
   GET /api/user/academy-bot-subscriptions?academyId=xxx
   
   // SQL:
   SELECT 
     s.productId as botId,
     b.name as botName
   FROM AcademyBotSubscription s
   LEFT JOIN ai_bots b ON s.productId = b.id
   WHERE s.academyId = ?
   ```

3. **프론트엔드에서 봇 목록에 추가**
   ```javascript
   subscriptions.forEach((sub: any) => {
     if (sub.botId && !botIds.has(sub.botId)) {
       additionalBots.push({
         id: sub.botId,  // ← productId
         name: sub.botName || sub.productName || `Bot ${sub.botId}`,
         ...
       });
     }
   });
   ```

## 🎯 가능한 원인

### 1. productId가 ai_bots.id와 불일치
**증상**: botName이 NULL로 반환됨

**확인 방법**:
```sql
-- 1. 최근 할당된 구독 확인
SELECT 
  id, academyId, productId, productName,
  subscriptionStart, subscriptionEnd, isActive
FROM AcademyBotSubscription
ORDER BY createdAt DESC
LIMIT 5;

-- 2. productId가 ai_bots에 있는지 확인
SELECT id, name, isActive
FROM ai_bots
WHERE id IN (
  SELECT productId FROM AcademyBotSubscription
  ORDER BY createdAt DESC LIMIT 5
);
```

**해결**: productId를 올바른 봇 ID로 수정
```sql
UPDATE AcademyBotSubscription
SET productId = '올바른봇ID'
WHERE id = '문제있는구독ID';
```

### 2. isActive = 0
**확인**:
```sql
SELECT id, academyId, productId, isActive
FROM AcademyBotSubscription
WHERE isActive = 0
ORDER BY createdAt DESC;
```

**해결**:
```sql
UPDATE AcademyBotSubscription
SET isActive = 1
WHERE id = '구독ID';
```

### 3. subscriptionEnd가 과거 날짜
**확인**:
```sql
SELECT 
  id, academyId, productId,
  subscriptionEnd,
  date(subscriptionEnd) < date('now') as is_expired
FROM AcademyBotSubscription
ORDER BY createdAt DESC
LIMIT 5;
```

**해결**:
```sql
UPDATE AcademyBotSubscription
SET subscriptionEnd = date('now', '+30 days')
WHERE id = '구독ID';
```

### 4. ai_bots.isActive = 0
**확인**:
```sql
SELECT 
  b.id, b.name, b.isActive,
  COUNT(s.id) as subscription_count
FROM ai_bots b
LEFT JOIN AcademyBotSubscription s ON b.id = s.productId
WHERE b.isActive = 0
GROUP BY b.id;
```

**해결**:
```sql
UPDATE ai_bots
SET isActive = 1
WHERE id = '봇ID';
```

### 5. 프론트엔드에서 botId 필터링
**코드** (page.tsx 299-308번):
```javascript
if (sub.botId && !botIds.has(sub.botId)) {
  // botId가 없으면 추가되지 않음!
}
```

**확인**: F12 콘솔에서 다음 로그 확인
```javascript
✅ Academy subscriptions loaded: { subscriptions: [...] }
📊 Subscription count: N
📊 Subscription details: [...]
✅ Added X bots from subscriptions to bot list
```

## 📋 체크리스트

### 단계 1: 데이터 확인 (Cloudflare D1 콘솔)

```sql
-- 최근 할당 5개 조회
SELECT 
  s.id,
  s.academyId,
  a.name as academyName,
  s.productId,
  s.productName,
  b.id as bot_actual_id,
  b.name as bot_actual_name,
  b.isActive as bot_is_active,
  s.isActive as sub_is_active,
  s.subscriptionStart,
  s.subscriptionEnd,
  date(s.subscriptionEnd) >= date('now') as is_valid,
  s.createdAt
FROM AcademyBotSubscription s
LEFT JOIN academy a ON s.academyId = a.id
LEFT JOIN ai_bots b ON s.productId = b.id
ORDER BY s.createdAt DESC
LIMIT 5;
```

**체크 항목**:
- [ ] `productId`가 `bot_actual_id`와 일치하는가?
- [ ] `bot_actual_name`이 NULL이 아닌가?
- [ ] `bot_is_active`가 1인가?
- [ ] `sub_is_active`가 1인가?
- [ ] `is_valid`가 1인가? (만료 안 됨)

### 단계 2: 프론트엔드 확인

1. **관리자 페이지**: https://suplacestudy.com/dashboard/admin/ai-bots/assign/
2. **F12 콘솔 열기**
3. **페이지 새로고침**
4. **다음 로그 확인**:
   ```
   ✅ Academy subscriptions loaded: { subscriptions: [...] }
   📊 Subscription count: N
   📊 Subscription details: [...]
   ```

5. **구독 목록에서 확인**:
   - `botId`가 있는가?
   - `botName`이 있는가?
   - `isActive`가 1인가?

### 단계 3: API 응답 확인

1. **Network 탭 열기**
2. **페이지 새로고침**
3. **`academy-bot-subscriptions` 요청 찾기**
4. **Response 확인**:
   ```json
   {
     "success": true,
     "subscriptions": [
       {
         "id": "...",
         "academyId": "...",
         "academyName": "꾸메땅학원",
         "botId": "???",        // ← productId
         "botName": "???",      // ← ai_bots.name (NULL이면 문제!)
         "totalSlots": 60,
         "usedSlots": 0,
         "remainingSlots": 60,
         "startDate": "2026-03-17",
         "expiresAt": "2026-04-17",
         "isActive": 1
       }
     ]
   }
   ```

## 🔧 수정 방법

### 방법 1: SQL로 직접 수정 (추천)

```sql
-- 1. 문제 있는 레코드 찾기
SELECT 
  s.id,
  s.productId,
  s.productName,
  b.id as bot_id,
  b.name as bot_name
FROM AcademyBotSubscription s
LEFT JOIN ai_bots b ON s.productId = b.id
WHERE b.id IS NULL  -- productId가 ai_bots에 없음!
ORDER BY s.createdAt DESC;

-- 2. 올바른 봇 ID 찾기
SELECT id, name FROM ai_bots WHERE isActive = 1;

-- 3. productId 수정
UPDATE AcademyBotSubscription
SET productId = '올바른봇ID'
WHERE id = '문제있는구독ID';

-- 4. isActive 확인 및 수정
UPDATE AcademyBotSubscription
SET isActive = 1
WHERE isActive = 0 OR isActive IS NULL;

-- 5. 만료일 확인 및 연장
UPDATE AcademyBotSubscription
SET subscriptionEnd = date('now', '+30 days')
WHERE date(subscriptionEnd) < date('now');
```

### 방법 2: 프론트엔드에서 재할당

1. 관리자 페이지 접속
2. 문제 있는 할당 삭제
3. 다시 할당 (올바른 봇 선택)

## 📊 작동하는 할당 vs 안 되는 할당 비교

### 작동하는 할당 (예시)
```json
{
  "id": "sub_xxx",
  "academyId": "academy-001",
  "academyName": "꾸메땅학원",
  "botId": "bot-correct-id",       // ✅ ai_bots.id와 일치
  "botName": "중1 수학 문제 출제 AI", // ✅ ai_bots.name
  "totalSlots": 60,
  "isActive": 1,                    // ✅ 활성화
  "expiresAt": "2053-12-31"        // ✅ 만료 안 됨
}
```

### 안 되는 할당 (예시)
```json
{
  "id": "sub_yyy",
  "academyId": "academy-001",
  "academyName": "꾸메땅학원",
  "botId": "wrong-id",             // ❌ ai_bots에 없음
  "botName": null,                 // ❌ JOIN 실패
  "totalSlots": 30,
  "isActive": 0,                   // ❌ 비활성화
  "expiresAt": "2026-03-01"       // ❌ 만료됨
}
```

## 🎯 최종 확인

배포 후 3-5분 대기한 뒤:

1. **학원장 로그인**
2. **/dashboard/admin/ai-bots/assign/ 접속**
3. **F12 콘솔에서 로그 확인**
4. **"AI 봇" 드롭다운에서 봇 목록 확인**
5. **문제 있으면 위 SQL로 데이터 수정**

---

**핵심**: `productId`가 `ai_bots.id`와 정확히 일치해야 하며, 모든 `isActive`가 1이어야 합니다!
