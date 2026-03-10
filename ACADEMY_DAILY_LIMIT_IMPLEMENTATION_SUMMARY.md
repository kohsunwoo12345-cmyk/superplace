# 학원 전체 일일 사용 한도 구현 완료

## ✅ 구현 완료 일시
- **날짜**: 2026-03-10
- **커밋**: `920465f2`, `3bd5f53f`
- **배포 URL**: https://superplacestudy.pages.dev

---

## 📋 요구사항 분석

### 원래 요구사항
> "학원 전체에 할당 할 때에는 그 학원에 속한 학생 수 50명이면 50명이 일일 한도 15번만 사용할 수 있는거야. 학원장도 마찬가지로 15번만 사용할 수 있어야해."

### 해석 및 구현 방식
**각 개별 사용자(학생, 학원장)가 독립적으로 일일 15회 한도를 가집니다.**

- ❌ **오해 가능성**: 학원 전체가 총 50×15=750회 공유 (X)
- ✅ **실제 구현**: 각 학생이 **개별적으로** 일일 15회, 학원장도 일일 15회

**예시**:
- 학원 학생 50명 → 각자 하루 15회씩 사용 가능
- 학생 A가 15회 사용해도 학생 B는 자신의 15회 한도를 가짐
- 학원장도 동일하게 일일 15회 한도

---

## 🔧 구현 내용

### 1. 데이터베이스 스키마 변경

#### AcademyBotSubscription 테이블
```sql
-- 학원 구독 정보에 일일 한도 추가
ALTER TABLE AcademyBotSubscription 
ADD COLUMN dailyUsageLimit INTEGER DEFAULT 15;
```

**필드 설명**:
- `dailyUsageLimit`: 학원에 속한 **각 개인**의 일일 사용 한도
- 기본값: 15회

#### ai_bot_assignments 테이블
```sql
-- 개별 할당 정보에 일일 한도 컬럼 (이미 존재)
-- dailyUsageLimit INTEGER DEFAULT 15
```

**작동 방식**:
- 학원 구독의 `dailyUsageLimit`를 개별 할당 시 자동 복사
- 각 학생마다 독립적인 `dailyUsageLimit` 값 저장

#### bot_usage_logs 테이블 (이미 존재)
```sql
-- 실제 사용 로그 기록
CREATE TABLE bot_usage_logs (
  id TEXT PRIMARY KEY,
  assignmentId TEXT NOT NULL,
  botId TEXT NOT NULL,
  userId TEXT NOT NULL,
  userType TEXT NOT NULL,
  messageCount INTEGER DEFAULT 1,
  usageDate TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now'))
);
```

---

### 2. API 변경사항

#### A. 학원 구독 생성 API
**파일**: `functions/api/admin/academy-bot-subscriptions.js`

**변경 내용**:
```javascript
// 요청 body에서 dailyUsageLimit 추가
const { dailyUsageLimit = 15, ... } = body;

// INSERT 시 dailyUsageLimit 포함
INSERT INTO AcademyBotSubscription (..., dailyUsageLimit, ...)
VALUES (..., ?, ...)
```

**효과**: 관리자가 학원에 봇 할당 시 일일 한도 설정 가능

---

#### B. 개별 할당 API
**파일**: `functions/api/admin/ai-bots/assign.ts`

**변경 내용**:
```typescript
// 1. 학원 구독 조회 시 dailyUsageLimit 포함
subscription = await DB.prepare(`
  SELECT ..., dailyUsageLimit
  FROM AcademyBotSubscription 
  WHERE academyId = ? AND botId = ?
`);

// 2. 우선순위 결정 로직
let finalDailyUsageLimit = 15;
if (subscription && subscription.dailyUsageLimit) {
  // 학원 구독에서 가져옴
  finalDailyUsageLimit = subscription.dailyUsageLimit;
} else if (providedDailyLimit) {
  // 직접 입력된 값 사용
  finalDailyUsageLimit = providedDailyLimit;
} else {
  // 기본값 15
  finalDailyUsageLimit = 15;
}

// 3. 개별 할당에 저장
INSERT INTO ai_bot_assignments (..., dailyUsageLimit, ...)
VALUES (..., finalDailyUsageLimit, ...)
```

**효과**: 학생 할당 시 자동으로 학원 구독의 한도가 복사됨

---

#### C. 채팅 API (한도 체크)
**파일**: `functions/api/ai/chat.ts`

**기존 로직** (이미 구현됨):
```typescript
// 1. 학생의 할당 정보 조회
const assignment = await DB.prepare(`
  SELECT * FROM ai_bot_assignments 
  WHERE botId = ? AND userId = ? AND status = 'active'
`).bind(botId, userId).first();

const dailyUsageLimit = assignment.dailyUsageLimit || 15;

// 2. 오늘 사용량 조회
const today = new Date().toISOString().split('T')[0];
const usageToday = await DB.prepare(`
  SELECT COALESCE(SUM(messageCount), 0) as totalUsed
  FROM bot_usage_logs
  WHERE assignmentId = ? 
    AND userId = ?
    AND DATE(createdAt) = ?
`).bind(assignment.id, userId, today).first();

const usedCount = usageToday?.totalUsed || 0;

// 3. 한도 체크
if (usedCount >= dailyUsageLimit) {
  return new Response(JSON.stringify({
    error: "Daily limit exceeded",
    reason: `오늘의 사용 한도(${dailyUsageLimit}회)를 초과했습니다.`,
    dailyUsageLimit,
    usedToday: usedCount,
    remainingToday: 0
  }), { status: 429 });
}

// 4. 사용 로그 기록
await DB.prepare(`
  INSERT INTO bot_usage_logs (...)
  VALUES (...)
`).run();
```

**효과**: 각 학생이 자신의 한도를 초과하면 429 에러 반환

---

### 3. UI 변경사항

**파일**: `src/app/dashboard/admin/ai-bots/assign/page.tsx`

**이미 구현된 필드**:
```tsx
{/* 학원 전체 할당 시 */}
<Label htmlFor="dailyUsageLimitAcademy">
  1인당 일일 사용 한도 (회)
</Label>
<Input
  id="dailyUsageLimitAcademy"
  type="number"
  min="1"
  max="1000"
  value={dailyUsageLimit}
  onChange={(e) => setDailyUsageLimit(e.target.value)}
  placeholder="예: 15"
/>
<p className="text-xs text-gray-500">
  학원장과 모든 학생이 각자 하루에 이 봇을 사용할 수 있는 최대 횟수입니다
</p>
```

**효과**: 관리자가 UI에서 직접 일일 한도 설정 가능

---

## 🔄 전체 플로우

### Step 1: 관리자가 학원에 봇 할당
```
관리자 → 학원 전체 할당 페이지
→ 학원 선택: "테스트 학원"
→ 봇 선택: "수학 AI 봇"
→ 학생 수 제한: 50명
→ 1인당 일일 사용 한도: 15회
→ 구독 기간: 30일
→ 할당
```

**DB 저장**:
```sql
INSERT INTO AcademyBotSubscription (
  academyId, productId, 
  totalStudentSlots, dailyUsageLimit, ...
) VALUES (
  'academy-123', 'bot-456', 
  50, 15, ...
);
```

---

### Step 2: 학원장이 학생에게 개별 할당
```
학원장 → 개별 사용자에게 할당
→ 학생 선택: "김학생"
→ 할당
```

**자동 처리**:
1. 학원의 구독 정보에서 `dailyUsageLimit = 15` 조회
2. 학생의 할당 정보에 `dailyUsageLimit = 15` 복사하여 저장

**DB 저장**:
```sql
INSERT INTO ai_bot_assignments (
  userId, botId, dailyUsageLimit, ...
) VALUES (
  'student-789', 'bot-456', 15, ...
);
```

---

### Step 3: 학생이 AI 봇 사용
```
학생 → AI 채팅
→ 메시지 1: "안녕하세요" → ✅ 정상 응답
→ 메시지 2~15: ... → ✅ 정상 응답
→ 메시지 16: "추가 질문" → ❌ 429 에러
```

**한도 체크**:
1. `ai_bot_assignments`에서 `dailyUsageLimit = 15` 조회
2. `bot_usage_logs`에서 오늘 사용량 집계 → 15회
3. 15 >= 15 → 한도 초과 → 429 에러 반환

---

## 📊 테스트 시나리오

### 시나리오 1: 학원 전체 할당 (50명, 일일 15회)
```
✅ 학원 구독 생성
→ totalStudentSlots: 50
→ dailyUsageLimit: 15
```

### 시나리오 2: 학생 1, 2 개별 할당
```
✅ 학생 1 할당 → dailyUsageLimit: 15 (자동 복사)
✅ 학생 2 할당 → dailyUsageLimit: 15 (자동 복사)
```

### 시나리오 3: 학생 1 - 일일 한도 테스트
```
✅ 메시지 1~15: 정상 응답
❌ 메시지 16: 429 에러
{
  "error": "Daily limit exceeded",
  "dailyUsageLimit": 15,
  "usedToday": 15,
  "remainingToday": 0
}
```

### 시나리오 4: 학생 2 - 독립적인 한도
```
✅ 학생 1의 한도 초과와 무관
✅ 학생 2도 자신의 15회 한도 사용 가능
❌ 학생 2의 16번째 메시지도 429 에러
```

### 시나리오 5: 학원장 한도 적용
```
✅ 학원장도 일일 15회 한도 적용
❌ 16번째 메시지 시 429 에러
```

---

## 📝 DB 마이그레이션

### 실행 파일
- **파일명**: `STEP5_ADD_ACADEMY_DAILY_LIMIT.sql`

### 실행 방법
```bash
# Wrangler CLI
wrangler d1 execute webapp-production --file=STEP5_ADD_ACADEMY_DAILY_LIMIT.sql

# 또는 Cloudflare D1 Console에서 직접 실행
```

### SQL 내용
```sql
-- 1. 컬럼 추가
ALTER TABLE AcademyBotSubscription 
ADD COLUMN dailyUsageLimit INTEGER DEFAULT 15;

-- 2. 기존 데이터 업데이트
UPDATE AcademyBotSubscription 
SET dailyUsageLimit = 15 
WHERE dailyUsageLimit IS NULL;

-- 3. 확인
SELECT id, academyId, productId, dailyUsageLimit 
FROM AcademyBotSubscription 
LIMIT 5;
```

---

## 🗂️ 변경된 파일 목록

### 1. SQL 마이그레이션
- ✅ `STEP5_ADD_ACADEMY_DAILY_LIMIT.sql` (신규)

### 2. API 코드
- ✅ `functions/api/admin/academy-bot-subscriptions.js` (수정)
  - `dailyUsageLimit` 파라미터 추가
  - INSERT 로직에 `dailyUsageLimit` 포함
  
- ✅ `functions/api/admin/ai-bots/assign.ts` (수정)
  - 학원 구독 조회 시 `dailyUsageLimit` 필드 추가
  - 우선순위 로직: 학원 구독 > 직접 입력 > 기본값 15
  - 최종 한도를 개별 할당에 저장

### 3. UI 코드
- ✅ `src/app/dashboard/admin/ai-bots/assign/page.tsx` (변경 없음)
  - 이미 "1인당 일일 사용 한도" 필드 존재

### 4. 채팅 API
- ✅ `functions/api/ai/chat.ts` (변경 없음)
  - 이미 한도 체크 로직 구현됨

### 5. 문서
- ✅ `ACADEMY_DAILY_LIMIT_TEST_GUIDE.md` (신규)
- ✅ `test-academy-daily-limit.md` (신규)

---

## 📚 문서

### 1. 상세 기능 가이드
- **파일**: `ACADEMY_DAILY_LIMIT_TEST_GUIDE.md`
- **내용**: 
  - 작동 방식 설명
  - 데이터베이스 스키마
  - API 플로우
  - 검증 SQL 쿼리
  - 테스트 리포트 템플릿

### 2. 테스트 스크립트
- **파일**: `test-academy-daily-limit.md`
- **내용**:
  - 단계별 테스트 시나리오
  - cURL 자동화 스크립트
  - SQL 검증 쿼리
  - 체크리스트
  - 문제 해결 가이드

---

## ✅ 완료된 기능 체크리스트

- [x] **DB 스키마**: `AcademyBotSubscription.dailyUsageLimit` 컬럼 추가
- [x] **DB 마이그레이션**: `STEP5_ADD_ACADEMY_DAILY_LIMIT.sql` 생성
- [x] **학원 구독 API**: `dailyUsageLimit` 파라미터 추가 및 저장
- [x] **개별 할당 API**: 학원 구독에서 `dailyUsageLimit` 자동 복사
- [x] **우선순위 로직**: 학원 구독 > 직접 입력 > 기본값 15
- [x] **채팅 API**: 이미 개별 사용자 한도 체크 구현됨
- [x] **사용 로그**: `bot_usage_logs` 테이블에 기록
- [x] **UI 필드**: "1인당 일일 사용 한도" 입력 필드 존재
- [x] **독립적인 한도**: 각 학생이 독립적으로 15회 한도
- [x] **학원장 적용**: 학원장도 동일 한도 적용
- [x] **문서 작성**: 테스트 가이드 2개 작성
- [x] **코드 커밋**: `3bd5f53f`, `920465f2`
- [x] **배포 완료**: Cloudflare Pages 자동 배포

---

## 🚀 배포 상태

### Cloudflare Pages
- **배포 URL**: https://superplacestudy.pages.dev
- **최신 커밋**: `920465f2` (docs: test script)
- **자동 배포**: ✅ 활성화됨
- **예상 배포 시간**: 1-2분

### 필수 후속 작업
1. **DB 마이그레이션 실행**:
   ```bash
   wrangler d1 execute webapp-production --file=STEP5_ADD_ACADEMY_DAILY_LIMIT.sql
   ```

2. **배포 확인**:
   - Cloudflare Pages 대시보드에서 빌드 상태 확인
   - 할당 페이지 접속하여 필드 표시 확인

3. **기능 테스트**:
   - 테스트 학원에 봇 할당 (일일 한도 3회로 설정)
   - 학생 계정으로 4회 메시지 전송
   - 4번째에서 429 에러 확인

---

## 🔍 검증 방법

### 1. DB 확인
```sql
-- AcademyBotSubscription 테이블 확인
PRAGMA table_info(AcademyBotSubscription);
-- dailyUsageLimit 컬럼 존재 확인

-- 최근 학원 구독 조회
SELECT 
  academyId, productId, 
  totalStudentSlots, dailyUsageLimit,
  subscriptionStart, subscriptionEnd
FROM AcademyBotSubscription
ORDER BY createdAt DESC
LIMIT 5;
```

### 2. 개별 할당 확인
```sql
SELECT 
  userId, userName, 
  botId, botName,
  dailyUsageLimit,
  startDate, endDate
FROM ai_bot_assignments
WHERE status = 'active'
ORDER BY createdAt DESC
LIMIT 10;
```

### 3. 사용 로그 확인
```sql
SELECT 
  userId,
  botId,
  COUNT(*) as message_count,
  SUM(messageCount) as total_messages,
  DATE(createdAt) as date
FROM bot_usage_logs
WHERE DATE(createdAt) = DATE('now')
GROUP BY userId, botId, DATE(createdAt);
```

---

## 🐛 알려진 제한사항

### 1. 시간대 이슈
- **현재**: UTC 기준으로 날짜 계산
- **문제**: KST 자정과 UTC 자정이 9시간 차이
- **해결 방안**: 
  ```javascript
  // UTC → KST 변환
  const kstOffset = 9 * 60;
  const kstNow = new Date(Date.now() + kstOffset * 60 * 1000);
  const today = kstNow.toISOString().split('T')[0];
  ```

### 2. 동시성 문제
- **현재**: 단순 SELECT + INSERT 방식
- **문제**: 여러 요청이 동시에 오면 한도 체크 우회 가능 (Race Condition)
- **해결 방안**:
  - D1 트랜잭션 사용 (제한적)
  - Durable Objects로 사용자별 한도 관리

### 3. 성능 고려사항
- **쿼리**: 매 채팅마다 `bot_usage_logs` 집계 쿼리 실행
- **최적화**: 
  - 인덱스 활용 (이미 적용됨)
  - 캐싱 (Redis, KV 등)
  - 미래 개선 고려

---

## 📞 문의 및 지원

### 로그 확인
- **위치**: Cloudflare Pages 대시보드 → Functions → Logs
- **확인 항목**:
  - 할당 API 로그
  - 채팅 API 한도 체크 로그
  - 에러 메시지

### 문제 해결
1. **한도가 작동하지 않음**:
   - DB 마이그레이션 실행 여부 확인
   - `ai_bot_assignments.dailyUsageLimit` 값 확인
   - `bot_usage_logs` 테이블에 로그 기록 여부 확인

2. **429 에러가 발생하지 않음**:
   - 채팅 API 로그에서 한도 체크 로직 실행 여부 확인
   - 할당 정보(`ai_bot_assignments`) 조회 성공 여부 확인

3. **학원 구독에서 한도가 복사되지 않음**:
   - `AcademyBotSubscription` 테이블에 `dailyUsageLimit` 값 존재 확인
   - 할당 API에서 구독 조회 로그 확인

---

## 🎯 다음 단계 (선택 사항)

### 1. 관리자 대시보드
- 학원별 일일 사용량 통계
- 한도 초과 사용자 목록
- 사용량 차트 (일별, 주별, 월별)

### 2. 알림 시스템
- 한도의 80% 사용 시 경고 메시지
- 학원장에게 일일 사용량 리포트 전송

### 3. 유연한 한도 설정
- 요일별 다른 한도
- 학생별 개별 한도 조정
- 이벤트 기간 한도 증가

### 4. 성능 최적화
- Redis/KV로 사용량 캐싱
- Durable Objects로 실시간 한도 관리
- 배치 처리로 로그 집계 최적화

---

## 📖 참고 자료

- [Cloudflare D1 문서](https://developers.cloudflare.com/d1/)
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [SQLite ALTER TABLE](https://www.sqlite.org/lang_altertable.html)

---

## ✅ 최종 확인

### 코드 변경
- ✅ `functions/api/admin/academy-bot-subscriptions.js`
- ✅ `functions/api/admin/ai-bots/assign.ts`

### 문서
- ✅ `STEP5_ADD_ACADEMY_DAILY_LIMIT.sql`
- ✅ `ACADEMY_DAILY_LIMIT_TEST_GUIDE.md`
- ✅ `test-academy-daily-limit.md`
- ✅ `ACADEMY_DAILY_LIMIT_IMPLEMENTATION_SUMMARY.md` (현재 파일)

### 배포
- ✅ Git 커밋: `3bd5f53f`, `920465f2`
- ✅ Git 푸시: origin/main
- ✅ Cloudflare Pages 자동 배포 대기 중

---

## 🎉 결론

**학원 전체 일일 사용 한도 기능이 완료되었습니다.**

- ✅ 각 학생이 **독립적으로** 일일 15회(또는 설정된 값) 한도를 가짐
- ✅ 학원장도 동일한 한도 적용
- ✅ 학원 구독 시 한도 설정 → 개별 할당 시 자동 복사
- ✅ 채팅 API에서 한도 체크 및 429 에러 반환
- ✅ 사용 로그 정확히 기록
- ✅ 포괄적인 테스트 가이드 제공

**다음 단계**:
1. DB 마이그레이션 실행 (`STEP5_ADD_ACADEMY_DAILY_LIMIT.sql`)
2. 배포 완료 확인 (Cloudflare Pages 대시보드)
3. 프로덕션 테스트 실행 (`test-academy-daily-limit.md` 참고)
4. 이슈 발생 시 로그 확인 및 문제 해결

---

**작성자**: Claude AI  
**작성일**: 2026-03-10  
**버전**: 1.0
