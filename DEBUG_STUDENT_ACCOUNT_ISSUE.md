# 🔍 학생/원장 계정 오류 진단 가이드

**작성 시간**: 2026-03-18 12:30 UTC

---

## 📋 현재 상황

- ✅ **관리자 계정**: AI 챗봇 정상 작동
- ❌ **학생/원장 계정**: 오류 발생
- ✅ **API 테스트 (curl)**: 정상 작동

→ **결론**: 프론트엔드 또는 권한 체크 관련 문제

---

## 🧪 디버깅 방법

### 1️⃣ 브라우저 개발자 도구로 오류 확인

#### A. Console 탭 확인
1. **F12** 눌러 개발자 도구 열기
2. **Console** 탭 클릭
3. 빨간색 에러 메시지 확인
4. 아래 스크린샷 예시 참고:

```
❌ Uncaught TypeError: ...
❌ Failed to fetch ...
❌ 401 Unauthorized ...
❌ 403 Forbidden ...
```

#### B. Network 탭 확인
1. **Network** 탭 클릭
2. AI 챗봇에 메시지 전송
3. **ai-chat** 요청 클릭
4. **Response** 탭에서 실제 서버 응답 확인

**확인할 내용**:
- Status Code: `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `500 Internal Server Error`
- Response Body: 에러 메시지

---

### 2️⃣ 브라우저 콘솔에서 직접 테스트

학생 계정으로 로그인한 상태에서 브라우저 콘솔(F12 → Console)에 다음 코드를 복사/붙여넣기:

```javascript
// ==========================================
// 1. 현재 사용자 정보 확인
// ==========================================
const user = JSON.parse(localStorage.getItem('user') || '{}');
console.log('👤 현재 사용자:', {
  id: user.id,
  email: user.email,
  role: user.role,
  academyId: user.academyId,
  name: user.name
});

// ==========================================
// 2. 할당된 봇 목록 조회
// ==========================================
fetch(`/api/user/ai-bots?academyId=${user.academyId}&userId=${user.id}`)
  .then(r => r.json())
  .then(data => {
    console.log('🤖 할당된 봇 목록:', data);
    if (data.bots && data.bots.length > 0) {
      console.log('✅ 봇 개수:', data.bots.length);
      console.log('📝 첫 번째 봇:', data.bots[0]);
      
      // 첫 번째 봇으로 AI 챗 테스트
      const testBotId = data.bots[0].id;
      console.log(`\n🧪 봇 ID ${testBotId}로 AI 챗 테스트 시작...`);
      
      // ==========================================
      // 3. AI 챗 API 호출 테스트
      // ==========================================
      fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: '안녕하세요',
          botId: testBotId,
          userId: user.id,
          conversationHistory: [],
          userRole: user.role,
          userAcademyId: user.academyId
        })
      })
      .then(r => {
        console.log('📡 AI 챗 응답 상태:', r.status, r.statusText);
        return r.json();
      })
      .then(data => {
        console.log('✅ AI 챗 응답:', data);
        if (data.success) {
          console.log('🎉 성공! 응답 내용:', data.response);
        } else {
          console.error('❌ 실패:', data.message || data.error);
        }
      })
      .catch(err => console.error('❌ AI 챗 에러:', err));
      
    } else {
      console.warn('⚠️ 할당된 봇이 없습니다');
    }
  })
  .catch(err => console.error('❌ 봇 목록 조회 에러:', err));

// ==========================================
// 4. 봇 접근 권한 체크 (학생 계정만)
// ==========================================
if (user.role === 'STUDENT') {
  setTimeout(() => {
    // 위에서 조회한 봇 ID를 사용하려면 실제 봇 ID를 입력하세요
    const testBotId = 'bot-1773803533575-qrn2pluec'; // 실제 봇 ID로 교체
    
    fetch(`/api/user/bot-access-check?userId=${user.id}&botId=${testBotId}&academyId=${user.academyId}`)
      .then(r => r.json())
      .then(data => {
        console.log('\n🔐 봇 접근 권한 체크:', data);
        if (data.hasAccess) {
          console.log('✅ 접근 가능');
        } else {
          console.error('❌ 접근 불가:', data.reason, '-', data.message);
        }
      })
      .catch(err => console.error('❌ 권한 체크 에러:', err));
  }, 2000);
}
```

---

### 3️⃣ 예상되는 오류 원인들

#### A. 봇이 할당되지 않음
**증상**:
```json
{
  "success": true,
  "bots": [],
  "count": 0,
  "message": "할당된 봇이 없습니다"
}
```

**원인**:
- 학생에게 봇이 할당되지 않음 (`ai_bot_assignments` 테이블)
- 학원에 봇 구독이 없음 (`AcademyBotSubscription` 테이블)

**해결**:
- 관리자 페이지에서 학생에게 봇 할당
- 또는 학원에 봇 구독 추가

---

#### B. 구독 만료
**증상**:
```json
{
  "hasAccess": false,
  "reason": "subscription_expired",
  "message": "학원 구독이 만료되었습니다"
}
```

**원인**:
- `AcademyBotSubscription.subscriptionEnd` < 현재 날짜

**해결**:
- 관리자 페이지에서 구독 연장

---

#### C. 할당 기간 만료
**증상**:
```json
{
  "hasAccess": false,
  "reason": "assignment_expired",
  "message": "개인 할당 기간이 만료되었습니다"
}
```

**원인**:
- `ai_bot_assignments.endDate` < 현재 날짜

**해결**:
- 관리자 페이지에서 학생 할당 기간 연장

---

#### D. 학생 수 제한 초과
**증상**:
```json
{
  "hasAccess": false,
  "reason": "slot_limit_exceeded",
  "message": "구독 학생 수를 초과했습니다"
}
```

**원인**:
- 활성 학생 수 > `AcademyBotSubscription.totalStudentSlots`

**해결**:
- 관리자 페이지에서 학생 slot 수 증가
- 또는 비활성 학생 제거

---

#### E. API 응답 오류 (500)
**증상**:
```json
{
  "success": false,
  "message": "오류가 발생했습니다",
  "error": "..."
}
```

**원인**:
- 서버 내부 오류
- Database 연결 실패
- Gemini API 오류

**해결**:
- Cloudflare Logs 확인
- `/home/user/webapp/functions/api/ai-chat.ts` 로그 확인

---

### 4️⃣ Cloudflare Logs 확인

실시간 로그 스트리밍:

```bash
cd /home/user/webapp
npx wrangler pages deployment tail --project-name=superplacestudy
```

**또는** Cloudflare Dashboard:
1. https://dash.cloudflare.com/
2. Pages → superplace
3. Logs → Real-time Logs
4. "Begin log stream" 클릭
5. 학생 계정에서 AI 챗 사용
6. 로그에서 에러 메시지 확인

---

### 5️⃣ 데이터베이스 직접 확인

Cloudflare Dashboard → D1 → `superplace-db` → Console:

#### A. 학생에게 할당된 봇 확인
```sql
-- 학생 ID를 실제 ID로 교체
SELECT 
  a.id, a.userId, a.botId, a.startDate, a.endDate, a.status,
  b.name as botName
FROM ai_bot_assignments a
LEFT JOIN ai_bots b ON a.botId = b.id
WHERE a.userId = '실제_학생_ID'
  AND a.status = 'active'
  AND date(a.endDate) >= date('now');
```

#### B. 학원 봇 구독 확인
```sql
-- 학원 ID를 실제 ID로 교체
SELECT 
  id, academyId, productId, productName,
  totalStudentSlots, usedStudentSlots,
  subscriptionStart, subscriptionEnd, isActive
FROM AcademyBotSubscription
WHERE academyId = '실제_학원_ID'
  AND isActive = 1
  AND date(subscriptionEnd) >= date('now');
```

#### C. 봇 정보 확인
```sql
-- 봇 ID를 실제 ID로 교체
SELECT 
  id, name, description, systemPrompt,
  model, isActive, knowledgeBase
FROM ai_bots
WHERE id = 'bot-1773803533575-qrn2pluec'
  AND isActive = 1;
```

---

## 🔧 임시 해결 방법

### 학생 계정에 봇 강제 할당 (관리자만)

Cloudflare Dashboard → D1 → Console:

```sql
-- 학생에게 봇 할당 (임시, 테스트용)
INSERT INTO ai_bot_assignments (
  id, userId, botId, userAcademyId,
  startDate, endDate, status, createdAt
) VALUES (
  'test-assign-' || (strftime('%s', 'now') * 1000),
  '실제_학생_ID',
  'bot-1773803533575-qrn2pluec',
  '실제_학원_ID',
  date('now'),
  date('now', '+1 year'),
  'active',
  datetime('now')
);
```

---

## 📊 체크리스트

디버깅 시 순서대로 확인:

- [ ] 1. 브라우저 Console에서 사용자 정보 확인 (id, role, academyId)
- [ ] 2. 봇 목록 API 응답 확인 (`/api/user/ai-bots`)
- [ ] 3. 봇이 비어있는지 확인 (bots.length === 0)
- [ ] 4. AI 챗 API 요청 확인 (`/api/ai-chat`)
- [ ] 5. Network 탭에서 Status Code 확인 (200, 400, 500 등)
- [ ] 6. Response Body에서 에러 메시지 확인
- [ ] 7. Cloudflare Logs에서 서버 에러 확인
- [ ] 8. D1 Database에서 할당 정보 확인
- [ ] 9. 봇 접근 권한 체크 API 응답 확인 (학생만)

---

## 💡 다음 단계

위 디버깅 결과를 바탕으로:

1. **Console 로그**의 스크린샷
2. **Network Response**의 JSON
3. **Cloudflare Logs**의 에러 메시지

를 공유해주시면 정확한 문제 파악 및 해결이 가능합니다.

---

**작성자**: Claude AI Assistant  
**날짜**: 2026-03-18 12:30 UTC  
**프로젝트**: Superplace Study - 꾸메땅학원
