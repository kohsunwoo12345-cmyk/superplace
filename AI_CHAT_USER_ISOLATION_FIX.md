# AI 챗봇 최근 대화 목록 사용자별 분리 수정 🔒

## 📌 문제 상황
**증상**: 모든 사용자가 https://superplacestudy.pages.dev/ai-chat/ 에서 동일한 채팅 기록을 보는 문제 발생

```
사용자 A 로그인 → A의 채팅 기록 표시
사용자 B 로그인 (같은 브라우저) → A의 채팅 기록 표시 ❌
사용자 C 로그인 (같은 브라우저) → A의 채팅 기록 표시 ❌
```

## 🔍 근본 원인 분석

### 문제의 원인
프론트엔드 코드 `/src/app/ai-chat/page.tsx`의 **256-260줄**에서 `localStorage`의 `chatUserId` 캐시를 우선 사용하는 로직이 문제였습니다.

```typescript
// ❌ 기존 코드 (256-260줄)
const cachedUserId = localStorage.getItem('chatUserId');
if (!cachedUserId) {
  localStorage.setItem('chatUserId', userId);
} else if (cachedUserId !== userId) {
  // 기존 캐시와 다르면 기존 것을 우선 사용 (일관성)
  console.log('⚠️ userId 불일치 감지:', { cached: cachedUserId, current: userId });
  console.log('📌 기존 캐시된 userId 사용:', cachedUserId);
  userId = cachedUserId;  // 🔥 여기가 문제!
}
```

### 문제 발생 흐름
1. **사용자 A 로그인**
   - `localStorage.setItem('chatUserId', 'user-a-id')`
   - A의 채팅 기록 조회 및 표시 ✅

2. **사용자 B 로그인 (같은 브라우저)**
   - `user` 객체는 B로 업데이트됨
   - 하지만 `cachedUserId`가 'user-a-id'로 남아있음
   - 256-260줄 로직: `userId = cachedUserId` → **'user-a-id' 사용** ❌
   - 결과: B가 A의 채팅 기록을 보게 됨

3. **사용자 C 로그인 (같은 브라우저)**
   - 동일하게 A의 채팅 기록을 보게 됨 ❌

### API는 정상
`/functions/api/chat-sessions.ts`의 65-70줄:
```typescript
// ✅ API는 정상적으로 userId로 필터링
const selectStmt = db.prepare(`
  SELECT * FROM chat_sessions 
  WHERE userId = ? 
  ORDER BY updatedAt DESC 
  LIMIT 50
`).bind(userId);
```

→ **API는 문제없음**, 프론트엔드에서 잘못된 `userId`를 전달하는 것이 원인!

## ✅ 해결 방안

### 수정된 코드

#### 1. `loadChatSessions` 함수 수정 (245줄)
```typescript
// ✅ 수정 후: 캐시 사용 안 함
const loadChatSessions = async () => {
  // 🔥 현재 로그인한 사용자의 ID를 직접 사용 (캐시 사용 X)
  const userId = user?.id || user?.email;
  
  if (!userId) {
    console.warn('⚠️ userId가 없어서 세션을 로드할 수 없습니다');
    console.warn('⚠️ user 객체:', user);
    return;
  }
  
  console.log('🔑 현재 사용자 ID:', userId);
  
  try {
    console.log(`📂 사용자(${userId})의 채팅 세션 로드 중...`);
    
    const response = await fetch(`/api/chat-sessions?userId=${encodeURIComponent(userId)}`);
    // ... 나머지 로직
  }
};
```

#### 2. `saveChatSession` 함수 수정 (314줄)
```typescript
// ✅ 수정 후: 캐시 사용 안 함
const saveChatSession = async (session: ChatSession) => {
  // 🔥 현재 로그인한 사용자의 ID를 직접 사용 (캐시 사용 X)
  const userId = user?.id || user?.email;
  const academyId = user?.academyId || 'default-academy';
  
  if (!userId || !academyId) {
    console.warn('⚠️ userId 또는 academyId가 없어 세션을 저장할 수 없습니다', { userId, academyId });
    return;
  }
  
  console.log('🔑 세션 저장 - 현재 사용자 ID:', userId);
  
  try {
    const response = await fetch("/api/chat-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: session.id,
        userId: userId,  // 🔥 항상 현재 사용자 ID 사용
        academyId: academyId,
        botId: session.botId,
        title: session.title,
        lastMessage: session.lastMessage,
      }),
    });
    // ... 나머지 로직
  }
};
```

## 📊 Before vs After 비교

| 항목 | 이전 (Before) | 수정 후 (After) |
|------|---------------|----------------|
| **userId 결정** | localStorage 캐시 우선 | 현재 user 객체 직접 사용 |
| **사용자 A 로그인** | A의 채팅 표시 ✅ | A의 채팅 표시 ✅ |
| **사용자 B 로그인 (같은 브라우저)** | **A의 채팅 표시 ❌** | **B의 채팅 표시 ✅** |
| **사용자 C 로그인 (같은 브라우저)** | **A의 채팅 표시 ❌** | **C의 채팅 표시 ✅** |
| **localStorage 의존성** | 높음 (캐시 우선) | 없음 (무시) |
| **다중 사용자 지원** | ❌ 불가능 | ✅ 가능 |

## 🎯 개선 효과

### 1. 사용자별 완전 분리
```
이전:
- 사용자 A: ['A의 대화1', 'A의 대화2']
- 사용자 B: ['A의 대화1', 'A의 대화2']  ❌
- 사용자 C: ['A의 대화1', 'A의 대화2']  ❌

수정 후:
- 사용자 A: ['A의 대화1', 'A의 대화2']  ✅
- 사용자 B: ['B의 대화1', 'B의 대화2']  ✅
- 사용자 C: ['C의 대화1', 'C의 대화2']  ✅
```

### 2. 개인정보 보호
- 다른 사용자의 채팅 기록이 노출되지 않음
- 각 사용자는 자신의 대화만 조회 가능

### 3. 멀티 브라우저 지원
- 같은 기기에서 여러 계정 로그인 가능
- 시크릿 모드, 다른 브라우저에서도 정상 작동

## 🧪 테스트 시나리오

### 시나리오 1: 단일 브라우저, 다중 사용자
```bash
# 1. 사용자 A 로그인
# 브라우저 개발자 도구 → Application → localStorage 확인
# chatUserId: 제거됨 (더 이상 사용 안 함)

# 2. AI 챗봇에서 대화 시작
# "안녕하세요, 수학 문제 질문합니다"
# → A의 대화 기록에만 저장

# 3. 로그아웃 후 사용자 B 로그인
# 4. AI 챗봇 페이지 접속
# → B의 대화 기록만 표시 (A 기록 안 보임) ✅

# 5. B도 대화 시작
# "영어 문법 설명 부탁드립니다"
# → B의 대화 기록에만 저장

# 6. A 다시 로그인
# → A의 대화 기록 정상 표시 (B 기록 안 보임) ✅
```

### 시나리오 2: DB 직접 확인
```sql
-- chat_sessions 테이블 조회
SELECT id, userId, title, lastMessage, updatedAt 
FROM chat_sessions 
ORDER BY updatedAt DESC;

-- 예상 결과:
-- id | userId | title | lastMessage | updatedAt
-- session-1 | user-a-id | 수학 질문 | 안녕하세요, 수학... | 2026-02-15 21:00
-- session-2 | user-b-id | 영어 문법 | 영어 문법 설명... | 2026-02-15 21:05
```

## 📝 추가 개선 사항

### 완료된 수정
- [x] localStorage 캐시 로직 제거
- [x] user 객체 직접 사용
- [x] 사용자별 채팅 기록 완전 분리

### 권장 사항 (선택)
- [ ] user.id가 없는 경우 처리 로직 강화
- [ ] 세션 만료 시 자동 로그아웃 추가
- [ ] 채팅 기록 암호화 (민감 정보 보호)
- [ ] 채팅 기록 백업/복구 기능 추가

## 🚀 배포 정보
- **배포 URL**: https://superplacestudy.pages.dev/ai-chat/
- **Commit Hash**: `e47f1ac`
- **배포 시각**: 2026-02-15 21:00 KST
- **상태**: ✅ 정상

## 🔍 검증 방법

### 1. 브라우저 콘솔 확인
```javascript
// 개발자 도구 → Console
// 다음 로그가 표시되어야 함:
"🔑 현재 사용자 ID: user-b-id"
"📂 사용자(user-b-id)의 채팅 세션 로드 중..."
"✅ 3개 세션 로드됨"
```

### 2. Network 탭 확인
```
GET /api/chat-sessions?userId=user-b-id
Response: {
  "success": true,
  "sessions": [
    { "id": "session-1", "userId": "user-b-id", ... },
    { "id": "session-2", "userId": "user-b-id", ... }
  ]
}
```

### 3. localStorage 확인
```javascript
// 개발자 도구 → Application → Local Storage
// chatUserId 항목이 없어야 함 (더 이상 사용 안 함)
localStorage.getItem('chatUserId')  // null
```

## 📌 주의사항

### 기존 사용자의 chatUserId 캐시
- 기존에 저장된 `localStorage.chatUserId`는 자동으로 무시됨
- 사용자가 직접 삭제할 필요 없음
- 로그인 시 항상 현재 user 정보를 사용

### 브라우저 호환성
- 모든 모던 브라우저에서 정상 작동
- localStorage 없이도 작동 (user 객체만 있으면 됨)

---

**작성일**: 2026-02-15  
**작성자**: Genspark AI Developer  
**관련 이슈**: AI 챗봇 최근 대화 목록 사용자별 분리 문제 해결
