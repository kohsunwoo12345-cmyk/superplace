# 🔍 학생/원장 계정 오류 진단 방법

**작성 시간**: 2026-03-18 12:40 UTC  
**상태**: 디버깅 도구 배포 완료

---

## 🎯 문제 상황

- ✅ **관리자 계정**: AI 챗봇 정상 작동
- ❌ **학생/원장 계정**: 오류 발생
- ✅ **API 직접 테스트 (curl)**: 정상 작동

---

## 🔧 디버깅 도구 사용 방법

### 방법 1: 인터랙티브 웹 도구 (추천) ⭐

1. **디버그 페이지 접속**:
   ```
   https://suplacestudy.com/debug-tool.html
   ```

2. **학생 또는 원장 계정으로 로그인**

3. **각 버튼을 순서대로 클릭**:
   - ① 사용자 정보 확인
   - ② 할당된 봇 목록 조회
   - ③ AI 챗 API 테스트
   - ④ 봇 접근 권한 체크 (학생만)
   - ⑤ 전체 테스트 실행

4. **결과 확인**:
   - ✅ 초록색: 정상
   - ❌ 빨간색: 오류
   - ⚠️ 노란색: 경고

5. **스크린샷 공유**:
   - 오류가 발생한 섹션의 결과를 스크린샷으로 캡처하여 공유

---

### 방법 2: 브라우저 개발자 도구

1. **학생/원장 계정으로 로그인**

2. **F12** 눌러 개발자 도구 열기

3. **Console 탭**으로 이동

4. 아래 코드를 복사하여 붙여넣기:

```javascript
// 전체 테스트 실행
(async function() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  console.log('👤 사용자:', {id: user.id, role: user.role, academyId: user.academyId});
  
  const botsResp = await fetch(`/api/user/ai-bots?academyId=${user.academyId}&userId=${user.id}`);
  const botsData = await botsResp.json();
  console.log('🤖 봇 목록:', botsData);
  
  if (botsData.bots && botsData.bots.length > 0) {
    const chatResp = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        message: '안녕하세요',
        botId: botsData.bots[0].id,
        userId: user.id,
        conversationHistory: []
      })
    });
    const chatData = await chatResp.json();
    console.log('💬 AI 챗 응답:', chatData);
  }
})();
```

5. **결과를 스크린샷으로 캡처**하여 공유

---

### 방법 3: Network 탭 확인

1. **F12** → **Network** 탭

2. **학생/원장 계정**으로 AI 챗봇 사용

3. **ai-chat** 요청 클릭

4. **Response** 탭에서 실제 응답 확인

5. 다음 정보를 확인:
   - **Status Code**: `200`, `400`, `401`, `403`, `500` 등
   - **Response Body**: JSON 응답 내용
   - **에러 메시지**: `message`, `error` 필드

---

## 🔍 예상되는 오류 원인

### 1. 봇이 할당되지 않음
**증상**: "할당된 봇이 없습니다"  
**원인**: 학생에게 봇이 할당되지 않음  
**해결**: 관리자 페이지에서 학생에게 봇 할당

### 2. 구독 만료
**증상**: "학원 구독이 만료되었습니다"  
**원인**: 학원의 봇 구독 기간이 지남  
**해결**: 관리자 페이지에서 구독 연장

### 3. 할당 기간 만료
**증상**: "개인 할당 기간이 만료되었습니다"  
**원인**: 학생 개별 할당 기간이 지남  
**해결**: 관리자 페이지에서 할당 기간 연장

### 4. 학생 수 제한 초과
**증상**: "구독 학생 수를 초과했습니다"  
**원인**: 활성 학생 수가 구독 인원을 초과  
**해결**: 
- 관리자 페이지에서 학생 slot 수 증가
- 또는 비활성 학생 제거

### 5. API 오류 (500)
**증상**: "오류가 발생했습니다"  
**원인**: 서버 내부 오류  
**해결**: Cloudflare Logs 확인 필요

---

## 📊 Cloudflare Logs 확인 방법

### 터미널에서:
```bash
cd /home/user/webapp
npx wrangler pages deployment tail --project-name=superplacestudy
```

### 또는 Dashboard에서:
1. https://dash.cloudflare.com/
2. Pages → superplace
3. Logs → Real-time Logs
4. "Begin log stream" 클릭
5. 학생 계정에서 AI 챗 사용
6. 로그에서 에러 메시지 확인

---

## 💡 다음 단계

위 디버깅 방법을 사용하여 다음 정보를 확인해 주세요:

### ✅ 필수 확인 사항:
1. **사용자 정보**:
   - `id`: 사용자 ID
   - `role`: 역할 (`STUDENT`, `DIRECTOR`, `TEACHER`)
   - `academyId`: 학원 ID

2. **봇 목록 조회 결과**:
   - `success`: `true` 또는 `false`
   - `bots.length`: 할당된 봇 개수
   - `bots[0].id`: 첫 번째 봇 ID (있는 경우)

3. **AI 챗 API 응답**:
   - **Status Code**: HTTP 상태 코드
   - **Response**: JSON 응답 내용
   - **에러 메시지**: 실패 시 메시지

4. **Network 탭**:
   - **ai-chat 요청**: 실제 전송된 데이터
   - **Response**: 서버가 반환한 응답

---

## 📂 관련 파일

### 디버깅 도구:
- `/debug-tool.html` - 인터랙티브 디버깅 웹 페이지
- `/DEBUG_STUDENT_ACCOUNT_ISSUE.md` - 상세 디버깅 가이드

### API 엔드포인트:
- `/api/user/ai-bots` - 학생 봇 목록 조회
- `/api/user/academy-bots` - 원장 봇 목록 조회
- `/api/user/bot-access-check` - 봇 접근 권한 체크
- `/api/ai-chat` - AI 챗봇 API

### 주요 코드:
- `src/app/ai-chat/page.tsx` - AI 챗봇 페이지 (프론트엔드)
- `functions/api/ai-chat.ts` - AI 챗봇 API (백엔드)
- `functions/api/user/ai-bots.js` - 봇 목록 API
- `functions/api/user/bot-access-check.js` - 권한 체크 API

---

## 🎯 현재 상태

### ✅ 완료된 작업:
1. ✅ RAG 시스템 100% 작동
2. ✅ System Prompt 100% 적용
3. ✅ 모든 봇 정상 작동 (5/5)
4. ✅ 관리자 계정 정상 작동
5. ✅ API 테스트 (curl) 정상 작동

### ⚠️ 확인 필요:
- ⚠️ 학생/원장 계정에서 발생하는 정확한 오류 메시지
- ⚠️ 봇 할당 상태 확인
- ⚠️ 구독 상태 확인
- ⚠️ 권한 체크 결과 확인

---

## 📞 도움 요청 시 필요한 정보

오류를 공유할 때 다음 정보를 포함해 주세요:

1. **사용자 역할**: `STUDENT`, `DIRECTOR`, `TEACHER`
2. **오류 발생 위치**: 디버그 도구의 어느 섹션에서?
3. **스크린샷**: 
   - 디버그 도구 결과
   - 브라우저 Console 로그
   - Network 탭 Response
4. **에러 메시지**: 정확한 오류 메시지 텍스트

---

**작성자**: Claude AI Assistant  
**날짜**: 2026-03-18 12:40 UTC  
**프로젝트**: Superplace Study - 꾸메땅학원  
**최신 Commit**: `44947f80` - "feat: Add comprehensive debugging tools"

🎯 **디버그 페이지**: https://suplacestudy.com/debug-tool.html
