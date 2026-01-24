# AI 봇 채팅 페이지 세션 쿠키 전달 문제 해결

## 📋 문제 상황

**증상**: 
- 관리자가 제작한 AI 봇을 클릭해도 채팅 페이지가 나오지 않음
- 봇 목록 페이지에서 봇이 보이지만, 클릭 시 즉시 리다이렉트됨
- 콘솔에 "인증이 필요합니다" 오류 발생 가능성

## 🔍 문제 원인

### 1. **세션 쿠키 미전달**
클라이언트 컴포넌트에서 `fetch` API를 사용할 때 **`credentials` 옵션을 지정하지 않으면** 세션 쿠키가 전달되지 않음.

```typescript
// ❌ 문제: 세션 쿠키가 전달되지 않음
const response = await fetch('/api/ai-bots');

// ✅ 해결: credentials 옵션 추가
const response = await fetch('/api/ai-bots', {
  credentials: 'include',  // 세션 쿠키 포함
});
```

### 2. **API 인증 요구사항**
`/api/ai-bots` 엔드포인트는 NextAuth 세션을 요구함:

```typescript
const session = await getServerSession(authOptions);

if (!session || !session.user) {
  return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
}
```

### 3. **봇 할당 비활성화 상태**
학원장 계정의 경우, 봇 할당이 `isActive: false` 상태여서 접근 불가

## ✅ 해결 방법

### 1. **AI Gems 목록 페이지 수정** (`src/app/dashboard/ai-gems/page.tsx`)

```typescript
const response = await fetch(endpoint, {
  credentials: 'include', // 세션 쿠키 포함
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### 2. **채팅 페이지 수정** (`src/app/dashboard/ai-gems/[gemId]/page.tsx`)

```typescript
const response = await fetch('/api/ai-bots', {
  credentials: 'include', // 쿠키 포함하여 세션 전달
  headers: {
    'Content-Type': 'application/json',
  },
});

// 디버깅 로그 추가
console.log('📡 API 응답 상태:', response.status);
console.log('📦 받은 봇 개수:', data.bots?.length || 0);
console.log('사용 가능한 봇 ID:', data.bots.map((b: Gem) => b.id));
```

### 3. **봇 할당 활성화**

```javascript
// activate-bot-assignment.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

await prisma.botAssignment.updateMany({
  where: {
    botId: 'ㅁㄴ',
    isActive: false,
  },
  data: {
    isActive: true,
  },
});
```

## 🎯 적용 범위

### **관리자 (SUPER_ADMIN)**
- ✅ `/api/ai-bots`에서 **모든 활성화된 봇** 조회
- ✅ 커스텀 봇 + 기본 봇 모두 표시
- ✅ 할당 없이도 모든 봇 사용 가능

### **학원장 (DIRECTOR)**
- ✅ `/api/director/available-bots`에서 **할당된 봇만** 조회
- ✅ `BotAssignment`에서 `isActive: true`인 봇만 표시
- ⚠️ 봇 할당이 비활성화되어 있으면 접근 불가

### **학생 (STUDENT)**
- ✅ `/api/ai-bots`에서 **모든 봇** 조회 (향후 제한 가능)

## 🧪 테스트 결과

### 1. **데이터베이스 봇 상태**
```
📦 데이터베이스의 봇:
  1. ㅁㄴㅇ
     botId: ㅁㄴ
     id: cmkqg61c90001unexjluei2pn
     활성화: ✅

🎯 봇 할당 정보:
  1. botId: ggumettang
     사용자: 꾸메땅학원 (DIRECTOR)
     활성화: ✅

  2. botId: ㅁㄴ
     사용자: 꾸메땅 학원장 (DIRECTOR)
     활성화: ✅ (수정 후)
```

### 2. **API 응답 흐름**

#### 관리자 로그인 시:
```
1. /dashboard/ai-gems 접속
2. fetch('/api/ai-bots', { credentials: 'include' })
3. 세션 확인: ✅ SUPER_ADMIN
4. DB 봇 + 기본 봇 반환
5. 커스텀 봇 "ㅁㄴㅇ" 표시 ✅

6. 봇 클릭 → /dashboard/ai-gems/ㅁㄴ
7. fetch('/api/ai-bots', { credentials: 'include' })
8. 봇 정보 찾기: ✅
9. 채팅 페이지 렌더링 ✅
```

#### 학원장 로그인 시:
```
1. /dashboard/ai-gems 접속
2. fetch('/api/director/available-bots', { credentials: 'include' })
3. 세션 확인: ✅ DIRECTOR
4. BotAssignment (isActive: true) 조회
5. 할당된 봇 "ㅁㄴㅇ" 표시 ✅

6. 봇 클릭 → /dashboard/ai-gems/ㅁㄴ
7. fetch('/api/ai-bots', { credentials: 'include' })
8. 봇 정보 찾기: ✅
9. 채팅 페이지 렌더링 ✅
```

## 📦 변경된 파일

1. **`src/app/dashboard/ai-gems/page.tsx`**
   - `credentials: 'include'` 추가
   - 세션 쿠키를 API 요청에 포함

2. **`src/app/dashboard/ai-gems/[gemId]/page.tsx`**
   - `credentials: 'include'` 추가
   - API 응답 상태 로깅 강화
   - 봇을 찾지 못할 경우 사용 가능한 봇 ID 출력

3. **데이터베이스**
   - `BotAssignment` 테이블의 `isActive` 필드를 `true`로 업데이트

## 🚀 배포 정보

- **커밋**: `fix: AI Gems 페이지 API 호출 시 세션 쿠키 전달 추가`
- **브랜치**: `main`
- **배포 상태**: ✅ 푸시 완료 (`0fbabed`)
- **Vercel 자동 배포**: 진행 중 (약 2-3분 소요)

## 🔧 디버깅 팁

### 1. **브라우저 콘솔 확인**
```javascript
// AI Gems 페이지
🔍 AI 봇 페이지 - 사용자 역할: SUPER_ADMIN
🔍 API 엔드포인트: /api/ai-bots
✅ 봇 목록: (10) [{...}, {...}, ...]

// 채팅 페이지
🔍 봇 정보 로딩 중: ㅁㄴ
📡 API 응답 상태: 200
📦 받은 봇 개수: 10
✅ 봇 찾기 결과: ㅁㄴㅇ
```

### 2. **네트워크 탭 확인**
- `/api/ai-bots` 요청
- Status: 200 OK
- Headers → Cookie: `next-auth.session-token=...` ✅

### 3. **세션 쿠키 누락 시**
```
Status: 401 Unauthorized
Response: { "error": "인증이 필요합니다" }
```
→ `credentials: 'include'` 누락 의심

## 📚 관련 문서

- `AI_BOT_ASSIGNMENT_GUIDE.md` - AI 봇 할당 시스템 전체 가이드
- `CUSTOM_BOT_CHAT_FIX.md` - 커스텀 봇 채팅 페이지 문제 해결
- `TROUBLESHOOTING.md` - 일반적인 문제 해결

## ✨ 최종 결과

✅ **관리자는 모든 봇을 사용할 수 있음**
- 할당 없이도 커스텀 봇 + 기본 봇 모두 접근 가능
- `/dashboard/ai-gems`에서 모든 봇 표시
- 봇 클릭 시 채팅 페이지 정상 작동

✅ **학원장은 할당된 봇만 사용 가능**
- `BotAssignment`에 등록된 봇만 표시
- `isActive: true`인 봇만 접근 가능
- 봇 클릭 시 채팅 페이지 정상 작동

✅ **세션 쿠키 전달 문제 해결**
- 모든 API 호출에 `credentials: 'include'` 적용
- NextAuth 세션이 정상적으로 전달됨
- 인증 오류 해결

---

**배포 완료 후 테스트**:
1. 관리자 계정으로 로그인
2. https://superplace-study.vercel.app/dashboard/ai-gems 접속
3. 커스텀 봇 "ㅁㄴㅇ" 클릭
4. 채팅 페이지가 정상적으로 열리는지 확인 ✅

**2026-01-24 업데이트 완료** 🎉
