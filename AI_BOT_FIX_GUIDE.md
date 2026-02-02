# AI 봇 사용 안됨 - 해결 방법

## 🔍 문제 원인

AI 봇이 작동하지 않는 이유:

1. **환경 변수 미설정** ❌
   - `GOOGLE_GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`가 Vercel에 설정되지 않음
   
2. **봇 할당 문제** (가능성 낮음)
   - 사용자에게 AI 봇이 할당되지 않음

---

## ✅ 해결 방법

### 1단계: Vercel에 Google Gemini API 키 설정

1. **Vercel Dashboard 접속**:
   ```
   https://vercel.com/dashboard
   ```

2. **superplace 프로젝트 선택**

3. **Settings 탭 → Environment Variables** 클릭

4. **새 환경 변수 추가**:
   - **Name**: `GOOGLE_GEMINI_API_KEY`
   - **Value**: `AIzaSyAAu9N0kySmg_AAQZ6huNqIuc-aCykYSaw` (기존 키)
   - **Environments**: Production, Preview, Development 모두 체크
   - **Save** 클릭

5. **재배포 필요**:
   - Deployments 탭으로 이동
   - 최신 배포의 [...] → "Redeploy" 클릭
   - "Use existing Build Cache" 체크 해제
   - "Redeploy" 버튼 클릭

---

### 2단계: 봇 할당 확인 (관리자용)

관리자 계정으로 로그인 후:

1. **봇 관리 페이지 접속**:
   ```
   https://superplace-study.vercel.app/dashboard/admin/ai-bots-management
   ```

2. **사용자에게 봇 할당**:
   - 할당할 사용자 선택
   - 사용 가능한 봇 선택
   - "할당" 버튼 클릭

---

## 🧪 테스트 방법

### 1. AI 봇 페이지 접속
```
https://superplace-study.vercel.app/dashboard/ai-gems
```

### 2. 봇 클릭
- 사용 가능한 봇 목록이 표시되어야 함
- 봇을 클릭하면 채팅 페이지로 이동

### 3. 메시지 전송
- 메시지 입력 후 전송
- AI 응답이 표시되어야 함

---

## 🔧 기술적 상세

### 사용 중인 AI 모델
- **Primary**: `gemini-2.0-flash-exp` (최신)
- **Fallback 1**: `gemini-1.5-flash`
- **Fallback 2**: `gemini-1.5-pro`

### API 엔드포인트
- **봇 목록**: `/api/ai-bots`
- **봇 채팅**: `/api/bot/chat`
- **봇 할당**: `/api/bot/auto-assign`

### 환경 변수
```env
GOOGLE_GEMINI_API_KEY=AIzaSyAAu9N0kySmg_AAQZ6huNqIuc-aCykYSaw
# 또는
GOOGLE_API_KEY=AIzaSyAAu9N0kySmg_AAQZ6huNqIuc-aCykYSaw
```

---

## 📝 참고사항

### 기존 환경 변수 (README.md에서)
```env
GOOGLE_GEMINI_API_KEY="AIzaSyAAu9N0kySmg_AAQZ6huNqIuc-aCykYSaw"
```

이 키를 Vercel Environment Variables에 추가하면 AI 봇이 작동합니다!

---

## 🚨 오류 메시지별 해결 방법

### "AI 서비스가 설정되지 않았습니다"
→ Vercel에 `GOOGLE_GEMINI_API_KEY` 환경 변수 추가

### "이 봇에 대한 접근 권한이 없습니다"
→ 관리자가 사용자에게 봇 할당 필요

### "API 키가 유효하지 않습니다"
→ API 키 재확인 및 재설정

### "API 할당량이 초과되었습니다"
→ Google Cloud Console에서 할당량 확인

---

## ✅ 완료 체크리스트

- [ ] Vercel에 `GOOGLE_GEMINI_API_KEY` 환경 변수 추가
- [ ] Vercel에서 재배포 (캐시 제외)
- [ ] 사용자에게 AI 봇 할당 (관리자)
- [ ] AI 봇 페이지 접속 테스트
- [ ] 메시지 전송 및 응답 확인

---

## 🔗 참고 링크

- Vercel Dashboard: https://vercel.com/dashboard
- AI 봇 페이지: https://superplace-study.vercel.app/dashboard/ai-gems
- 봇 관리 페이지: https://superplace-study.vercel.app/dashboard/admin/ai-bots-management
- Google Cloud Console: https://console.cloud.google.com/apis
