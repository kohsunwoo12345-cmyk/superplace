# 학원 전체 일일 사용 한도 테스트 가이드

## 📋 개요
학원 전체에 AI 봇을 할당할 때, 각 학생(및 학원장)이 개별적으로 일일 사용 한도를 가지도록 구현되었습니다.

## 🎯 핵심 기능
1. **학원 구독 시 일일 한도 설정**: 학원에 봇을 할당할 때 `dailyUsageLimit` 설정 (예: 15회)
2. **개별 학생 한도**: 학원에 속한 각 학생이 **자신의** 일일 15회 한도를 가짐
3. **학원장 동일 적용**: 학원장도 학생과 동일하게 일일 15회 한도 적용

## 🗂️ 데이터베이스 스키마

### AcademyBotSubscription 테이블
```sql
-- 학원 전체 봇 구독 정보
CREATE TABLE AcademyBotSubscription (
  id TEXT PRIMARY KEY,
  academyId TEXT NOT NULL,
  productId TEXT NOT NULL,  -- botId
  productName TEXT NOT NULL,
  totalStudentSlots INTEGER NOT NULL DEFAULT 0,  -- 전체 학생 수 제한
  usedStudentSlots INTEGER NOT NULL DEFAULT 0,
  remainingStudentSlots INTEGER NOT NULL DEFAULT 0,
  subscriptionStart TEXT NOT NULL,
  subscriptionEnd TEXT NOT NULL,
  pricePerStudent REAL DEFAULT 0,
  dailyUsageLimit INTEGER DEFAULT 15,  -- 🆕 1인당 일일 사용 한도
  memo TEXT,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);
```

### ai_bot_assignments 테이블
```sql
-- 개별 학생 봇 할당 정보
CREATE TABLE ai_bot_assignments (
  id TEXT PRIMARY KEY,
  botId TEXT NOT NULL,
  botName TEXT NOT NULL,
  userId TEXT NOT NULL,
  userName TEXT NOT NULL,
  userEmail TEXT NOT NULL,
  userAcademyId TEXT,
  startDate TEXT NOT NULL,
  endDate TEXT NOT NULL,
  duration INTEGER NOT NULL,
  durationUnit TEXT NOT NULL,
  dailyUsageLimit INTEGER DEFAULT 15,  -- 🆕 개별 학생 일일 한도
  status TEXT DEFAULT 'active',
  createdAt TEXT DEFAULT (datetime('now'))
);
```

### bot_usage_logs 테이블
```sql
-- 실제 사용 로그
CREATE TABLE bot_usage_logs (
  id TEXT PRIMARY KEY,
  assignmentId TEXT NOT NULL,
  botId TEXT NOT NULL,
  userId TEXT NOT NULL,
  userType TEXT NOT NULL,
  messageCount INTEGER DEFAULT 1,
  usageDate TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (assignmentId) REFERENCES ai_bot_assignments(id),
  FOREIGN KEY (botId) REFERENCES ai_bots(id)
);
```

## 🔧 DB 마이그레이션

### Step 5: AcademyBotSubscription에 dailyUsageLimit 추가
```bash
wrangler d1 execute webapp-production --file=STEP5_ADD_ACADEMY_DAILY_LIMIT.sql
```

또는 D1 Console에서:
```sql
-- 컬럼 추가
ALTER TABLE AcademyBotSubscription ADD COLUMN dailyUsageLimit INTEGER DEFAULT 15;

-- 기존 데이터 업데이트
UPDATE AcademyBotSubscription 
SET dailyUsageLimit = 15 
WHERE dailyUsageLimit IS NULL;

-- 확인
SELECT id, academyId, productId, dailyUsageLimit 
FROM AcademyBotSubscription 
LIMIT 5;
```

## 📊 작동 방식

### 1. 학원 전체 봇 할당 (관리자)
```
관리자 → "학원 전체에 할당" 선택
→ 학원 선택 (예: "테스트 학원")
→ 학생 수 제한 입력 (예: 50명)
→ 1인당 일일 사용 한도 입력 (예: 15회)
→ 기간 설정
→ 할당
```

**API 호출**:
```javascript
POST /api/admin/academy-bot-subscriptions
{
  "academyId": "academy-123",
  "productId": "bot-456",
  "studentCount": 50,
  "subscriptionStart": "2026-03-10",
  "subscriptionEnd": "2026-04-10",
  "dailyUsageLimit": 15  // 🆕 1인당 일일 한도
}
```

**결과**:
- `AcademyBotSubscription` 테이블에 저장됨
- `dailyUsageLimit = 15` 저장

### 2. 개별 학생에게 봇 할당 (학원장)
```
학원장 로그인 → "개별 학생에게 할당" 선택
→ 학생 선택
→ 할당
```

**자동 처리**:
1. 학원의 구독 정보(`AcademyBotSubscription`)에서 `dailyUsageLimit` 조회
2. 해당 값을 `ai_bot_assignments.dailyUsageLimit`에 복사
3. 학생별 할당 생성

**API 호출**:
```javascript
POST /api/admin/ai-bots/assign
{
  "botId": "bot-456",
  "userId": "student-789"
  // dailyUsageLimit는 자동으로 학원 구독에서 가져옴
}
```

### 3. 학생이 AI 봇 사용
```
학생 로그인 → AI 채팅 → 메시지 전송
```

**한도 체크 로직** (`functions/api/ai/chat.ts`):
```javascript
// 1. 학생의 할당 정보 조회
const assignment = await DB.prepare(`
  SELECT * FROM ai_bot_assignments 
  WHERE botId = ? AND userId = ? AND status = 'active'
`).bind(botId, userId).first();

// 2. 오늘 사용량 조회
const today = new Date().toISOString().split('T')[0];
const usageToday = await DB.prepare(`
  SELECT COALESCE(SUM(messageCount), 0) as totalUsed
  FROM bot_usage_logs
  WHERE assignmentId = ? 
    AND userId = ?
    AND DATE(createdAt) = ?
`).bind(assignment.id, userId, today).first();

const dailyLimit = assignment.dailyUsageLimit || 15;
const usedCount = usageToday?.totalUsed || 0;

// 3. 한도 체크
if (usedCount >= dailyLimit) {
  return Response(429, {
    error: "Daily limit exceeded",
    reason: `오늘의 사용 한도(${dailyLimit}회)를 초과했습니다.`,
    dailyUsageLimit: dailyLimit,
    usedToday: usedCount,
    remainingToday: 0
  });
}

// 4. 사용 로그 기록
await DB.prepare(`
  INSERT INTO bot_usage_logs 
  (id, assignmentId, botId, userId, userType, messageCount, usageDate, createdAt)
  VALUES (?, ?, ?, ?, ?, 1, ?, datetime('now'))
`).bind(logId, assignment.id, botId, userId, 'STUDENT', today).run();
```

## 🧪 테스트 시나리오

### 시나리오 1: 학원 전체 할당 (50명, 일일 15회)
```bash
# 1. 학원 전체에 봇 할당
curl -X POST "https://superplacestudy.pages.dev/api/admin/academy-bot-subscriptions" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "academyId": "academy-test-123",
    "productId": "bot-math-456",
    "studentCount": 50,
    "subscriptionStart": "2026-03-10",
    "subscriptionEnd": "2026-04-10",
    "dailyUsageLimit": 15
  }'

# 2. 결과 확인
# AcademyBotSubscription 테이블 조회
SELECT academyId, productId, totalStudentSlots, dailyUsageLimit 
FROM AcademyBotSubscription 
WHERE academyId = 'academy-test-123';
```

**기대 결과**:
- `totalStudentSlots`: 50
- `dailyUsageLimit`: 15

### 시나리오 2: 학생 1에게 개별 할당
```bash
curl -X POST "https://superplacestudy.pages.dev/api/admin/ai-bots/assign" \
  -H "Authorization: Bearer DIRECTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "botId": "bot-math-456",
    "userId": "student-001"
  }'
```

**기대 결과**:
```json
{
  "success": true,
  "assignment": {
    "id": "assignment-...",
    "dailyUsageLimit": 15,  // 학원 구독에서 자동으로 가져옴
    "usedAcademySubscription": true
  }
}
```

### 시나리오 3: 학생 1 - 일일 한도 테스트
```bash
# 1~15번째 메시지: 정상 응답
for i in {1..15}; do
  curl -X POST "https://superplacestudy.pages.dev/api/ai/chat" \
    -H "Authorization: Bearer STUDENT_001_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"message\": \"메시지 $i\",
      \"botId\": \"bot-math-456\",
      \"userId\": \"student-001\"
    }"
  echo "메시지 $i 완료"
done

# 16번째 메시지: 429 에러
curl -X POST "https://superplacestudy.pages.dev/api/ai/chat" \
  -H "Authorization: Bearer STUDENT_001_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "메시지 16",
    "botId": "bot-math-456",
    "userId": "student-001"
  }'
```

**기대 결과** (16번째 메시지):
```json
{
  "error": "Daily limit exceeded",
  "reason": "오늘의 사용 한도(15회)를 초과했습니다.",
  "dailyUsageLimit": 15,
  "usedToday": 15,
  "remainingToday": 0
}
```

### 시나리오 4: 학생 2 - 독립적인 한도 확인
```bash
# 학생 2에게 할당
curl -X POST "https://superplacestudy.pages.dev/api/admin/ai-bots/assign" \
  -H "Authorization: Bearer DIRECTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "botId": "bot-math-456",
    "userId": "student-002"
  }'

# 학생 2가 메시지 전송 (학생 1의 한도와 무관)
curl -X POST "https://superplacestudy.pages.dev/api/ai/chat" \
  -H "Authorization: Bearer STUDENT_002_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "안녕하세요",
    "botId": "bot-math-456",
    "userId": "student-002"
  }'
```

**기대 결과**:
- 학생 2는 자신의 일일 15회 한도를 가짐
- 학생 1의 사용량과 무관

### 시나리오 5: 학원장도 동일 한도 적용
```bash
# 학원장에게 할당
curl -X POST "https://superplacestudy.pages.dev/api/admin/ai-bots/assign" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "botId": "bot-math-456",
    "userId": "director-999"
  }'

# 학원장이 16회 전송 시도
for i in {1..16}; do
  curl -X POST "https://superplacestudy.pages.dev/api/ai/chat" \
    -H "Authorization: Bearer DIRECTOR_999_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"message\": \"학원장 메시지 $i\",
      \"botId\": \"bot-math-456\",
      \"userId\": \"director-999\"
    }"
done
```

**기대 결과**:
- 학원장도 일일 15회 한도 적용됨
- 16번째 메시지에서 429 에러

## 📈 사용량 조회 API

### 개별 사용자 사용량 조회
```bash
curl "https://superplacestudy.pages.dev/api/admin/ai-bots/usage?userId=student-001&botId=bot-math-456" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**응답**:
```json
{
  "success": true,
  "usage": {
    "userId": "student-001",
    "botId": "bot-math-456",
    "dailyUsageLimit": 15,
    "today": {
      "date": "2026-03-10",
      "usedCount": 15,
      "remainingCount": 0
    },
    "total": {
      "allTimeCount": 45
    }
  }
}
```

## 🗃️ DB 검증 쿼리

### 1. 학원 구독 확인
```sql
SELECT 
  id,
  academyId,
  productId,
  productName,
  totalStudentSlots,
  dailyUsageLimit,
  subscriptionStart,
  subscriptionEnd
FROM AcademyBotSubscription
WHERE academyId = 'academy-test-123';
```

### 2. 개별 할당 확인
```sql
SELECT 
  id,
  userId,
  userName,
  botId,
  botName,
  dailyUsageLimit,
  startDate,
  endDate,
  status
FROM ai_bot_assignments
WHERE userAcademyId = 'academy-test-123'
  AND status = 'active';
```

### 3. 오늘 사용량 집계 (학원 전체)
```sql
SELECT 
  a.userId,
  a.userName,
  a.dailyUsageLimit,
  COALESCE(SUM(l.messageCount), 0) as usedToday,
  (a.dailyUsageLimit - COALESCE(SUM(l.messageCount), 0)) as remainingToday
FROM ai_bot_assignments a
LEFT JOIN bot_usage_logs l 
  ON l.assignmentId = a.id 
  AND DATE(l.createdAt) = DATE('now')
WHERE a.userAcademyId = 'academy-test-123'
  AND a.status = 'active'
GROUP BY a.userId, a.userName, a.dailyUsageLimit
ORDER BY usedToday DESC;
```

### 4. 한도 초과 사용자 확인
```sql
SELECT 
  a.userId,
  a.userName,
  a.dailyUsageLimit,
  COALESCE(SUM(l.messageCount), 0) as usedToday
FROM ai_bot_assignments a
LEFT JOIN bot_usage_logs l 
  ON l.assignmentId = a.id 
  AND DATE(l.createdAt) = DATE('now')
WHERE a.userAcademyId = 'academy-test-123'
  AND a.status = 'active'
GROUP BY a.userId, a.userName, a.dailyUsageLimit
HAVING usedToday >= a.dailyUsageLimit;
```

## ✅ 체크리스트

- [ ] **DB 마이그레이션**: `STEP5_ADD_ACADEMY_DAILY_LIMIT.sql` 실행
- [ ] **학원 구독 생성**: `dailyUsageLimit` 포함하여 학원에 봇 할당
- [ ] **개별 할당**: 학생에게 할당 시 `dailyUsageLimit` 자동 복사
- [ ] **한도 체크**: 학생이 일일 한도 초과 시 429 에러
- [ ] **독립성**: 각 학생의 한도가 독립적으로 작동
- [ ] **학원장 적용**: 학원장도 동일한 한도 적용
- [ ] **사용량 로그**: `bot_usage_logs`에 정확히 기록
- [ ] **UI 필드**: 할당 페이지에 "1인당 일일 사용 한도" 필드 표시

## 🐛 알려진 이슈

1. **타임존 이슈**: 사용량 집계가 UTC 기준이므로 KST 자정과 차이 발생 가능
   - 해결: `DATE(createdAt, '+9 hours')` 사용
   
2. **동시성 문제**: 여러 요청이 동시에 오면 한도 체크가 부정확할 수 있음
   - 해결: 트랜잭션 또는 Durable Object 사용 고려

## 📝 테스트 리포트 템플릿

```
# 학원 전체 일일 한도 테스트 리포트

테스트 일시: 2026-03-10
테스터: [이름]

## 환경
- 학원 ID: academy-test-123
- 봇 ID: bot-math-456
- 학생 수: 50명
- 일일 한도: 15회

## 테스트 결과

### 1. 학원 구독 생성
- [ ] 성공: dailyUsageLimit = 15

### 2. 학생 할당
- [ ] 학생 1 할당: dailyUsageLimit 자동 복사
- [ ] 학생 2 할당: dailyUsageLimit 자동 복사

### 3. 일일 한도 테스트
- [ ] 학생 1: 1~15회 정상, 16회 429 에러
- [ ] 학생 2: 독립적으로 1~15회 가능

### 4. 학원장 한도
- [ ] 학원장도 15회 한도 적용

### 5. DB 검증
- [ ] AcademyBotSubscription 테이블 확인
- [ ] ai_bot_assignments 테이블 확인
- [ ] bot_usage_logs 테이블 확인

## 이슈
[발견된 이슈 기록]

## 결론
✅ 모든 테스트 통과 / ❌ 실패
```

## 🚀 배포 후 확인사항

1. **Cloudflare D1 Console에서 확인**:
   ```sql
   PRAGMA table_info(AcademyBotSubscription);
   ```
   → `dailyUsageLimit` 컬럼 존재 확인

2. **할당 페이지 확인**:
   - `https://superplacestudy.pages.dev/dashboard/admin/ai-bots/assign`
   - "학원 전체에 할당" 선택 시 "1인당 일일 사용 한도" 필드 표시

3. **실제 사용 테스트**:
   - 테스트 학원에 봇 할당
   - 학생 계정으로 16회 메시지 전송
   - 16번째에서 429 에러 확인

## 📞 문의

문제 발생 시 로그 확인:
- Cloudflare Pages 대시보드 → Functions → Logs
- 에러 메시지 및 상세 로그 수집 후 보고
