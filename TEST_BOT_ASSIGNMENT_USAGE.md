# AI 봇 할당 및 일일 사용량 테스트 가이드 🧪

## 📋 테스트 목적
1. ✅ 학생에게 AI 봇이 정상적으로 할당되는지 확인
2. ✅ 일일 사용 한도(dailyUsageLimit)가 제대로 작동하는지 확인
3. ✅ 할당 정보가 데이터베이스에 정확히 저장되는지 확인

---

## 🎯 테스트 시나리오

### 1단계: 관리자 - 학원에 AI 봇 할당

#### 1-1. 로그인
- URL: https://superplacestudy.pages.dev/login
- 관리자 계정으로 로그인

#### 1-2. 학원 할당
- URL: https://superplacestudy.pages.dev/dashboard/admin/ai-bots/assign/
- **할당 방식**: 학원 전체
- **AI 봇 선택**: 사용 가능한 봇 선택
- **학원 선택**: 테스트용 학원 선택
- **학생 수 제한**: 10명
- **일일 사용 한도**: **5회** (테스트용으로 낮게 설정)
- **구독 기간**: 7일
- **할당하기** 클릭

#### 1-3. 확인 사항
```
✅ 학원에 AI 봇이 할당되었습니다!

학원: [학원명]
봇: [봇명]
학생 수 제한: 10명
기간: 7일
```

### 2단계: 학원장 - 학생에게 AI 봇 할당

#### 2-1. 학원장 로그인
- 학원장 계정으로 로그인
- URL: https://superplacestudy.pages.dev/dashboard/admin/ai-bots/assign/

#### 2-2. 학생 선택
- **AI 봇 선택**: 관리자가 할당한 봇 선택
- **학생 선택**: 테스트용 학생 1명 선택
- **일일 사용 한도 필드**: 표시되지 않음 (자동 적용) ✅
- **할당하기** 클릭

#### 2-3. 확인 사항
```
✅ 성공적으로 할당되었습니다 (1명)

[학생 이름]

봇: [봇명]
종료일: [날짜]
```

### 3단계: Cloudflare D1에서 할당 확인

#### 3-1. Cloudflare Dashboard 접속
- https://dash.cloudflare.com
- Pages → superplacestudy → D1 Database

#### 3-2. SQL 쿼리 실행
```sql
-- 1. 학원 구독 확인
SELECT 
  id, academyId, botId, 
  totalStudentSlots, usedStudentSlots, remainingStudentSlots,
  dailyUsageLimit, subscriptionEnd
FROM AcademyBotSubscription
ORDER BY createdAt DESC
LIMIT 5;

-- 예상 결과:
-- dailyUsageLimit = 5
-- totalStudentSlots = 10
-- usedStudentSlots = 1
-- remainingStudentSlots = 9
```

```sql
-- 2. 학생 할당 확인
SELECT 
  id, userId, userName, botId, botName,
  dailyUsageLimit, startDate, endDate, status
FROM ai_bot_assignments
ORDER BY createdAt DESC
LIMIT 5;

-- 예상 결과:
-- dailyUsageLimit = 5 (관리자가 설정한 값)
-- status = 'active'
```

### 4단계: 학생 - AI 봇 사용 테스트

#### 4-1. 학생 로그인
- 할당받은 학생 계정으로 로그인
- URL: https://superplacestudy.pages.dev/dashboard/ai-chat

#### 4-2. 봇 대화 테스트 (1~5회)
- AI 챗 페이지에서 할당된 봇과 대화
- **1회**: "안녕하세요" → 정상 응답 ✅
- **2회**: "수학 문제 풀이 도와주세요" → 정상 응답 ✅
- **3회**: "영어 단어 알려주세요" → 정상 응답 ✅
- **4회**: "과학 개념 설명해주세요" → 정상 응답 ✅
- **5회**: "역사 사건 알려주세요" → 정상 응답 ✅

#### 4-3. 한도 초과 테스트 (6회)
- **6회**: "한도 테스트" → **사용 한도 초과 메시지** ❌

**예상 오류 메시지:**
```json
{
  "error": "오늘의 AI 챗 사용 한도를 초과했습니다",
  "reason": "오늘의 사용 한도(5회)를 초과했습니다.",
  "dailyUsageLimit": 5,
  "usedCount": 5
}
```

### 5단계: Cloudflare D1에서 사용량 확인

#### 5-1. 사용 로그 확인
```sql
-- 오늘 날짜의 사용 로그 확인
SELECT 
  id, userId, botId, message, 
  createdAt, DATE(createdAt) as date
FROM ai_chat_logs
WHERE userId = '[학생ID]'
  AND botId = '[봇ID]'
  AND DATE(createdAt) = DATE('now')
ORDER BY createdAt DESC;

-- 예상 결과: 5개의 레코드 (6번째는 저장되지 않음)
```

#### 5-2. 사용량 카운트 확인
```sql
-- 오늘 날짜의 사용량 카운트
SELECT 
  userId, botId,
  COUNT(*) as usedCount,
  DATE(createdAt) as date
FROM ai_chat_logs
WHERE userId = '[학생ID]'
  AND botId = '[봇ID]'
  AND DATE(createdAt) = DATE('now')
GROUP BY userId, botId, DATE(createdAt);

-- 예상 결과: usedCount = 5
```

---

## 🔍 브라우저 개발자 도구 확인

### 학생 6회 시도 시 콘솔 로그

```
// 정상 응답 (1~5회)
✅ 일일 사용량: 0/5
✅ 일일 사용량: 1/5
✅ 일일 사용량: 2/5
✅ 일일 사용량: 3/5
✅ 일일 사용량: 4/5

// 한도 초과 (6회)
❌ 일일 사용 한도 초과: 5/5
```

### Network 탭 확인

**6번째 요청 시:**
- Request URL: `/api/ai/chat`
- Response Status: `429` (Too Many Requests) 또는 `400`
- Response Body:
```json
{
  "error": "오늘의 AI 챗 사용 한도를 초과했습니다",
  "reason": "오늘의 사용 한도(5회)를 초과했습니다.",
  "dailyUsageLimit": 5,
  "usedCount": 5
}
```

---

## ✅ 테스트 체크리스트

### 할당 테스트
- [ ] 관리자가 학원에 봇 할당 성공
- [ ] 학원장이 학생에게 봇 할당 성공
- [ ] 일일 사용 한도 입력 필드가 학원장에게 표시되지 않음
- [ ] `AcademyBotSubscription` 테이블에 `dailyUsageLimit = 5` 저장됨
- [ ] `ai_bot_assignments` 테이블에 `dailyUsageLimit = 5` 저장됨

### 사용량 테스트
- [ ] 학생이 1~5회 대화 정상 작동
- [ ] 6회차에 한도 초과 메시지 표시
- [ ] `ai_chat_logs` 테이블에 정확히 5개 레코드 저장
- [ ] 사용량 카운트 쿼리 결과 = 5

### 다음날 리셋 테스트
- [ ] 다음날(00:00 이후) 다시 5회 사용 가능
- [ ] `DATE(createdAt) = DATE('now')` 조건으로 당일만 카운트

---

## 🐛 문제 발생 시 디버깅

### 1. 할당이 안될 때
```sql
-- 구독 확인
SELECT * FROM AcademyBotSubscription 
WHERE academyId = '[학원ID]' AND botId = '[봇ID]';

-- 슬롯 확인
-- remainingStudentSlots > 0 이어야 함
```

### 2. 한도가 적용되지 않을 때
```sql
-- 할당 정보 확인
SELECT dailyUsageLimit 
FROM ai_bot_assignments 
WHERE userId = '[학생ID]' AND botId = '[봇ID]';

-- dailyUsageLimit가 NULL이거나 0이면 문제
```

### 3. 사용량이 카운트되지 않을 때
```sql
-- 로그 테이블 존재 확인
SELECT name FROM sqlite_master 
WHERE type='table' AND name='ai_chat_logs';

-- 로그 데이터 확인
SELECT COUNT(*) FROM ai_chat_logs 
WHERE userId = '[학생ID]' AND botId = '[봇ID]';
```

---

## 📊 예상 결과 요약

| 항목 | 예상 값 |
|------|---------|
| 학원 구독 dailyUsageLimit | 5 |
| 학생 할당 dailyUsageLimit | 5 |
| 1~5회 대화 | 정상 응답 ✅ |
| 6회 대화 | 한도 초과 오류 ❌ |
| ai_chat_logs 레코드 수 | 5개 |
| 다음날 사용 가능 횟수 | 5회 (리셋) |

---

## 🚀 배포 정보

- **URL**: https://superplacestudy.pages.dev
- **커밋**: `c5c82c74`
- **시간**: 2026-03-15 18:45 KST
- **상태**: ✅ 배포 완료

---

## 📝 테스트 후 보고

테스트 완료 후 아래 항목을 확인해주세요:

1. **할당 성공 여부**: ✅ / ❌
2. **dailyUsageLimit 저장 확인**: ✅ / ❌
3. **1~5회 대화 성공**: ✅ / ❌
4. **6회 한도 초과 확인**: ✅ / ❌
5. **로그 정확히 5개 저장**: ✅ / ❌

**문제 발생 시 스크린샷 및 콘솔 로그를 공유해주세요!** 📸
