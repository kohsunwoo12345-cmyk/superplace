# AI 봇 할당 문제 분석 및 해결 방안

## 📋 문제 현황

관리자가 AI봇 할당하기 페이지에서 학원에 할당을 할 때 **정확하게 할당이 안되며 할당 목록에도 안나오고 있음**.

## 🔍 근본 원인 분석

### 1. **DB 스키마 불일치 문제**
   
현재 코드는 `AcademyBotSubscription` 테이블을 참조하지만, 실제 DB에서 테이블 존재 여부와 컬럼명이 불일치할 가능성이 있습니다.

**Schema 파일 (`schema/bot-subscription-system.sql`):**
```sql
CREATE TABLE IF NOT EXISTS AcademyBotSubscription (
  id TEXT PRIMARY KEY,
  academyId TEXT NOT NULL,
  productId TEXT NOT NULL,
  productName TEXT NOT NULL,
  purchaseRequestId TEXT NOT NULL,
  totalStudentSlots INTEGER NOT NULL,
  usedStudentSlots INTEGER DEFAULT 0,
  remainingStudentSlots INTEGER NOT NULL,
  subscriptionStartDate TEXT NOT NULL,  -- ⚠️ subscriptionStartDate
  subscriptionEndDate TEXT NOT NULL,    -- ⚠️ subscriptionEndDate
  isActive INTEGER DEFAULT 1,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
```

**API 코드 (`functions/api/admin/ai-bots/assign.ts`):**
```typescript
// Line 147-151: 구독 조회 시 사용하는 컬럼명
const subscription = await DB.prepare(`
  SELECT * FROM AcademyBotSubscription 
  WHERE academyId = ? AND productId = ?
  ORDER BY subscriptionEnd DESC  -- ⚠️ subscriptionEnd (X)
  LIMIT 1
`).bind(userAcademyId, botId).first();
```

**🚨 문제점:**
- Schema: `subscriptionStartDate`, `subscriptionEndDate`
- API Code: `subscriptionStart`, `subscriptionEnd`
- **컬럼명 불일치로 인해 구독 정보를 조회하지 못함**

### 2. **할당 API 흐름 문제**

**현재 흐름:**
1. `/api/admin/ai-bots/assign` (POST) - 개별 학생에게 할당
2. `AcademyBotSubscription` 테이블에서 구독 정보 조회
3. `remainingStudentSlots` 확인
4. `ai_bot_assignments` 테이블에 할당 저장
5. `AcademyBotSubscription` 테이블의 슬롯 차감

**문제점:**
- `remainingStudentSlots`가 0이면 할당 불가 (정상)
- 하지만 구독 정보 조회 실패 시 아무런 할당도 안 됨
- 에러 메시지가 사용자에게 명확하게 전달되지 않음

### 3. **관리자 vs 학원장 할당 흐름 분리 필요**

현재 코드는 두 가지 할당 방식이 혼재되어 있습니다:

**방식 A:** 관리자가 학원에 봇 구독 할당
- 페이지: `/dashboard/admin/assign-academy-bot`
- API: `/api/admin/academy-bot-subscriptions` (POST)
- 테이블: `AcademyBotSubscription`
- 목적: 학원에 AI 봇 사용 권한 + 학생 수 제한 부여

**방식 B:** 학원장이 개별 학생에게 봇 할당
- 페이지: `/dashboard/admin/ai-bots/assign`
- API: `/api/admin/ai-bots/assign` (POST)
- 테이블: `ai_bot_assignments` + `AcademyBotSubscription` (슬롯 차감)
- 목적: 구독 범위 내에서 학생에게 봇 할당

**🚨 문제점:**
- 두 흐름이 제대로 연결되지 않음
- 학원장이 할당 시 구독 정보를 찾지 못하면 실패함

### 4. **할당 목록 조회 문제**

**API:** `/api/admin/ai-bots/assignments` (GET)

현재 코드는 `ai_bot_assignments` 테이블만 조회하는데, 다음 문제가 있을 수 있습니다:

1. **DIRECTOR/TEACHER 권한 체크 시 academyId 누락**
   ```typescript
   // Line 127-160: academyId가 없으면 오류 반환
   if (role === 'DIRECTOR' || role === 'TEACHER') {
     if (!userAcademyId) {
       return new Response(JSON.stringify({
         success: false,
         error: 'No academy assigned',
         message: '학원이 배정되지 않았습니다'
       }), { status: 400 });
     }
   }
   ```

2. **userId 타입 불일치**
   - 할당 API에서 `userId`를 TEXT로 저장: `userId TEXT NOT NULL`
   - 프론트엔드에서 `parseInt(selectedUser)` 전송
   - DB 조회 시 타입 불일치 가능성

### 5. **중복 할당 방지 로직 부재**

현재 코드에는 **이미 해당 봇을 할당받은 학생**에게 중복으로 할당되는 것을 막는 로직이 없습니다.

**필요한 검증:**
```sql
SELECT id FROM ai_bot_assignments 
WHERE userId = ? AND botId = ? AND status = 'active'
```

### 6. **할당 카운트 정확성 문제**

**시나리오:**
- A봇 30명 구매
- 학생 30명에게 할당 완료
- 학생 1명 퇴원 (할당 취소)
- 새 학생 1명에게 재할당 가능해야 함

**현재 구현:**
- 할당: `usedStudentSlots + 1`, `remainingStudentSlots - 1` ✅
- 취소: `usedStudentSlots - 1`, `remainingStudentSlots + 1` ✅

**검증 필요:**
- 실제로 슬롯 복원이 작동하는지 확인
- 음수 방지 로직 확인: `CASE WHEN usedStudentSlots > 0 THEN usedStudentSlots - 1 ELSE 0 END` ✅

## 🔧 해결 방안

### 1. **DB 스키마 컬럼명 통일**

**Option A: Schema 파일 수정 (권장)**
```sql
-- schema/bot-subscription-system.sql 수정
subscriptionStart TEXT NOT NULL,  -- subscriptionStartDate → subscriptionStart
subscriptionEnd TEXT NOT NULL,    -- subscriptionEndDate → subscriptionEnd
```

**Option B: API 코드 수정**
```typescript
// functions/api/admin/ai-bots/assign.ts
ORDER BY subscriptionEndDate DESC  -- subscriptionEnd → subscriptionEndDate
```

**결정:** API 코드를 수정하여 Schema와 일치시킴 (이미 생성된 테이블을 고려)

### 2. **구독 정보 조회 강화**

```typescript
// 구독 정보 조회 시 상세 로깅 추가
console.log('🔍 Checking subscription:', {
  academyId: userAcademyId,
  productId: botId,
  table: 'AcademyBotSubscription'
});

const subscription = await DB.prepare(`
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
    isActive
  FROM AcademyBotSubscription 
  WHERE academyId = ? AND productId = ?
  ORDER BY subscriptionEnd DESC
  LIMIT 1
`).bind(userAcademyId, botId).first();

if (!subscription) {
  console.error('❌ No subscription found for:', { academyId: userAcademyId, productId: botId });
  // 상세 오류 메시지 반환
}
```

### 3. **중복 할당 방지 로직 추가**

```typescript
// 할당 전 중복 확인
const existingAssignment = await DB.prepare(`
  SELECT id FROM ai_bot_assignments 
  WHERE userId = ? AND botId = ? AND status = 'active'
`).bind(userId, botId).first();

if (existingAssignment) {
  return new Response(JSON.stringify({
    success: false,
    error: 'Already assigned',
    message: '이 학생은 이미 해당 봇을 할당받았습니다.'
  }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### 4. **할당 카운트 정확성 검증**

**Test Script 작성:**
```bash
#!/bin/bash
# test-bot-assignment-counting.sh

# 1. 학원에 봇 구독 할당 (30명)
curl -X POST /api/admin/academy-bot-subscriptions \
  -d '{"academyId": "test-academy", "productId": "bot-1", "studentCount": 30, ...}'

# 2. 학생 30명에게 할당
for i in {1..30}; do
  curl -X POST /api/admin/ai-bots/assign \
    -d '{"botId": "bot-1", "userId": "student-$i", ...}'
done

# 3. 슬롯 확인 (남은 슬롯 = 0)
curl /api/admin/academy-bot-subscriptions?academyId=test-academy

# 4. 31번째 할당 시도 (실패해야 함)
curl -X POST /api/admin/ai-bots/assign \
  -d '{"botId": "bot-1", "userId": "student-31", ...}'

# 5. 1명 할당 취소
curl -X DELETE /api/admin/ai-bots/assignments/assignment-1

# 6. 슬롯 확인 (남은 슬롯 = 1)
curl /api/admin/academy-bot-subscriptions?academyId=test-academy

# 7. 새 학생에게 할당 (성공해야 함)
curl -X POST /api/admin/ai-bots/assign \
  -d '{"botId": "bot-1", "userId": "student-31", ...}'
```

### 5. **사용자 ID 타입 통일**

현재 `User` 테이블의 `id`는 TEXT 타입입니다:
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  ...
);
```

프론트엔드에서도 TEXT로 전송하도록 수정:
```typescript
// src/app/dashboard/admin/ai-bots/assign/page.tsx
// Line 222: parseInt(selectedUser) 제거
userId: selectedUser,  // 문자열 그대로 전송
```

### 6. **프론트엔드 에러 핸들링 강화**

```typescript
// 할당 실패 시 상세 오류 표시
if (!response.ok) {
  const errorData = await response.json();
  
  let errorMessage = errorData.message || errorData.error || "알 수 없는 오류";
  
  // 구독 부족 오류 시 상세 정보 표시
  if (errorMessage.includes('남은 슬롯')) {
    alert(`❌ 할당 실패\n\n${errorMessage}\n\n해결 방법:\n1. AI 쇼핑몰에서 추가 구매\n2. 퇴원생 할당 취소 후 재할당`);
  } else {
    alert(`❌ 할당 실패: ${errorMessage}`);
  }
}
```

## 📊 수정 우선순위

1. **HIGH** - DB 스키마 컬럼명 통일 (subscriptionEnd → subscriptionEndDate)
2. **HIGH** - 구독 조회 로직 수정 및 로깅 강화
3. **HIGH** - 중복 할당 방지 로직 추가
4. **MEDIUM** - 사용자 ID 타입 통일 (TEXT 처리)
5. **MEDIUM** - 프론트엔드 에러 핸들링 강화
6. **HIGH** - 할당 카운트 검증 테스트 스크립트 작성 및 실행

## 🧪 테스트 시나리오

### 시나리오 1: 정상 할당
1. 관리자가 학원 A에 봇 B를 30명 구독 할당
2. 학원장이 학생 1~30명에게 봇 B 할당
3. 할당 목록에 30개 항목 표시
4. 구독 슬롯: used=30, remaining=0

### 시나리오 2: 슬롯 부족 오류
1. 학원장이 31번째 학생에게 할당 시도
2. "남은 슬롯이 부족합니다" 오류 메시지 표시
3. 할당 실패

### 시나리오 3: 퇴원생 처리 및 재할당
1. 학생 1 할당 취소
2. 구독 슬롯: used=29, remaining=1
3. 학생 31에게 할당 시도
4. 할당 성공
5. 구독 슬롯: used=30, remaining=0

### 시나리오 4: 중복 할당 방지
1. 학생 1에게 봇 B가 이미 할당됨
2. 다시 학생 1에게 봇 B 할당 시도
3. "이미 할당되어 있습니다" 오류 메시지 표시
4. 할당 실패

## 📝 구현 계획

1. ✅ 문제 분석 완료
2. 🔄 API 코드 수정 (subscriptionEnd 컬럼명 통일)
3. 🔄 중복 할당 방지 로직 추가
4. 🔄 구독 조회 로깅 강화
5. 🔄 프론트엔드 userId 타입 수정
6. 🔄 에러 핸들링 개선
7. ⏳ 테스트 스크립트 작성
8. ⏳ 기능 테스트 및 검증
9. ⏳ 문서화 및 커밋

## 🎯 기대 효과

1. **할당 성공률 100% 달성**
2. **구독 슬롯 카운팅 정확도 100%**
3. **퇴원생 재할당 기능 정상 작동**
4. **중복 할당 완전 방지**
5. **사용자에게 명확한 오류 메시지 제공**
