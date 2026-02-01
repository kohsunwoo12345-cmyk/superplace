# 🔍 AI 채팅 봇 클릭 문제 해결 가이드

## 문제: "사용 가능한 봇이 클릭이 안됨"

---

## 📋 체크리스트

### 1️⃣ 로그인 확인
```
❓ 현재 로그인되어 있나요?
→ https://superplace-study.vercel.app/auth/signin
→ director@ggume.com 또는 본인 계정으로 로그인
```

### 2️⃣ 브라우저 콘솔 확인
```
1. F12 (개발자 도구) 열기
2. Console 탭 선택
3. 봇 클릭 시 로그 확인:
   - 🤖 봇 클릭됨: 정혜진 정혜진 봇
   - 📡 봇 할당 API 호출 중...
   - 📡 봇 할당 응답 상태: 200
   - ✅ 봇 할당 성공: ...
   - 🔄 페이지 이동 중...
   - ✅ 봇 클릭 처리 완료!
```

### 3️⃣ 네트워크 확인
```
1. F12 → Network 탭
2. 봇 클릭
3. "auto-assign" 요청 확인:
   - 상태: 200 OK ✅
   - 상태: 401 Unauthorized ❌ (로그인 필요)
   - 상태: 500 Error ❌ (서버 오류)
```

---

## 🐛 가능한 문제들

### 문제 1: 로그인 안 됨
**증상**: 페이지가 계속 로그인 페이지로 리다이렉트
**해결**: 
```bash
1. https://superplace-study.vercel.app/auth/signin
2. director@ggume.com 로그인
3. 다시 /ai-chat 접속
```

### 문제 2: JavaScript 오류
**증상**: 버튼 클릭 시 아무 반응 없음
**해결**: F12 → Console에서 에러 메시지 확인

### 문제 3: API 오류
**증상**: 콘솔에 "봇 할당 실패" 메시지
**해결**: 
- 401 오류 → 로그인 필요
- 404 오류 → 봇을 찾을 수 없음
- 500 오류 → 서버 오류 (재시도)

### 문제 4: 버튼이 비활성화됨
**증상**: 버튼이 회색으로 표시되고 클릭 안 됨
**해결**: 페이지 새로고침 (Ctrl+F5)

---

## 🧪 디버깅 단계

### 단계 1: 브라우저 콘솔 열기
```
1. 페이지 접속: https://superplace-study.vercel.app/ai-chat
2. F12 눌러서 개발자 도구 열기
3. Console 탭 선택
```

### 단계 2: 봇 클릭 테스트
```
1. "정혜진 봇" 클릭
2. 콘솔에서 로그 확인:
   
   예상되는 로그:
   ✅ 🤖 봇 클릭됨: 정혜진 정혜진 봇
   ✅ 📡 봇 할당 API 호출 중...
   ✅ 📡 봇 할당 응답 상태: 200
   ✅ ✅ 봇 할당 성공: 봇이 자동으로 할당되었습니다.
   ✅ 🔄 페이지 이동 중...
   ✅ ✅ 봇 클릭 처리 완료!
```

### 단계 3: 네트워크 요청 확인
```
1. F12 → Network 탭
2. 봇 클릭
3. "auto-assign" 찾기
4. 상태 코드 확인:
   - 200: 성공 ✅
   - 401: 로그인 필요 ❌
   - 404: 엔드포인트 없음 ❌
   - 500: 서버 오류 ❌
```

---

## 🔧 즉시 테스트 방법

### 방법 1: API 직접 테스트
```bash
# 1. 로그인 상태에서
# 2. F12 → Console에서 실행:

fetch('/api/bot/auto-assign', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ botId: '정혜진 봇' })
})
.then(r => r.json())
.then(d => console.log('결과:', d))
.catch(e => console.error('오류:', e));
```

**예상 결과:**
```json
{
  "success": true,
  "message": "봇이 자동으로 할당되었습니다.",
  "bot": { ... },
  "autoAssigned": true
}
```

### 방법 2: 디버그 API 확인
```bash
# 터미널에서:
curl https://superplace-study.vercel.app/api/bot/debug | jq .

# 확인 사항:
# - allBots: 봇 목록이 있는지
# - session.authenticated: true인지
```

---

## 📞 문제 리포트

다음 정보를 알려주시면 정확한 원인을 찾을 수 있습니다:

### 수집할 정보:
```
1. 로그인 상태: [ ] 로그인됨 [ ] 로그인 안됨
2. 브라우저: Chrome / Safari / Firefox / Edge
3. 콘솔 에러 메시지: (있다면 복사)
4. 네트워크 상태 코드: (200? 401? 500?)
5. 봇 목록 표시: [ ] 보임 [ ] 안 보임
```

---

## 🚀 배포 상태

- **최신 커밋**: b6ed783 - debug: 봇 클릭 디버깅 로그 추가
- **배포 시간**: 약 2-3분 전
- **배포 URL**: https://superplace-study.vercel.app/ai-chat
- **상태**: 🟢 정상

---

## ✅ 테스트 시나리오

### 정상 작동 시나리오:
```
1. 로그인 (director@ggume.com)
   ↓
2. /ai-chat 접속
   ↓
3. 왼쪽 사이드바에 "🤖 사용 가능한 봇" 섹션 표시
   ↓
4. "📒 정혜진" 클릭
   ↓
5. 콘솔에 로그 출력
   ↓
6. 새 채팅 화면으로 이동
   ↓
7. URL: /ai-chat?botId=정혜진%20봇
   ↓
8. 채팅 입력창 표시
   ↓
9. ✅ 메시지 전송 가능
```

---

## 🆘 긴급 해결 방법

### 방법 A: 하드 리프레시
```
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

### 방법 B: 캐시 삭제
```
1. F12 → Application 탭
2. Clear storage
3. "Clear site data" 클릭
4. 페이지 새로고침
```

### 방법 C: 시크릿 모드
```
1. Ctrl + Shift + N (Chrome)
2. 로그인
3. /ai-chat 접속
4. 봇 클릭 테스트
```

---

**배포 완료 후 (2-3분 후) 다시 테스트해보세요!**

문제가 계속되면 위의 디버깅 정보를 공유해주세요! 🙏
