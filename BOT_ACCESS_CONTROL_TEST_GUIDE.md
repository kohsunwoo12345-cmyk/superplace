# AI 봇 구독 만료 시 자동 비활성화 테스트 가이드

## 📋 구현 완료 기능

### 1. 학원 구독 만료 시 자동 차단
- **학원의 구독 기간 종료 시** 모든 학생의 봇 사용이 즉시 차단됩니다.
- 학생 개인에게 할당된 사용 기간이 남아있어도 **학원 구독 우선**으로 차단됩니다.

### 2. 재구매/재할당 시 자동 복원
- 같은 봇을 **재구매 또는 재할당** 받으면 기존 학생들이 자동으로 다시 사용할 수 있습니다.
- 기존 할당 정보(`ai_bot_assignments`)가 유지되므로 별도 재설정 불필요합니다.

### 3. 학생 수 제한 관리
- 구독 시 설정한 **학생 수(totalStudentSlots)**를 초과하면 나머지 학생은 차단됩니다.
- 재구매 시 인원이 줄어든 경우 (예: 20명 → 18명):
  - **할당 순서(startDate)** 기준으로 먼저 할당받은 학생부터 우선권을 가집니다.
  - 19번째, 20번째 학생은 자동으로 접근이 차단됩니다.

---

## 🔍 테스트 시나리오

### 시나리오 1: 학원 구독 만료 → 모든 학생 차단

#### 준비 사항
```sql
-- 1. AcademyBotSubscription 레코드가 있는지 확인
SELECT * FROM AcademyBotSubscription 
WHERE academyId = 'academy-1771479246368-5viyubmqk' 
AND productId = 'bot-1772458232285-1zgtygvh1';

-- 2. 학생 할당 확인 (예: 20명)
SELECT COUNT(*) as student_count 
FROM ai_bot_assignments 
WHERE botId = 'bot-1772458232285-1zgtygvh1' 
AND userAcademyId = 'academy-1771479246368-5viyubmqk' 
AND status = 'active';
```

#### 테스트 절차
1. **구독 만료일 변경** (과거로 설정):
   ```sql
   UPDATE AcademyBotSubscription 
   SET subscriptionEnd = '2025-01-01T00:00:00Z', isActive = 0
   WHERE academyId = 'academy-1771479246368-5viyubmqk' 
   AND productId = 'bot-1772458232285-1zgtygvh1';
   ```

2. **학생 계정으로 로그인**: https://superplacestudy.pages.dev/login
   - 테스트 학생 계정 사용 (academyId가 `academy-1771479246368-5viyubmqk`인 학생)

3. **AI 채팅 페이지 접속**: https://superplacestudy.pages.dev/ai-chat

4. **예상 결과**:
   - 봇이 목록에 표시되지 않음 (또는 "사용 불가" 표시)
   - 메시지 전송 시도 시 에러:
     ```
     이 봇을 더 이상 사용할 수 없습니다.
     
     사유: 학원의 AI 봇 구독이 만료되었습니다.
     ```

5. **브라우저 콘솔 확인** (F12):
   ```
   🔐 학생 계정 - 봇 접근 권한 체크 중...
   ❌ 구독 만료 또는 없음: academyId=academy-1771479246368-5viyubmqk, botId=bot-1772458232285-1zgtygvh1
   ⚠️ 접근 불가 봇: ["수학 PDF 테스트 봇 (학원의 AI 봇 구독이 만료되었습니다.)"]
   ✅ 접근 가능한 봇: 0/1
   ```

---

### 시나리오 2: 재구매 후 자동 복원

#### 테스트 절차
1. **구독 재활성화** (subscriptionEnd를 미래로 변경):
   ```sql
   UPDATE AcademyBotSubscription 
   SET subscriptionEnd = '2026-03-31T23:59:59Z', isActive = 1
   WHERE academyId = 'academy-1771479246368-5viyubmqk' 
   AND productId = 'bot-1772458232285-1zgtygvh1';
   ```

2. **학생 계정 페이지 새로고침**: https://superplacestudy.pages.dev/ai-chat

3. **예상 결과**:
   - 봇이 다시 목록에 표시됨
   - 메시지 전송 가능
   - 기존 대화 기록 유지 (세션 데이터 보존)

4. **브라우저 콘솔 확인**:
   ```
   🔐 학생 계정 - 봇 접근 권한 체크 중...
   ✅ 봇 접근 권한 확인 완료: userId=user-xxx, botId=bot-xxx, rank=1/20
   ✅ 접근 가능한 봇: 1/1
   ```

---

### 시나리오 3: 인원 감소 (20명 → 18명) 시 우선순위 적용

#### 준비 사항
```sql
-- 1. 현재 학생 수 및 할당 순서 확인
SELECT userId, userName, startDate, 
       ROW_NUMBER() OVER (ORDER BY startDate ASC) as priority_rank
FROM ai_bot_assignments
WHERE botId = 'bot-1772458232285-1zgtygvh1' 
AND userAcademyId = 'academy-1771479246368-5viyubmqk' 
AND status = 'active'
ORDER BY startDate ASC;

-- 예상 결과: 20명의 학생, 1번~20번 순위
-- 19번, 20번 학생의 userId 확인 (테스트 대상)
```

#### 테스트 절차
1. **구독 인원 감소** (20명 → 18명):
   ```sql
   UPDATE AcademyBotSubscription 
   SET totalStudentSlots = 18, remainingStudentSlots = 0
   WHERE academyId = 'academy-1771479246368-5viyubmqk' 
   AND productId = 'bot-1772458232285-1zgtygvh1';
   ```

2. **19번째 학생 계정으로 로그인**:
   - 할당 순서 19번 학생의 userId로 로그인

3. **AI 채팅 페이지 접속**: https://superplacestudy.pages.dev/ai-chat

4. **예상 결과**:
   - 봇이 목록에 표시되지 않음
   - 메시지 전송 시도 시 에러:
     ```
     이 봇을 더 이상 사용할 수 없습니다.
     
     사유: 학원의 AI 봇 사용 인원(18명)을 초과했습니다. (현재 순위: 19)
     ```

5. **18번째 학생 계정으로 로그인** (비교 테스트):
   - 할당 순서 18번 학생은 정상 사용 가능

6. **브라우저 콘솔 확인**:
   ```
   # 19번째 학생
   🔐 학생 계정 - 봇 접근 권한 체크 중...
   ❌ 할당 인원 초과: rank=19, limit=18
   ⚠️ 접근 불가 봇: ["수학 PDF 테스트 봇 (학원의 AI 봇 사용 인원(18명)을 초과했습니다. (현재 순위: 19))"]
   
   # 18번째 학생
   ✅ 봇 접근 권한 확인 완료: userId=user-xxx, botId=bot-xxx, rank=18/18
   ```

---

## 🛠️ API 엔드포인트

### 1. `/api/user/bot-access-check`
**GET 요청으로 학생의 봇 접근 권한 확인**

#### 요청 예시
```
GET /api/user/bot-access-check?userId=user-xxx&botId=bot-xxx&academyId=academy-xxx
```

#### 응답 예시 (접근 가능)
```json
{
  "hasAccess": true,
  "reason": "접근 가능",
  "subscription": {
    "subscriptionEnd": "2026-03-31T23:59:59Z",
    "totalStudentSlots": 20,
    "usedSlots": 20
  },
  "assignment": {
    "startDate": "2025-01-15T00:00:00Z",
    "endDate": "2025-12-31T23:59:59Z",
    "studentRank": 5
  }
}
```

#### 응답 예시 (접근 불가 - 구독 만료)
```json
{
  "hasAccess": false,
  "reason": "학원의 AI 봇 구독이 만료되었습니다.",
  "subscription": {
    "subscriptionEnd": "2025-01-01T00:00:00Z",
    "isExpired": true
  }
}
```

#### 응답 예시 (접근 불가 - 인원 초과)
```json
{
  "hasAccess": false,
  "reason": "학원의 AI 봇 사용 인원(18명)을 초과했습니다. (현재 순위: 19)",
  "subscription": {
    "totalStudentSlots": 18
  },
  "assignment": {
    "studentRank": 19
  }
}
```

---

### 2. `/api/ai/chat` (POST)
**메시지 전송 시 자동으로 권한 체크**

#### 요청 바디 (학생 계정)
```json
{
  "message": "안녕하세요",
  "botId": "bot-1772458232285-1zgtygvh1",
  "userId": "user-1771479246368-du957iw33",
  "userRole": "STUDENT",
  "userAcademyId": "academy-1771479246368-5viyubmqk"
}
```

#### 응답 (권한 없을 경우)
```json
{
  "error": "Bot access denied",
  "reason": "학원의 AI 봇 구독이 만료되었습니다."
}
```
**HTTP Status**: `403 Forbidden`

---

## 📊 데이터베이스 스키마

### AcademyBotSubscription
학원의 AI 봇 구독 정보

```sql
CREATE TABLE AcademyBotSubscription (
  id TEXT PRIMARY KEY,
  academyId TEXT NOT NULL,
  productId TEXT NOT NULL,  -- botId
  productName TEXT,
  totalStudentSlots INTEGER DEFAULT 0,
  usedStudentSlots INTEGER DEFAULT 0,
  remainingStudentSlots INTEGER DEFAULT 0,
  subscriptionStart TEXT NOT NULL,
  subscriptionEnd TEXT NOT NULL,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**핵심 필드**:
- `subscriptionEnd`: 구독 만료일 (UTC ISO 8601)
- `totalStudentSlots`: 사용 가능한 총 학생 수
- `isActive`: 구독 활성 여부 (0 또는 1)

---

### ai_bot_assignments
학생별 AI 봇 할당 정보

```sql
CREATE TABLE ai_bot_assignments (
  id TEXT PRIMARY KEY,
  botId TEXT NOT NULL,
  userId TEXT NOT NULL,
  userAcademyId TEXT,
  startDate TEXT NOT NULL,
  endDate TEXT,
  status TEXT DEFAULT 'active',  -- 'active' | 'expired'
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**핵심 필드**:
- `startDate`: 할당 시작일 (우선순위 결정 기준)
- `endDate`: 개별 할당 만료일 (NULL 가능)
- `status`: 할당 상태 ('active' | 'expired')

---

## 🔐 권한 체크 흐름도

```
학생이 AI 봇 사용 시도
    ↓
1. 학원 구독 존재 확인 (AcademyBotSubscription)
    ├─ 없음 → ❌ "구독이 없습니다"
    └─ 있음 → 2단계
    ↓
2. 구독 만료일 확인 (subscriptionEnd > now)
    ├─ 만료 → ❌ "구독이 만료되었습니다"
    └─ 유효 → 3단계
    ↓
3. 학생 할당 확인 (ai_bot_assignments)
    ├─ 없음 → ❌ "할당되지 않았습니다"
    └─ 있음 → 4단계
    ↓
4. 개별 할당 기간 확인 (endDate > now)
    ├─ 만료 → ❌ "사용 기간이 만료되었습니다"
    └─ 유효 → 5단계
    ↓
5. 학원 전체 할당 인원 조회 (ORDER BY startDate)
    ↓
6. 현재 학생의 우선순위 계산 (studentRank)
    ↓
7. 인원 제한 확인 (studentRank <= totalStudentSlots)
    ├─ 초과 → ❌ "사용 인원을 초과했습니다"
    └─ 통과 → ✅ 사용 허용
```

---

## 🧪 프론트엔드 테스트 체크리스트

### 봇 목록 페이지 (`/ai-chat`)

- [ ] **관리자 계정**: 모든 봇 표시 (권한 체크 없음)
- [ ] **학원장 계정**: 학원에 할당된 모든 봇 표시
- [ ] **학생 계정 (구독 유효)**: 접근 가능한 봇만 표시
- [ ] **학생 계정 (구독 만료)**: 봇 목록 비어있음 + 알림
- [ ] **학생 계정 (인원 초과)**: 해당 봇 목록에서 제외

### 채팅 메시지 전송

- [ ] **메시지 전송 전**: `/api/user/bot-access-check` 호출
- [ ] **권한 없을 시**: 알림 표시 + 봇 목록 새로고침
- [ ] **API 응답 403**: "사용할 수 없습니다" 메시지 표시
- [ ] **구독 만료 후**: 새로고침 시 봇 자동 제거

### 브라우저 콘솔 로그 (F12)

- [ ] `🔐 학생 계정 - 봇 접근 권한 체크 중...` 로그 확인
- [ ] `✅ 봇 접근 권한 확인 완료: ... rank=X/Y` 표시
- [ ] `⚠️ 접근 불가 봇: [...]` 이유와 함께 표시
- [ ] `❌ 할당 인원 초과: rank=X, limit=Y` 명확한 사유

---

## 🚨 예상 문제 및 해결방법

### 문제 1: 학생이 봇을 여전히 볼 수 있음
**원인**: 브라우저 캐시 또는 localStorage에 이전 봇 목록이 남아있음  
**해결**:
```javascript
// 브라우저 콘솔에서 실행
localStorage.clear();
location.reload();
```

### 문제 2: API 응답 500 에러
**원인**: D1 데이터베이스 연결 오류 또는 테이블 누락  
**확인사항**:
```sql
-- 테이블 존재 확인
SELECT name FROM sqlite_master WHERE type='table' 
AND name IN ('AcademyBotSubscription', 'ai_bot_assignments');

-- 데이터 확인
SELECT * FROM AcademyBotSubscription LIMIT 5;
SELECT * FROM ai_bot_assignments LIMIT 5;
```

### 문제 3: 우선순위가 제대로 적용되지 않음
**원인**: `startDate` 필드가 NULL 또는 동일한 값  
**해결**:
```sql
-- startDate NULL 체크
SELECT COUNT(*) FROM ai_bot_assignments WHERE startDate IS NULL;

-- 중복 startDate 확인
SELECT startDate, COUNT(*) as cnt 
FROM ai_bot_assignments 
WHERE botId = 'bot-xxx' 
GROUP BY startDate 
HAVING cnt > 1;
```

---

## 📝 배포 및 운영 가이드

### 1. 배포 완료 확인
- **Live URL**: https://superplacestudy.pages.dev
- **AI 채팅 페이지**: https://superplacestudy.pages.dev/ai-chat
- **GitHub Repository**: https://github.com/kohsunwoo12345-cmyk/superplace
- **최신 커밋**: `33e8a1f` (feat: AI 봇 구독 만료 시 자동 비활성화)

### 2. 운영 체크리스트
- [ ] Cloudflare Pages 빌드 성공 확인
- [ ] D1 데이터베이스 연결 정상 동작 확인
- [ ] API 엔드포인트 `/api/user/bot-access-check` 테스트
- [ ] 학생 계정으로 실제 사용 테스트
- [ ] 구독 만료 시나리오 테스트 (구독 종료일 변경)
- [ ] 인원 초과 시나리오 테스트 (totalStudentSlots 변경)

### 3. 모니터링
**로그 확인 방법**:
```bash
# Cloudflare Pages 로그 확인
wrangler pages deployment tail --project-name=superplacestudy
```

**주요 로그 키워드**:
- `🔐 학생 계정 - 봇 접근 권한 확인 중`
- `✅ 봇 접근 권한 확인 완료`
- `❌ 구독 만료 또는 없음`
- `❌ 할당 인원 초과`

---

## ✅ 테스트 완료 체크리스트

### 기본 기능
- [ ] 학원 구독 만료 시 모든 학생 차단
- [ ] 재구매 시 기존 학생 자동 복원
- [ ] 인원 감소 시 우선순위 기반 차단 (startDate 오름차순)

### API 동작
- [ ] `/api/user/bot-access-check` 정상 응답
- [ ] `/api/ai/chat` 권한 체크 (학생 계정)
- [ ] 403 Forbidden 응답 시 명확한 사유 제공

### 프론트엔드
- [ ] 봇 목록 로드 시 권한 체크
- [ ] 메시지 전송 전 권한 재확인
- [ ] 접근 불가 시 사용자 알림
- [ ] 봇 목록 자동 새로고침

### 엣지 케이스
- [ ] 구독 없는 학원의 학생
- [ ] 할당 없는 학생
- [ ] 개별 할당 기간 만료
- [ ] 구독 인원 0명 설정
- [ ] 동시 다발적 메시지 전송

---

## 📞 문의 및 지원

- **개발자**: Claude AI Assistant
- **구현 날짜**: 2026-03-04
- **버전**: v1.0.0
- **커밋**: `33e8a1f` (feat: AI 봇 구독 만료 시 자동 비활성화 - 프론트엔드 통합)

**문제 발생 시**:
1. 브라우저 콘솔 로그 (F12) 확인
2. API 응답 상태 코드 및 메시지 확인
3. D1 데이터베이스 데이터 확인
4. GitHub 이슈 또는 문서 참조
