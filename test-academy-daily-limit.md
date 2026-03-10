# 학원 전체 일일 한도 테스트 스크립트

## 사전 준비

### 1. DB 마이그레이션 실행
```bash
# Cloudflare D1 Console에서 실행
wrangler d1 execute webapp-production --file=STEP5_ADD_ACADEMY_DAILY_LIMIT.sql
```

또는 D1 Console (https://dash.cloudflare.com/)에서:
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

### 2. 테스트 계정 준비
- 관리자 계정 (ADMIN 또는 SUPER_ADMIN)
- 학원장 계정 (DIRECTOR)
- 학생 계정 2개 이상

## 테스트 시나리오

### 시나리오 1: 학원 전체에 봇 할당 (일일 한도 설정)

#### Step 1: 관리자로 로그인
```
URL: https://superplacestudy.pages.dev/login
- 관리자 계정으로 로그인
- 토큰 저장 확인
```

#### Step 2: 학원 전체 할당 페이지 접속
```
URL: https://superplacestudy.pages.dev/dashboard/admin/ai-bots/assign
```

#### Step 3: 학원 할당 설정
```
1. 할당 방식: "학원 전체에 할당" 선택
2. AI 봇 선택: 테스트용 봇 선택
3. 학원 선택: 테스트 학원 선택
4. 학생 수 제한: 50 입력
5. 1인당 일일 사용 한도: 3 입력 (테스트를 위해 낮은 값)
6. 구독 기간: 30일 선택
7. "할당" 버튼 클릭
```

#### Step 4: 결과 확인
```sql
-- D1 Console에서 확인
SELECT 
  academyId,
  productId,
  productName,
  totalStudentSlots,
  dailyUsageLimit,
  subscriptionStart,
  subscriptionEnd
FROM AcademyBotSubscription
ORDER BY createdAt DESC
LIMIT 1;
```

**기대 결과**:
- `totalStudentSlots`: 50
- `dailyUsageLimit`: 3

---

### 시나리오 2: 학원장이 개별 학생에게 할당

#### Step 1: 학원장으로 로그인
```
- 학원장 계정으로 로그인
- 해당 학원에 속한 계정이어야 함
```

#### Step 2: 학생 1에게 할당
```
1. 할당 방식: "개별 사용자에게 할당" 선택
2. AI 봇 선택: 위에서 할당한 봇 선택
3. 학생 선택: 학생 1 선택
4. "할당" 버튼 클릭
```

#### Step 3: 학생 2에게 할당
```
- 동일한 방법으로 학생 2에게도 할당
```

#### Step 4: 할당 결과 확인
```sql
-- D1 Console에서 확인
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
WHERE status = 'active'
ORDER BY createdAt DESC
LIMIT 2;
```

**기대 결과**:
- 두 학생 모두 `dailyUsageLimit = 3` (학원 구독에서 자동 복사)

---

### 시나리오 3: 학생 1 - 일일 한도 테스트

#### Step 1: 학생 1로 로그인
```
- 학생 1 계정으로 로그인
```

#### Step 2: AI 채팅 페이지 접속
```
URL: https://superplacestudy.pages.dev/ai-chat
- 할당받은 봇 선택
```

#### Step 3: 메시지 전송 (1~3회)
```
메시지 1: "안녕하세요" → ✅ 정상 응답
메시지 2: "수학 문제 도와주세요" → ✅ 정상 응답
메시지 3: "감사합니다" → ✅ 정상 응답
```

#### Step 4: 4번째 메시지 전송
```
메시지 4: "한 가지 더 질문할게요"
```

**기대 결과**:
```json
{
  "error": "Daily limit exceeded",
  "reason": "오늘의 사용 한도(3회)를 초과했습니다.",
  "dailyUsageLimit": 3,
  "usedToday": 3,
  "remainingToday": 0
}
```

#### Step 5: 사용 로그 확인
```sql
-- D1 Console에서 확인
SELECT 
  userId,
  botId,
  messageCount,
  DATE(createdAt) as usageDate,
  createdAt
FROM bot_usage_logs
WHERE userId = 'STUDENT_1_ID'
  AND DATE(createdAt) = DATE('now')
ORDER BY createdAt DESC;
```

**기대 결과**:
- 3개의 로그 기록
- 각각 `messageCount = 1`
- 총합 = 3

---

### 시나리오 4: 학생 2 - 독립적인 한도 확인

#### Step 1: 학생 2로 로그인
```
- 학생 2 계정으로 로그인
```

#### Step 2: AI 채팅에서 메시지 전송
```
메시지 1: "안녕하세요" → ✅ 정상 응답
메시지 2: "도움 필요합니다" → ✅ 정상 응답
메시지 3: "문제 풀어주세요" → ✅ 정상 응답
```

**핵심 확인사항**:
- 학생 1의 한도 초과와 무관하게 학생 2는 자신의 3회 한도를 가짐
- 학생 2도 4번째 메시지에서 한도 초과 에러 발생해야 함

#### Step 3: 사용 로그 확인
```sql
-- 학생 2의 오늘 사용량
SELECT 
  COALESCE(SUM(messageCount), 0) as usedToday
FROM bot_usage_logs
WHERE userId = 'STUDENT_2_ID'
  AND DATE(createdAt) = DATE('now');
```

**기대 결과**: `usedToday = 3`

---

### 시나리오 5: 학원장도 동일 한도 적용

#### Step 1: 학원장 계정에 봇 할당
```
- 관리자 또는 슈퍼관리자가 학원장 계정에도 봇 할당
```

#### Step 2: 학원장으로 로그인 후 메시지 전송
```
메시지 1~3: ✅ 정상 응답
메시지 4: ❌ 한도 초과 에러
```

**확인사항**:
- 학원장도 학생과 동일하게 일일 3회 한도 적용

---

### 시나리오 6: 다음 날 한도 리셋 확인

#### Step 1: 다음 날 (또는 DB에서 날짜 변경)
```sql
-- 테스트를 위해 로그의 날짜를 어제로 변경
UPDATE bot_usage_logs
SET createdAt = datetime(createdAt, '-1 day'),
    usageDate = DATE(createdAt, '-1 day')
WHERE userId IN ('STUDENT_1_ID', 'STUDENT_2_ID');
```

#### Step 2: 학생 1로 다시 메시지 전송
```
메시지 1: "새로운 날입니다" → ✅ 정상 응답
```

**기대 결과**:
- 한도가 리셋되어 다시 3회 사용 가능

---

## 검증 SQL 쿼리 모음

### 1. 학원 구독 확인
```sql
SELECT 
  a.name as academy_name,
  s.productName as bot_name,
  s.totalStudentSlots,
  s.usedStudentSlots,
  s.remainingStudentSlots,
  s.dailyUsageLimit,
  s.subscriptionStart,
  s.subscriptionEnd
FROM AcademyBotSubscription s
JOIN academy a ON s.academyId = a.id
WHERE s.isActive = 1
ORDER BY s.createdAt DESC;
```

### 2. 학원의 모든 학생 할당 현황
```sql
SELECT 
  a.userId,
  a.userName,
  a.botName,
  a.dailyUsageLimit,
  a.startDate,
  a.endDate,
  a.status
FROM ai_bot_assignments a
WHERE a.userAcademyId = 'ACADEMY_ID'
  AND a.status = 'active'
ORDER BY a.createdAt DESC;
```

### 3. 오늘 학원 전체 사용량 집계
```sql
SELECT 
  a.userId,
  a.userName,
  a.dailyUsageLimit,
  COALESCE(SUM(l.messageCount), 0) as usedToday,
  (a.dailyUsageLimit - COALESCE(SUM(l.messageCount), 0)) as remainingToday,
  CASE 
    WHEN COALESCE(SUM(l.messageCount), 0) >= a.dailyUsageLimit THEN '❌ 한도 초과'
    ELSE '✅ 사용 가능'
  END as status
FROM ai_bot_assignments a
LEFT JOIN bot_usage_logs l 
  ON l.assignmentId = a.id 
  AND DATE(l.createdAt) = DATE('now')
WHERE a.userAcademyId = 'ACADEMY_ID'
  AND a.status = 'active'
GROUP BY a.userId, a.userName, a.dailyUsageLimit
ORDER BY usedToday DESC;
```

### 4. 한도 초과 사용자 목록
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
WHERE a.userAcademyId = 'ACADEMY_ID'
  AND a.status = 'active'
GROUP BY a.userId, a.userName, a.dailyUsageLimit
HAVING usedToday >= a.dailyUsageLimit;
```

### 5. 특정 학생의 사용 내역
```sql
SELECT 
  DATE(createdAt) as date,
  COUNT(*) as message_count,
  SUM(messageCount) as total_messages
FROM bot_usage_logs
WHERE userId = 'STUDENT_ID'
GROUP BY DATE(createdAt)
ORDER BY date DESC
LIMIT 7;
```

---

## 자동화 테스트 스크립트 (cURL)

### 1. 학원 전체 할당
```bash
curl -X POST "https://superplacestudy.pages.dev/api/admin/academy-bot-subscriptions" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "academyId": "academy-test",
    "productId": "bot-math",
    "studentCount": 50,
    "subscriptionStart": "2026-03-10",
    "subscriptionEnd": "2026-04-10",
    "dailyUsageLimit": 3
  }'
```

### 2. 개별 학생 할당
```bash
curl -X POST "https://superplacestudy.pages.dev/api/admin/ai-bots/assign" \
  -H "Authorization: Bearer YOUR_DIRECTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "botId": "bot-math",
    "userId": "student-001"
  }'
```

### 3. 메시지 전송 (반복)
```bash
for i in {1..4}; do
  echo "=== 메시지 $i ==="
  curl -X POST "https://superplacestudy.pages.dev/api/ai/chat" \
    -H "Authorization: Bearer YOUR_STUDENT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"message\": \"테스트 메시지 $i\",
      \"botId\": \"bot-math\",
      \"userId\": \"student-001\",
      \"model\": \"gemini-1.5-flash\"
    }" | jq .
  echo ""
  sleep 1
done
```

### 4. 사용량 조회
```bash
curl "https://superplacestudy.pages.dev/api/admin/ai-bots/usage?userId=student-001&botId=bot-math" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" | jq .
```

---

## 체크리스트

### 배포 전
- [ ] `STEP5_ADD_ACADEMY_DAILY_LIMIT.sql` 실행
- [ ] 기존 `AcademyBotSubscription` 테이블에 `dailyUsageLimit` 컬럼 확인
- [ ] 코드 변경사항 배포 (Cloudflare Pages 자동 배포)

### 테스트 실행
- [ ] 학원 전체 할당 시 `dailyUsageLimit` 저장 확인
- [ ] 개별 학생 할당 시 `dailyUsageLimit` 자동 복사 확인
- [ ] 학생이 한도만큼 메시지 전송 가능
- [ ] 한도 초과 시 429 에러 발생
- [ ] 다른 학생은 독립적인 한도 가짐
- [ ] 학원장도 동일한 한도 적용
- [ ] 사용 로그가 `bot_usage_logs`에 정확히 기록
- [ ] 다음 날 한도 리셋

### 프로덕션 확인
- [ ] 실제 학원 데이터로 테스트
- [ ] 로그 모니터링 (Cloudflare Pages Functions Logs)
- [ ] 성능 확인 (DB 쿼리 속도)
- [ ] 에러 핸들링 확인

---

## 예상 문제 및 해결

### 문제 1: `dailyUsageLimit` 컬럼이 없음
```
에러: no such column: dailyUsageLimit
```

**해결**:
```sql
ALTER TABLE AcademyBotSubscription ADD COLUMN dailyUsageLimit INTEGER DEFAULT 15;
ALTER TABLE ai_bot_assignments ADD COLUMN dailyUsageLimit INTEGER DEFAULT 15;
```

### 문제 2: 기존 할당에 `dailyUsageLimit`이 NULL
```sql
UPDATE ai_bot_assignments 
SET dailyUsageLimit = 15 
WHERE dailyUsageLimit IS NULL;
```

### 문제 3: 시간대 차이로 한도 체크 오류
현재 코드는 UTC 기준. KST로 변경하려면:
```javascript
const today = new Date().toISOString().split('T')[0]; // UTC
// KST로 변경:
const kstOffset = 9 * 60; // 9시간
const kstNow = new Date(Date.now() + kstOffset * 60 * 1000);
const today = kstNow.toISOString().split('T')[0];
```

### 문제 4: 동시 요청 시 한도 체크 우회
Race condition으로 여러 요청이 동시에 오면 한도를 초과할 수 있음.

**임시 해결**: DB 트랜잭션 사용 (D1은 제한적)
**근본 해결**: Durable Objects 사용하여 사용자별 한도 관리

---

## 테스트 완료 보고서 템플릿

```
# 학원 전체 일일 한도 테스트 결과

테스트 일시: YYYY-MM-DD HH:MM
테스터: [이름]
환경: Production / Staging

## 테스트 결과

### ✅ 통과한 테스트
- [ ] 학원 구독 생성 시 dailyUsageLimit 저장
- [ ] 개별 할당 시 자동 복사
- [ ] 학생 한도 체크 정상 작동
- [ ] 독립적인 한도 확인
- [ ] 학원장 한도 적용

### ❌ 실패한 테스트
- [ ] [실패 항목 및 사유]

### 📊 성능 측정
- 학원 할당 API 응답 시간: [X]ms
- 개별 할당 API 응답 시간: [X]ms
- 채팅 한도 체크 시간: [X]ms

### 🐛 발견된 이슈
1. [이슈 제목]: [설명]

### 📝 추가 의견
[테스트 중 발견된 개선사항이나 건의사항]

---
테스트 완료: ✅ / ⚠️ / ❌
```
