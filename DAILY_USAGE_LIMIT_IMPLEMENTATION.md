# AI 봇 일일 사용 한도 기능 구현 완료

## 📋 개요

관리자가 AI 봇을 학생/학원장에게 할당할 때 **개별 사용자별 일일 사용 한도**를 설정할 수 있는 기능을 구현했습니다.

- **기본 한도**: 15회/일
- **개별 설정 가능**: 할당 시 또는 할당 후 수정 가능
- **자동 추적**: 사용량 자동 기록 및 한도 체크
- **실시간 차단**: 한도 초과 시 429 에러 반환

---

## 🗄️ 데이터베이스 변경사항

### 1. `ai_bot_assignments` 테이블에 필드 추가

```sql
ALTER TABLE ai_bot_assignments ADD COLUMN dailyUsageLimit INTEGER DEFAULT 15;
```

### 2. 새 테이블: `bot_usage_logs`

```sql
CREATE TABLE bot_usage_logs (
  id TEXT PRIMARY KEY,
  assignmentId TEXT NOT NULL,
  botId TEXT NOT NULL,
  userId TEXT NOT NULL,
  userType TEXT NOT NULL,  -- 'student' 또는 'director'
  messageCount INTEGER DEFAULT 1,
  usageDate TEXT NOT NULL,  -- YYYY-MM-DD
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (assignmentId) REFERENCES ai_bot_assignments(id),
  FOREIGN KEY (botId) REFERENCES ai_bots(id)
);

CREATE INDEX idx_bot_usage_logs_assignment ON bot_usage_logs(assignmentId);
CREATE INDEX idx_bot_usage_logs_user ON bot_usage_logs(userId, usageDate);
CREATE INDEX idx_bot_usage_logs_composite ON bot_usage_logs(assignmentId, userId, usageDate);
```

### 3. VIEW: `v_daily_bot_usage`

일일 사용량 조회를 간편하게 하기 위한 뷰:

```sql
CREATE VIEW v_daily_bot_usage AS
SELECT 
  ba.id AS assignmentId,
  ba.botId,
  ba.studentId,
  ba.dailyUsageLimit,
  DATE(bul.createdAt) AS usageDate,
  COALESCE(SUM(bul.messageCount), 0) AS dailyUsageCount,
  ba.dailyUsageLimit - COALESCE(SUM(bul.messageCount), 0) AS remainingUsage,
  CASE 
    WHEN COALESCE(SUM(bul.messageCount), 0) >= ba.dailyUsageLimit THEN 1
    ELSE 0
  END AS isLimitExceeded
FROM bot_assignments ba
LEFT JOIN bot_usage_logs bul 
  ON ba.id = bul.assignmentId 
  AND DATE(bul.createdAt) = DATE('now')
WHERE ba.isActive = 1
GROUP BY ba.id, ba.botId, ba.studentId, ba.dailyUsageLimit;
```

---

## 🔧 API 변경사항

### 1. **봇 할당 API** (`POST /api/admin/ai-bots/assign`)

#### 요청 파라미터 추가:
```json
{
  "botId": "bot-123",
  "userId": "user-456",
  "duration": 30,
  "durationUnit": "day",
  "dailyUsageLimit": 15  // 🆕 일일 사용 한도 (기본값: 15)
}
```

#### 응답 예시:
```json
{
  "success": true,
  "message": "AI 봇이 성공적으로 할당되었습니다",
  "assignment": {
    "id": "assignment-xxx",
    "botId": "bot-123",
    "userId": "user-456",
    "dailyUsageLimit": 15,  // 🆕
    "startDate": "2026-03-09",
    "endDate": "2026-04-08",
    "status": "active"
  }
}
```

### 2. **채팅 API** (`POST /api/ai/chat`)

#### 일일 한도 체크 로직 추가:
- 학생 계정(`userRole === 'STUDENT'`)일 때 자동 체크
- 한도 초과 시 **429 Too Many Requests** 반환

#### 한도 초과 응답 예시:
```json
{
  "error": "Daily limit exceeded",
  "reason": "오늘의 사용 한도(15회)를 초과했습니다.",
  "dailyUsageLimit": 15,
  "usedToday": 15,
  "remainingToday": 0
}
```

#### 사용량 자동 기록:
- 성공적인 채팅 응답 후 `bot_usage_logs`에 자동 기록
- `messageCount: 1` (한 번의 메시지 = 1회 사용)

### 3. **🆕 사용량 조회 API** (`GET /api/admin/ai-bots/usage`)

특정 사용자의 봇 사용량 조회:

#### 요청:
```bash
GET /api/admin/ai-bots/usage?userId=user-456&botId=bot-123
Authorization: Bearer <token>
```

#### 응답:
```json
{
  "success": true,
  "data": {
    "userId": "user-456",
    "botId": "bot-123",
    "assignmentId": "assignment-xxx",
    "dailyUsageLimit": 15,
    "usedToday": 8,
    "remainingToday": 7,
    "isLimitExceeded": false,
    "assignmentStatus": "active",
    "assignmentPeriod": {
      "startDate": "2026-03-09",
      "endDate": "2026-04-08"
    },
    "weeklyStats": [
      { "date": "2026-03-09", "count": 8 },
      { "date": "2026-03-08", "count": 12 },
      { "date": "2026-03-07", "count": 15 }
    ]
  }
}
```

### 4. **🆕 할당 수정 API** (`PATCH /api/admin/bot-assignments/[id]`)

기존 할당의 일일 한도 변경:

#### 요청:
```bash
PATCH /api/admin/bot-assignments/assignment-xxx
Authorization: Bearer <token>
Content-Type: application/json

{
  "dailyUsageLimit": 20
}
```

#### 응답:
```json
{
  "success": true,
  "message": "봇 할당 정보가 수정되었습니다",
  "assignment": {
    "id": "assignment-xxx",
    "dailyUsageLimit": 20,
    "...": "..."
  }
}
```

---

## 📊 사용량 조회 SQL 쿼리

### 1. 특정 학생의 오늘 사용량
```sql
SELECT 
  ba.dailyUsageLimit,
  COALESCE(SUM(bul.messageCount), 0) AS usedToday,
  ba.dailyUsageLimit - COALESCE(SUM(bul.messageCount), 0) AS remaining
FROM ai_bot_assignments ba
LEFT JOIN bot_usage_logs bul 
  ON ba.id = bul.assignmentId 
  AND bul.userId = 'USER_ID'
  AND DATE(bul.createdAt) = DATE('now')
WHERE ba.id = 'ASSIGNMENT_ID'
GROUP BY ba.id, ba.dailyUsageLimit;
```

### 2. 모든 학생의 오늘 사용량 요약
```sql
SELECT 
  s.name AS studentName,
  ab.name AS botName,
  v.dailyUsageCount,
  v.dailyUsageLimit,
  v.remainingUsage,
  CASE WHEN v.isLimitExceeded = 1 THEN '한도 초과' ELSE '사용 가능' END AS status
FROM v_daily_bot_usage v
JOIN User s ON v.studentId = s.id
JOIN ai_bots ab ON v.botId = ab.id
ORDER BY v.dailyUsageCount DESC;
```

### 3. 최근 7일 사용 통계
```sql
SELECT 
  DATE(createdAt) as date,
  SUM(messageCount) as totalMessages,
  COUNT(DISTINCT userId) as uniqueUsers
FROM bot_usage_logs
WHERE botId = 'BOT_ID'
  AND DATE(createdAt) >= DATE('now', '-7 days')
GROUP BY DATE(createdAt)
ORDER BY date DESC;
```

---

## 🔒 보안 및 제한사항

### 한도 체크 로직

1. **학생 계정만 체크**: `userRole === 'STUDENT'`
2. **관리자/학원장**: 한도 제한 없음
3. **일별 리셋**: 매일 00:00 (UTC) 자동 리셋
4. **실시간 차단**: 한도 초과 시 즉시 429 에러

### 우선순위

1. ✅ 할당 기간 확인
2. ✅ 학원 구독 확인
3. ✅ 일일 사용 한도 확인 ⭐ **NEW**
4. ✅ 학원 전체 슬롯 확인
5. ✅ 응답 생성
6. ✅ 사용량 기록 ⭐ **NEW**

---

## 🧪 테스트 시나리오

### 1. 할당 시 한도 설정
```bash
curl -X POST https://superplacestudy.pages.dev/api/admin/ai-bots/assign \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "botId": "bot-123",
    "userId": "user-456",
    "duration": 30,
    "durationUnit": "day",
    "dailyUsageLimit": 10
  }'
```

### 2. 한도 내 사용 (정상)
```bash
# 1회 ~ 9회: 정상 응답
curl -X POST https://superplacestudy.pages.dev/api/ai/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "안녕하세요",
    "botId": "bot-123",
    "userId": "user-456",
    "userRole": "STUDENT"
  }'
```

### 3. 한도 초과 (차단)
```bash
# 10회째: 429 에러
curl -X POST https://superplacestudy.pages.dev/api/ai/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "추가 질문",
    "botId": "bot-123",
    "userId": "user-456",
    "userRole": "STUDENT"
  }'

# 응답:
# {
#   "error": "Daily limit exceeded",
#   "reason": "오늘의 사용 한도(10회)를 초과했습니다.",
#   "dailyUsageLimit": 10,
#   "usedToday": 10,
#   "remainingToday": 0
# }
```

### 4. 사용량 조회
```bash
curl "https://superplacestudy.pages.dev/api/admin/ai-bots/usage?userId=user-456&botId=bot-123" \
  -H "Authorization: Bearer <token>"
```

### 5. 한도 변경
```bash
curl -X PATCH https://superplacestudy.pages.dev/api/admin/bot-assignments/assignment-xxx \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "dailyUsageLimit": 20 }'
```

---

## 📂 변경된 파일 목록

### SQL 스크립트
- `ADD_DAILY_USAGE_LIMIT.sql` - 테이블/VIEW 생성 스크립트

### API 파일
1. `functions/api/admin/ai-bots/assign.ts` - 할당 시 `dailyUsageLimit` 추가
2. `functions/api/ai/chat.ts` - 한도 체크 + 사용량 기록
3. `functions/api/admin/ai-bots/usage.ts` - 🆕 사용량 조회 API
4. `functions/api/admin/bot-assignments/[id].ts` - 🆕 PATCH 메서드 추가

---

## 🎯 배포 체크리스트

### 1. 데이터베이스 마이그레이션
```bash
# Cloudflare D1에서 실행
wrangler d1 execute webapp-production --file=ADD_DAILY_USAGE_LIMIT.sql
```

### 2. 기존 할당에 기본값 설정
```sql
UPDATE ai_bot_assignments 
SET dailyUsageLimit = 15 
WHERE dailyUsageLimit IS NULL;
```

### 3. API 배포
```bash
git add -A
git commit -m "feat: AI 봇 일일 사용 한도 기능 추가"
git push origin main
```

### 4. 테스트
- [ ] 할당 API에서 `dailyUsageLimit` 설정 가능 확인
- [ ] 채팅 API에서 한도 체크 작동 확인
- [ ] 한도 초과 시 429 에러 확인
- [ ] 사용량 조회 API 작동 확인
- [ ] 할당 수정 API 작동 확인

---

## 📌 요약

✅ **기능 구현 완료**
- 일일 사용 한도 설정 (기본 15회)
- 자동 사용량 추적 및 기록
- 한도 초과 시 실시간 차단
- 사용량 조회 및 통계
- 할당 후 한도 변경 가능

✅ **데이터베이스**
- `ai_bot_assignments.dailyUsageLimit` 필드 추가
- `bot_usage_logs` 테이블 생성
- `v_daily_bot_usage` VIEW 생성

✅ **API 엔드포인트**
- `POST /api/admin/ai-bots/assign` - 한도 설정
- `POST /api/ai/chat` - 한도 체크 + 기록
- `GET /api/admin/ai-bots/usage` - 사용량 조회
- `PATCH /api/admin/bot-assignments/[id]` - 한도 변경

---

**작성일**: 2026-03-09  
**작성자**: AI Assistant  
**배포 URL**: https://superplacestudy.pages.dev
