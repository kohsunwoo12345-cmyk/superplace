# 🔍 AI 봇 할당 데이터 확인 가이드

## ❓ "데이터가 없습니다" - 이게 문제인가요?

### ✅ **정상입니다!**

데이터가 없는 이유:
1. 아직 관리자가 학원에 봇을 할당하지 않음
2. 아직 학원장이 학생에게 봇을 할당하지 않음
3. 아직 학생이 AI 챗을 사용하지 않음

**→ 테이블은 존재하지만, 할당 작업을 하지 않아서 데이터가 비어있는 상태입니다.**

---

## 🔍 테이블 존재 여부 확인

Cloudflare D1 Console에서 다음 쿼리를 실행하세요:

### 1. 테이블 목록 확인
```sql
-- 모든 테이블 조회
SELECT name, type 
FROM sqlite_master 
WHERE type='table' 
ORDER BY name;
```

**예상 결과:**
```
✅ AcademyBotSubscription
✅ ai_bot_assignments
✅ ai_chat_logs
... (기타 테이블들)
```

### 2. 각 테이블 구조 확인

#### AcademyBotSubscription 테이블
```sql
PRAGMA table_info(AcademyBotSubscription);
```

**확인할 컬럼:**
- ✅ `id`
- ✅ `academyId`
- ✅ `botId`
- ✅ `dailyUsageLimit` ← **중요!**
- ✅ `totalStudentSlots`
- ✅ `usedStudentSlots`
- ✅ `remainingStudentSlots`
- ✅ `subscriptionEnd`

#### ai_bot_assignments 테이블
```sql
PRAGMA table_info(ai_bot_assignments);
```

**확인할 컬럼:**
- ✅ `id`
- ✅ `userId`
- ✅ `botId`
- ✅ `dailyUsageLimit` ← **중요!**
- ✅ `startDate`
- ✅ `endDate`
- ✅ `status`

#### ai_chat_logs 테이블
```sql
PRAGMA table_info(ai_chat_logs);
```

**확인할 컬럼:**
- ✅ `id`
- ✅ `userId`
- ✅ `botId`
- ✅ `message`
- ✅ `response`
- ✅ `createdAt`

---

## 🧪 테스트 진행 순서

### **현재 상태: 0단계 (데이터 없음)**
```
[ ] AcademyBotSubscription - 비어있음
[ ] ai_bot_assignments - 비어있음
[ ] ai_chat_logs - 비어있음
```

### **1단계: 관리자 - 학원에 봇 할당**

1. 관리자 로그인
2. https://superplacestudy.pages.dev/dashboard/admin/ai-bots/assign/
3. **학원 전체** 선택
4. AI 봇 선택
5. 학원 선택
6. 학생 수 제한: 10명
7. **일일 사용 한도: 5회** ← 입력
8. 구독 기간: 7일
9. **할당하기** 클릭

**확인:**
```sql
SELECT id, academyId, botId, dailyUsageLimit, totalStudentSlots
FROM AcademyBotSubscription
ORDER BY createdAt DESC LIMIT 1;
```

**예상 결과:**
```
id                     | academyId    | botId      | dailyUsageLimit | totalStudentSlots
----------------------|--------------|------------|-----------------|------------------
subscription-xxx      | academy-yyy  | bot-zzz    | 5               | 10
```

### **2단계: 학원장 - 학생에게 봇 할당**

1. 학원장 로그인
2. https://superplacestudy.pages.dev/dashboard/admin/ai-bots/assign/
3. AI 봇 선택 (관리자가 할당한 봇)
4. 학생 1명 선택
5. **일일 사용 한도 필드 없음** (자동 적용)
6. **할당하기** 클릭

**확인:**
```sql
SELECT id, userId, userName, botId, botName, dailyUsageLimit, status
FROM ai_bot_assignments
ORDER BY createdAt DESC LIMIT 1;
```

**예상 결과:**
```
id              | userId | userName | botId   | botName | dailyUsageLimit | status
----------------|--------|----------|---------|---------|-----------------|--------
assignment-xxx  | 123    | 홍길동    | bot-zzz | 수학봇   | 5               | active
```

### **3단계: 학생 - AI 챗 사용**

1. 학생 로그인 (할당받은 학생)
2. https://superplacestudy.pages.dev/dashboard/ai-chat
3. 할당받은 봇과 대화 5회
4. 6회차 시도 시 한도 초과 메시지 확인

**확인:**
```sql
-- 오늘 날짜의 사용 로그 (학생 ID와 봇 ID 입력 필요)
SELECT id, userId, botId, message, createdAt
FROM ai_chat_logs
WHERE userId = '123'  -- 실제 학생 ID 입력
  AND botId = 'bot-zzz'  -- 실제 봇 ID 입력
  AND DATE(createdAt) = DATE('now')
ORDER BY createdAt DESC;
```

**예상 결과: 5개 레코드**
```
id      | userId | botId   | message           | createdAt
--------|--------|---------|-------------------|------------------
log-5   | 123    | bot-zzz | 역사 사건 알려줘   | 2026-03-15 19:05
log-4   | 123    | bot-zzz | 과학 개념 설명해줘 | 2026-03-15 19:04
log-3   | 123    | bot-zzz | 영어 단어 알려줘   | 2026-03-15 19:03
log-2   | 123    | bot-zzz | 수학 문제 풀이     | 2026-03-15 19:02
log-1   | 123    | bot-zzz | 안녕하세요         | 2026-03-15 19:01
```

**사용량 카운트:**
```sql
SELECT 
  userId, 
  botId, 
  COUNT(*) as usedCount,
  DATE(createdAt) as date
FROM ai_chat_logs
WHERE DATE(createdAt) = DATE('now')
GROUP BY userId, botId, DATE(createdAt);
```

**예상 결과:**
```
userId | botId   | usedCount | date
-------|---------|-----------|------------
123    | bot-zzz | 5         | 2026-03-15
```

---

## ✅ 현재 상태 요약

| 단계 | 작업 | 상태 | 데이터 |
|------|------|------|--------|
| 0 | 테이블 생성 | ✅ 완료 | 빈 테이블 |
| 1 | 관리자 → 학원 할당 | ⏳ 대기 | 없음 |
| 2 | 학원장 → 학생 할당 | ⏳ 대기 | 없음 |
| 3 | 학생 → 봇 사용 | ⏳ 대기 | 없음 |

---

## 🎯 다음 단계

### **지금 해야 할 일:**

1. ✅ 테이블 존재 확인 (위의 PRAGMA 쿼리 실행)
2. ⏳ **1단계 실행**: 관리자로 학원에 봇 할당
3. ⏳ **2단계 실행**: 학원장으로 학생에게 할당
4. ⏳ **3단계 실행**: 학생으로 AI 챗 사용 (5회)
5. ⏳ **검증**: 6회차 한도 초과 확인

---

## 💡 팁

### 빠른 테스트를 위해:

1. **관리자 계정** 하나
2. **학원장 계정** 하나 (특정 학원 소속)
3. **학생 계정** 하나 (같은 학원 소속)

이 3개 계정으로 위의 1→2→3단계를 순서대로 진행하면 됩니다!

---

## 🚨 문제가 있다면?

### 테이블이 없다면?
```sql
-- AcademyBotSubscription 테이블 생성
-- (할당 API가 자동으로 생성하지만, 수동 생성도 가능)
```

### dailyUsageLimit 컬럼이 없다면?
```sql
-- ai_bot_assignments 테이블에 컬럼 추가
ALTER TABLE ai_bot_assignments 
ADD COLUMN dailyUsageLimit INTEGER DEFAULT 15;

-- AcademyBotSubscription 테이블에 컬럼 추가
ALTER TABLE AcademyBotSubscription 
ADD COLUMN dailyUsageLimit INTEGER DEFAULT 15;
```

---

**테이블 존재 여부만 확인하고, 실제 할당 작업을 진행하세요!** 🚀
