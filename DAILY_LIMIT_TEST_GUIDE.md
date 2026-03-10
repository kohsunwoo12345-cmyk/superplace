# 일일 사용 한도 기능 - 테스트 가이드

## 📋 테스트 목적
관리자가 AI 봇을 할당할 때 개별 사용자의 일일 사용 한도를 설정하고, 실제로 한도가 작동하는지 확인합니다.

---

## ✅ 사전 준비

### 1. DB 마이그레이션 완료 확인
Cloudflare D1 Console에서 다음 쿼리로 확인:

```sql
-- 1. dailyUsageLimit 컬럼 확인
PRAGMA table_info(ai_bot_assignments);
-- "dailyUsageLimit INTEGER 0 15 0" 줄이 있어야 함

-- 2. bot_usage_logs 테이블 확인
SELECT COUNT(*) FROM bot_usage_logs;
-- 에러 없이 실행되어야 함

-- 3. VIEW 확인
SELECT * FROM v_daily_bot_usage LIMIT 1;
-- 에러 없이 실행되어야 함
```

### 2. 테스트 계정 준비
- **관리자 계정**: 봇 할당 권한 필요
- **학생 계정**: 테스트 대상

---

## 🧪 테스트 시나리오

### 시나리오 1: 할당 페이지에서 한도 설정

#### Step 1: 할당 페이지 접속
1. 관리자로 로그인
2. 사이드바 → **AI 봇 관리** → **AI 봇 할당**
3. URL: `https://superplacestudy.pages.dev/dashboard/admin/ai-bots/assign`

#### Step 2: 일일 사용 한도 필드 확인
1. **할당 방식**을 "개별 사용자 할당" 선택
2. **AI 봇** 선택
3. **학생 선택** (다중 선택 가능)
4. **🆕 일일 사용 한도 (회)** 필드 확인
   - 기본값: 15
   - 최소: 1
   - 최대: 1000
   - 도움말: "학생이 하루에 이 봇을 사용할 수 있는 최대 횟수입니다"

#### Step 3: 한도 설정 및 할당
1. 일일 사용 한도를 **3회**로 설정
2. **봇 할당하기** 버튼 클릭
3. 성공 메시지 확인

#### 예상 결과:
```
✅ 성공적으로 할당되었습니다 (1명)

홍길동

봇: 수학 선생님 봇
종료일: 2026-04-09
```

---

### 시나리오 2: API로 할당 정보 확인

#### Step 1: 브라우저 개발자 도구 열기
1. F12 키 또는 우클릭 → **검사**
2. **Console** 탭 이동

#### Step 2: 할당 정보 조회
```javascript
// 토큰 가져오기
const token = localStorage.getItem('token');

// 사용량 조회 API 호출
fetch('https://superplacestudy.pages.dev/api/admin/ai-bots/usage?userId=USER_ID&botId=BOT_ID', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(data => console.log(data));
```

#### 예상 응답:
```json
{
  "success": true,
  "data": {
    "userId": "123",
    "botId": "bot-456",
    "assignmentId": "assignment-xxx",
    "dailyUsageLimit": 3,
    "usedToday": 0,
    "remainingToday": 3,
    "isLimitExceeded": false,
    "assignmentStatus": "active",
    "weeklyStats": []
  }
}
```

---

### 시나리오 3: 학생이 한도까지 사용

#### Step 1: 학생 계정으로 로그인
1. 테스트 학생 계정 로그인
2. AI 챗봇 페이지 이동

#### Step 2: 한도 내 사용 (1~3회)
1. 첫 번째 메시지 전송: "안녕하세요"
   - ✅ 정상 응답
2. 두 번째 메시지 전송: "숙제 도와주세요"
   - ✅ 정상 응답
3. 세 번째 메시지 전송: "감사합니다"
   - ✅ 정상 응답

#### Step 3: 한도 초과 (4회째)
1. 네 번째 메시지 전송: "추가 질문"
   - ❌ **429 에러 발생**

#### 예상 에러 응답:
```json
{
  "error": "Daily limit exceeded",
  "reason": "오늘의 사용 한도(3회)를 초과했습니다.",
  "dailyUsageLimit": 3,
  "usedToday": 3,
  "remainingToday": 0
}
```

#### 예상 UI 동작:
- 에러 메시지 팝업 또는 채팅창에 표시:
  > "오늘의 사용 한도(3회)를 초과했습니다. 내일 다시 사용해주세요."

---

### 시나리오 4: 관리자가 사용량 확인

#### Step 1: 사용량 조회 API 호출
```bash
curl "https://superplacestudy.pages.dev/api/admin/ai-bots/usage?userId=USER_ID&botId=BOT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 예상 응답:
```json
{
  "success": true,
  "data": {
    "userId": "123",
    "botId": "bot-456",
    "assignmentId": "assignment-xxx",
    "dailyUsageLimit": 3,
    "usedToday": 3,
    "remainingToday": 0,
    "isLimitExceeded": true,
    "assignmentStatus": "active",
    "weeklyStats": [
      {
        "date": "2026-03-09",
        "count": 3
      }
    ]
  }
}
```

---

### 시나리오 5: 다음날 자동 리셋 확인

#### Step 1: 다음날 (UTC 00:00 이후)
1. 학생 계정으로 다시 로그인
2. AI 챗봇에 메시지 전송

#### 예상 결과:
- ✅ 정상 응답 (한도가 다시 3회로 리셋됨)

#### Step 2: 사용량 조회
```javascript
fetch('https://superplacestudy.pages.dev/api/admin/ai-bots/usage?userId=USER_ID&botId=BOT_ID', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(res => res.json())
.then(data => console.log(data));
```

#### 예상 응답:
```json
{
  "dailyUsageLimit": 3,
  "usedToday": 0,
  "remainingToday": 3,
  "isLimitExceeded": false,
  "weeklyStats": [
    {
      "date": "2026-03-10",
      "count": 0
    },
    {
      "date": "2026-03-09",
      "count": 3
    }
  ]
}
```

---

### 시나리오 6: 한도 변경

#### Step 1: 관리자가 한도 수정
```bash
curl -X PATCH "https://superplacestudy.pages.dev/api/admin/bot-assignments/assignment-xxx" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dailyUsageLimit": 10}'
```

#### 예상 응답:
```json
{
  "success": true,
  "message": "봇 할당 정보가 수정되었습니다",
  "assignment": {
    "id": "assignment-xxx",
    "dailyUsageLimit": 10,
    "...": "..."
  }
}
```

#### Step 2: 학생이 새 한도로 사용
1. 메시지 전송 (4회~10회)
   - ✅ 정상 응답
2. 11회째 메시지 전송
   - ❌ 한도 초과 에러

---

## 📊 DB에서 직접 확인

### 1. 할당 정보 확인
```sql
SELECT 
  id,
  userId,
  botId,
  dailyUsageLimit,
  status,
  startDate,
  endDate
FROM ai_bot_assignments
WHERE userId = 'USER_ID';
```

### 2. 오늘 사용량 확인
```sql
SELECT 
  DATE(createdAt) as date,
  COUNT(*) as usage_count,
  SUM(messageCount) as total_messages
FROM bot_usage_logs
WHERE assignmentId = 'ASSIGNMENT_ID'
  AND DATE(createdAt) = DATE('now')
GROUP BY DATE(createdAt);
```

### 3. VIEW로 한눈에 확인
```sql
SELECT * 
FROM v_daily_bot_usage
WHERE assignmentId = 'ASSIGNMENT_ID';
```

---

## ✅ 체크리스트

### 필수 확인 사항
- [ ] 할당 페이지에 "일일 사용 한도" 필드가 표시됨
- [ ] 기본값 15가 자동으로 입력됨
- [ ] 1~1000 범위 설정 가능
- [ ] 할당 성공 시 dailyUsageLimit이 DB에 저장됨
- [ ] 학생이 한도 내에서 정상 사용 가능
- [ ] 한도 초과 시 429 에러 발생
- [ ] 에러 메시지에 한도 정보 포함
- [ ] 다음날 자동으로 한도 리셋
- [ ] 관리자가 한도 변경 가능
- [ ] bot_usage_logs에 사용 기록 저장

### 선택 확인 사항
- [ ] 주간 통계 조회 가능
- [ ] 여러 학생 동시 할당 시 각자 독립적인 한도
- [ ] 같은 학생이 다른 봇 사용 시 독립적인 한도
- [ ] 학원장/관리자는 한도 제한 없음

---

## 🚨 예상 이슈 및 해결

### 이슈 1: 할당 페이지에 필드가 없음
**원인**: 코드가 배포되지 않음  
**해결**: Cloudflare Pages 배포 완료 대기 (약 1~2분)

### 이슈 2: "no such column: dailyUsageLimit"
**원인**: DB 마이그레이션 미완료  
**해결**: `STEP1_ADD_COLUMN.sql` 실행

### 이슈 3: 한도 초과해도 메시지 전송됨
**원인**: 
- API가 old 버전 (한도 체크 로직 없음)
- userRole이 STUDENT가 아님

**해결**: 
- 배포 완료 대기
- localStorage.getItem('user') 확인

### 이슈 4: bot_usage_logs에 기록 안 됨
**원인**: 테이블이 없거나 INSERT 실패  
**해결**: `STEP3_CREATE_LOGS_TABLE.sql` 실행

---

## 📝 테스트 리포트 양식

```
[일일 사용 한도 기능 테스트]

날짜: 2026-03-09
테스터: OOO
환경: Production (https://superplacestudy.pages.dev)

[시나리오 1: UI 확인]
✅ 할당 페이지 필드 표시
✅ 기본값 15 입력됨
✅ 한도 설정 및 할당 성공

[시나리오 2: API 확인]
✅ 사용량 조회 API 정상 작동
✅ dailyUsageLimit: 3, usedToday: 0

[시나리오 3: 한도까지 사용]
✅ 1회: 정상 응답
✅ 2회: 정상 응답
✅ 3회: 정상 응답
✅ 4회: 429 에러 발생

[시나리오 4: 사용량 확인]
✅ usedToday: 3, remainingToday: 0
✅ isLimitExceeded: true

[시나리오 5: 다음날 리셋]
⏳ 대기 중 (다음날 확인 예정)

[시나리오 6: 한도 변경]
✅ PATCH API 정상 작동
✅ 새 한도로 사용 가능

[결과]
✅ 모든 필수 기능 정상 작동
⚠️ 이슈: 없음

[비고]
- 한도 초과 에러 메시지가 명확하고 친절함
- 사용량 조회 API 응답 속도 빠름
```

---

**작성일**: 2026-03-09  
**작성자**: AI Assistant  
**배포 URL**: https://superplacestudy.pages.dev
